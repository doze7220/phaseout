// logic.js
import { GameState, CONNECTION_THRESHOLD, LIFE_CONFIG, AppConfig, LEVEL_CONFIG, STAGE_DATA, getScoreRate, CORE_MATH_CONFIG, THEME_COLORS, PHASE_SHIFT_MATH, SPAWN_CONFIG } from './config.js';
import { findChainGroup } from './ChainAlgorithm.js';
import { calculateChainScore } from './score.js';
import { LAYOUT_CONFIG } from './LayoutConfig.js';
import { animateLaserLevels, spawnParticles, triggerScreenShake, hideChainPopup, showScorePopup, showChainPopup, togglePinchEffect, clearLasers, showFloatingNumber, triggerVisualizerSpike, playStageBgmSet, switchStageBgmState, setStageBgmVolumeRatio, playSceneBGM, playSE, showLevelUpPopup, spawnPrismFluctuation } from '../render/effects.js';
import { GaugeManager } from '../render/GaugeManager.js';
import { createGem } from './physics.js';
import { showResultOverlay } from '../render/scene.js';
import { SceneManager } from './SceneManager.js';
import { ResultScene } from '../scene/ResultScene.js';
import { InputManager } from './InputManager.js';
import { StageManager } from './StageManager.js';
import { PhaseManager, PHASE_WHITE, PHASE_NORMAL, PHASE_GAMEOVER, PHASE_BLACK, PHASE_BLACK_ENTER, PHASE_BLACK_EXIT } from './PhaseManager.js';
import { BLACK_PHASE_EFFECT_CONFIG } from './effectConfig.js';
import { AUDIO_ASSETS } from './audioConfig.js';

let pointerDownHandler = null;
let beforeUpdateHandler = null;

function checkGameOver() {
    if (GameState.life <= 0 && !GameState.isGameOver) {
        PhaseManager.setGameOver();
    }
}

function determineCurrentBgmState() {
    if (GameState.life <= GameState.maxLife * 0.2) {
        return 'pinch';
    }
    const maxPossibleColors = StageManager.getMaxActiveColors();
    if (GameState.activeColors && GameState.activeColors.length >= maxPossibleColors) {
        return 'fever';
    }
    return 'normal';
}

function updateBgmState() {
    const newState = determineCurrentBgmState();
    const oldState = GameState.currentBgmState;

    if (newState !== oldState) {
        if (newState === 'pinch') {
            playSE('PINCH_WARNING');
        }
        switchStageBgmState(newState);
        GameState.currentBgmState = newState;
    }

    // 残りHPが最大値の20%〜0%に行くに従い、BGMボリュームを0%に近づける
    const fadeThreshold = GameState.maxLife * 0.2;
    const ratio = Math.max(0.0, Math.min(1.0, GameState.life / fadeThreshold));
    setStageBgmVolumeRatio(ratio);
}


export function setupGameLogic(engine, render) {
    // 初回UI更新
    GaugeManager.init(GameState.life);
    togglePinchEffect(false);
    // Date.now() による記録を廃止し、playTimeMsを内部加算する方式へ移行

    // BGM抽選 (audioConfig.jsに登録された有効なBGMセットから自動抽出)
    const availableBgmSets = Object.keys(AUDIO_ASSETS.STAGE_BGM_SETS || {});
    if (availableBgmSets.length > 0) {
        const selectedBgmSet = availableBgmSets[Math.floor(Math.random() * availableBgmSets.length)];
        GameState.selectedBgmSet = selectedBgmSet;
    } else {
        // フォールバック
        GameState.selectedBgmSet = 'SET_01';
    }

    // BGM初期状態の判定（最初から色がマックス等の場合に対応）
    GameState.currentBgmState = determineCurrentBgmState();

    pointerDownHandler = (pos, e) => {
        if (!PhaseManager.isNormalPhase()) return;
        if (GameState.isAnimating || GameState.isGameOver) return;

        const mousePosition = pos;

        const { Query } = window.Matter;
        const clickedBodies = Query.point(GameState.GEMS, mousePosition);

        if (clickedBodies.length > 0) {
            const clickedGem = clickedBodies[0];
            if (!clickedGem.isMarkedForDeletion) {
                // ブラックフェイズ中はブレイクゲージの回復のみ行い、連鎖・破壊処理をキャンセルする
                if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
                    const restoreAmount = PHASE_SHIFT_MATH.BLACK_TAP_RESTORE;
                    PhaseManager.breakGauge = Math.min(1000, PhaseManager.breakGauge + restoreAmount);
                    PhaseManager.lastBreakGaugeAdd = restoreAmount;
                    GameState.blackHoleVisualPulse = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE_PULSE_ADD;
                    playSE('TAP');
                    return;
                }

                // タップ時LIFE消費 (ホワイトフェイズ中は消費なし)
                if (PhaseManager.getCurrentPhaseName() !== PHASE_WHITE) {
                    const tapCost = (LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
                    GameState.life -= tapCost;
                    if (GameState.life < 0) GameState.life = 0; // 下限クランプ（過剰なマイナスでチェイン回復が追いつかない問題の対策）
                    checkGameOver();
                    updateBgmState();

                    GaugeManager.triggerDamage(GameState.life);
                    togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
                    showFloatingNumber('-' + Math.floor(tapCost), 'damage', clickedGem.position.x, clickedGem.position.y, 0);
                }
                playSE('TAP');

                // タップされた宝石にエフェクト用タイマーを設定（約10フレーム）
                clickedGem.render = clickedGem.render || {};
                clickedGem.render.tapEffectTimer = 10;
                clickedGem.render.isTapOrigin = true; // 脈打ちと火花の起点フラグ

                startChain(clickedGem);
            }
        }
    };
    InputManager.onPointerDown(pointerDownHandler);


    // 時間経過によるLIFE減少処理
    beforeUpdateHandler = () => {
        // performance.now() の差分を使うと暗転等でスキップされた際にTime Spikeが発生するため
        // 物理エンジンの固定ステップ（1000/60 ms）を直接加算するよう改修
        const deltaTime = 1000 / 60;

        // ステイシス状態（timeScale === 0）やゲームオーバー時以外は内部時間を進める
        if (GameState.engine && GameState.engine.timing.timeScale > 0 && !GameState.isGameOver && !GameState.isPuzzlePaused) {
            GameState.playTimeMs += deltaTime;
        }

        if (!GameState.isPuzzlePaused) {
            // 1. 動的補充ロジック
            GameState.spawnFrameCounter = (GameState.spawnFrameCounter || 0) + 1;
            
            const phaseName = PhaseManager.getCurrentPhaseName();
            let currentInterval = SPAWN_CONFIG.SPAWN_INTERVAL_FRAMES.NORMAL;
            let currentRate = SPAWN_CONFIG.SPAWN_RATE.NORMAL;
            
            if (phaseName === PHASE_BLACK || phaseName === PHASE_BLACK_ENTER || phaseName === PHASE_BLACK_EXIT) {
                currentInterval = SPAWN_CONFIG.SPAWN_INTERVAL_FRAMES.BLACK;
                currentRate = SPAWN_CONFIG.SPAWN_RATE.BLACK;
            } else if (phaseName === PHASE_WHITE) {
                currentInterval = SPAWN_CONFIG.SPAWN_INTERVAL_FRAMES.WHITE;
                currentRate = SPAWN_CONFIG.SPAWN_RATE.WHITE;
            }

            if (GameState.spawnFrameCounter >= currentInterval) {
                GameState.spawnFrameCounter = 0; // カウンタのリセット
                
                const deficit = SPAWN_CONFIG.MAX_ACTIVE_GEMS - GameState.GEMS.length;
                if (deficit > 0) {
                    const attempts = Math.ceil(deficit / SPAWN_CONFIG.SPAWN_BATCH_DIVISOR);
                    for (let i = 0; i < attempts; i++) {
                        if (GameState.GEMS.length >= SPAWN_CONFIG.MAX_ACTIVE_GEMS) break;
                        if (Math.random() <= currentRate) {
                            const x = 50 + Math.random() * (LAYOUT_CONFIG.BASE.WIDTH - 100);
                            const y = LAYOUT_CONFIG.BASE.HEADER_HEIGHT - 150 - Math.random() * 50;
                            const gem = createGem(x, y);
                            window.Matter.Composite.add(GameState.engine.world, gem);
                            GameState.GEMS.push(gem);
                        }
                    }
                }
            }
        }

        // 毎フレームのゲージ状態更新
        // (GaugeManager.updateはパズル時間に依存させるためeffects.js側の更新ループへ移譲)

        if (GaugeManager.isDecayPaused()) return; // アニメーション中は自然消費ストップ

        // パズルが止まっている（コンフィグ等）場合は消費をストップ
        if (GameState.isPuzzlePaused || (GameState.engine && GameState.engine.timing.timeScale === 0)) return;

        // ブラックフェイズ中の特異点（ブラックホール）引力と吸い込み処理
        if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
            const cx = LAYOUT_CONFIG.BASE.WIDTH / 2;
            const cy = LAYOUT_CONFIG.BASE.HEIGHT / 2;
            const config = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE;
            const forceMag = config.ATTRACTOR_FORCE;
            const horizonSq = config.EVENT_HORIZON_RADIUS ** 2;
            const outOfBoundsSq = config.OUT_OF_BOUNDS_RADIUS ** 2;
            const swallowedGems = [];

            for (const gem of GameState.GEMS) {
                if (gem.isMarkedForDeletion) continue;

                const dx = cx - gem.position.x;
                const dy = cy - gem.position.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= horizonSq || distSq > outOfBoundsSq) {
                    gem.isMarkedForDeletion = true;
                    swallowedGems.push(gem);
                } else {
                    // 速度減衰（遠心力を殺して中心へ向かわせる）
                    window.Matter.Body.setVelocity(gem, {
                        x: gem.velocity.x * config.VELOCITY_DAMPING,
                        y: gem.velocity.y * config.VELOCITY_DAMPING
                    });

                    const dist = Math.sqrt(distSq);
                    const forceX = (dx / dist) * forceMag * gem.mass;
                    const forceY = (dy / dist) * forceMag * gem.mass;
                    window.Matter.Body.applyForce(gem, gem.position, { x: forceX, y: forceY });
                }
            }

            if (swallowedGems.length > 0) {
                finalizeDestruction(swallowedGems, { x: cx, y: cy }, 1, 0);
            }
        }

        if (!PhaseManager.isNormalPhase()) return;

        if (PhaseManager.getCurrentPhaseName() !== PHASE_WHITE) {
            const decay = (LIFE_CONFIG.INITIAL_DECAY * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
            GameState.life -= decay;
            if (GameState.life < 0) GameState.life = 0; // 下限クランプ（過剰なマイナスでチェイン回復が追いつかない問題の対策）
            if (!GameState.isAnimating) {
                checkGameOver();
            }
            updateBgmState();

            togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
        }
    };
    window.Matter.Events.on(engine, 'beforeUpdate', beforeUpdateHandler);
}

export function getCurrentLifeDecayRate() {
    if (PhaseManager.getCurrentPhaseName() === PHASE_WHITE) return 0;
    const baseDecayPerFrame = (LIFE_CONFIG.INITIAL_DECAY * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
    const decayPerSecond = baseDecayPerFrame * 60; // 60FPS想定
    return decayPerSecond;
}

export function removeGameLogic() {
    if (pointerDownHandler) {
        InputManager.offPointerDown(pointerDownHandler);
        pointerDownHandler = null;
    }
    if (beforeUpdateHandler && GameState.engine) {
        window.Matter.Events.off(GameState.engine, 'beforeUpdate', beforeUpdateHandler);
        beforeUpdateHandler = null;
    }
}

// areGemsTouching / getAdjacencyList は ChainAlgorithm.js へ移行済み

function startChain(startGem) {
    GameState.isAnimating = true;

    const activeGems = GameState.GEMS.filter(g => !g.isMarkedForDeletion);

    const isWhitePhase = PhaseManager.getCurrentPhaseName() === PHASE_WHITE;

    // 探索アルゴリズムを ChainAlgorithm.js へ委譲
    const { chainGems, levels } = findChainGroup(
        startGem, activeGems, CONNECTION_THRESHOLD, GameState.debug.bfsMultiplier, isWhitePhase
    );

    const targetColorStr = startGem.colorStr;

    chainGems.forEach(gem => gem.isMarkedForDeletion = true);

    animateLaserLevels(levels, chainGems, targetColorStr, (prismDepth) => {
        finalizeDestruction(chainGems, { x: startGem.position.x, y: startGem.position.y }, levels.length, prismDepth);
    }, isWhitePhase);
}

function finalizeDestruction(chain, tapPos, maxDepth = 1, prismDepth = 0) {
    const n = chain.length;
    let scoreCount = n;
    if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
        GameState.blackHoleChainCount += n;
        scoreCount = GameState.blackHoleChainCount;
    }

    const fx = tapPos ? tapPos.x : chain[0].position.x;
    const fy = tapPos ? tapPos.y : chain[0].position.y;

    // ─── 事前集計: 色別の破壊数マップを構築 ───
    const colorCounts = {};   // { colorStr: 個数 }
    for (const gem of chain) {
        colorCounts[gem.colorStr] = (colorCounts[gem.colorStr] || 0) + 1;
    }

    // ─── 破壊数の加算（色別に正確に加算）【EXP計算より先に実行】 ───
    for (const [color, count] of Object.entries(colorCounts)) {
        GameState.colorDestroyCounts[color] = (GameState.colorDestroyCounts[color] || 0) + count;
    }

    // ─── EXP計算 ───
    let finalExp = 0;
    
    if (PhaseManager.getCurrentPhaseName() === PHASE_WHITE) {
        // ホワイトフェイズ中: チェイン減算と色加重をスキップし、宝石数1につきEXP1
        finalExp = n;
    } else if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
        // ブラックフェイズ中: ホワイト同様に1つにつきEXP1とする
        finalExp = n;
    } else {
        // A. 大チェイン減衰（従来通り）
        const baseExp = Math.round(n * (CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY / (n + CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY)));

        // B. 全色中の最小破壊数（基準値）の取得
        let minDestroyCount = Infinity;
        const unlockedColors = Object.keys(GameState.colorDestroyCounts);
        if (unlockedColors.length > 0) {
            for (const color of unlockedColors) {
                if (GameState.colorDestroyCounts[color] < minDestroyCount) {
                    minDestroyCount = GameState.colorDestroyCounts[color];
                }
            }
        } else {
            minDestroyCount = 0;
        }

        // C. 加重平均による最終効率の算出
        let weightedEfficiency = 0;
        if (minDestroyCount > 0) {
            for (const [color, count] of Object.entries(colorCounts)) {
                const colorEfficiency = minDestroyCount / GameState.colorDestroyCounts[color];
                weightedEfficiency += colorEfficiency * (count / n);
            }
        }

        // D. 最終獲得EXPの決定
        finalExp = (minDestroyCount > 0) ? Math.ceil(baseExp * weightedEfficiency) : baseExp;
    }

    finalExp *= GameState.debug.expMultiplier;

    // EXP加算
    if (finalExp > 0) {
        if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
            GameState.blackHolePooledExp += finalExp;
        } else {
            GameState.exp += finalExp;
            GameState.totalExp += finalExp;
            showFloatingNumber('+' + finalExp, 'exp', fx, fy, 500);
        }
    }

    // ビジュアライザスパイク（含まれる各色に対してトリガー）
    for (const color of Object.keys(colorCounts)) {
        triggerVisualizerSpike(color);
    }

    // 破壊SEリクエスト（SoundManager側で自動スケジューリング）
    for (let i = 0; i < n; i++) {
        playSE('BREAK');
    }

    // フェイズシフトゲージ加算処理（フルリンク達成時のみ）
    if (prismDepth >= 6) {
        const addedGauge = PhaseManager.addPhaseGauge(n, prismDepth);
        
        if (PhaseManager.getCurrentPhaseName() === PHASE_NORMAL && chain && chain.length > 0) {
            const baseGem = chain[0];
            let colorHex = baseGem.colorStr;
            if (!colorHex.startsWith('#')) {
                colorHex = THEME_COLORS[colorHex.toUpperCase()] || THEME_COLORS[colorHex] || '#ffffff';
            }
            spawnPrismFluctuation(fx, fy, colorHex, addedGauge);
        }
    }

    // --- スコア・回復処理 (scoreCount >= 3) ---
    if (scoreCount >= 3) {
        let points = calculateChainScore(scoreCount, maxDepth, PhaseManager.getCurrentPhaseName(), GameState.level);
        points *= GameState.debug.scoreMultiplier;

        if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
            GameState.blackHolePooledScore += points;
        } else {
            GameState.actualScore += points;
        }

        // スコアの色別按分（BigInt精度での計算）
        const totalN = BigInt(n);
        let distributedSum = 0n;
        const colorEntries = Object.entries(colorCounts);
        
        for (let i = 0; i < colorEntries.length; i++) {
            const [color, count] = colorEntries[i];
            let share;
            if (i === colorEntries.length - 1) {
                // 最後の色は端数調整（総和の整合性を保証）
                share = points - distributedSum;
            } else {
                share = (points * BigInt(count)) / totalN;
                distributedSum += share;
            }
            GameState.totalScorePerColor[color] = (GameState.totalScorePerColor[color] || 0n) + share;
        }

        // 支配色（連鎖内で最も多い色）の決定
        const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];

        if (points > GameState.maxScorePerTap) {
            GameState.maxScorePerTap = points;
            GameState.maxScoreColor = dominantColor;
        }
        if (scoreCount > GameState.maxChain) {
            GameState.maxChain = scoreCount;
            GameState.maxChainColor = dominantColor;
        }
        // 色ごとの最大連鎖数も更新（各色のcountで個別管理）
        for (const [color, count] of Object.entries(colorCounts)) {
            if (!GameState.maxChainPerColor[color]) {
                GameState.maxChainPerColor[color] = 0;
            }
            if (count > GameState.maxChainPerColor[color]) {
                GameState.maxChainPerColor[color] = count;
            }
        }

        // LIFE回復処理
        const restoreAmount = LIFE_CONFIG.RESTORE_BASE * scoreCount;
        if (PhaseManager.getCurrentPhaseName() === PHASE_BLACK) {
            GameState.blackHolePooledLife += restoreAmount;
            // 専用の恒常描画処理に任せるため、既存のポップアップ呼び出しはミュート
        } else {
            GameState.life += restoreAmount;
            if (GameState.life > GameState.maxLife) {
                GameState.life = GameState.maxLife;
            }
            showFloatingNumber('+' + restoreAmount, 'heal', fx, fy, 0);

            // LIFE回復によるゲームオーバーキャンセル（正規のキャンセルプロトコルを経由）
            if (GameState.life > 0 && GameState.isGameOver) {
                PhaseManager.cancelGameOver();
            }

            // 経験値によるレベルアップ判定
            let leveledUp = false;
            let oldLevel = GameState.level;
            let oldRate = getScoreRate(oldLevel);
            let oldCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, oldLevel - 1);

            while (GameState.exp >= GameState.nextLevelExp) {
                GameState.exp -= GameState.nextLevelExp;
                GameState.level++;
                GameState.nextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * (LEVEL_CONFIG.EXP_CURVE_MULTIPLIER ** (GameState.level - 1)));
                leveledUp = true;
                playSE('LEVELUP');
            }

            if (leveledUp) {
                let newRate = getScoreRate(GameState.level);
                let newCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
                // import された effects.js の関数を呼び出す
                showLevelUpPopup(oldLevel, GameState.level, oldRate, newRate, oldCost, newCost);
                // ステージマネージャへレベルアップを通知（新色アンロック処理）
                StageManager.onLevelUp(GameState.level);
            }

            updateBgmState();

            GaugeManager.triggerHeal(GameState.life);
            togglePinchEffect(GameState.life < GameState.maxLife * 0.15);

            showScorePopup(points.toString());
            triggerScreenShake();
        }
    } else {
        hideChainPopup();
    }

    const { Composite } = window.Matter;

    chain.forEach(gem => {
        spawnParticles(gem.position.x, gem.position.y, gem.colorStr);

        // スコア表示用（リザルト画面での集計）
        if (!GameState.stats[gem.colorStr]) {
            GameState.stats[gem.colorStr] = 0;
        }
        GameState.stats[gem.colorStr]++;

        Composite.remove(GameState.engine.world, gem);
        const index = GameState.GEMS.indexOf(gem);
        if (index !== -1) {
            GameState.GEMS.splice(index, 1);
        }
    });

    // トップ破壊色の検知とオーラ反映 (Order 10aにより削除)
    // aura-colorの更新を行わない

    clearLasers();

    // 補充処理は毎フレームの動的補充(beforeUpdateHandler)に移行したため削除

    GameState.isAnimating = false;
    
    // チェイン終了時点でLIFEが0以下であればゲームオーバー確定
    checkGameOver();
}

export function flushBlackHolePool() {
    if (GameState.blackHolePooledScore > 0n || GameState.blackHolePooledExp > 0 || GameState.blackHolePooledLife > 0) {
        const scoreToAdd = GameState.blackHolePooledScore;
        const expToAdd = GameState.blackHolePooledExp;
        const lifeToAdd = GameState.blackHolePooledLife;

        GameState.actualScore += scoreToAdd;
        
        GameState.exp += expToAdd;
        GameState.totalExp += expToAdd;

        GameState.life += lifeToAdd;
        if (GameState.life > GameState.maxLife) {
            GameState.life = GameState.maxLife;
        }
        if (GameState.life > 0 && GameState.isGameOver) {
            PhaseManager.cancelGameOver();
        }

        // 強烈な画面揺れ
        for (let i = 0; i < BLACK_PHASE_EFFECT_CONFIG.BURST_SHAKE_COUNT; i++) {
            triggerScreenShake();
        }
        
        playSE('BREAK_BURST');

        // 超巨大スコアポップアップ
        showScorePopup(scoreToAdd.toString());

        // レベルアップ判定
        let leveledUp = false;
        let oldLevel = GameState.level;
        let oldRate = getScoreRate(oldLevel);
        let oldCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, oldLevel - 1);

        while (GameState.exp >= GameState.nextLevelExp) {
            GameState.exp -= GameState.nextLevelExp;
            GameState.level++;
            GameState.nextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * (LEVEL_CONFIG.EXP_CURVE_MULTIPLIER ** (GameState.level - 1)));
            leveledUp = true;
            playSE('LEVELUP');
        }

        if (leveledUp) {
            let newRate = getScoreRate(GameState.level);
            let newCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
            showLevelUpPopup(oldLevel, GameState.level, oldRate, newRate, oldCost, newCost);
            StageManager.onLevelUp(GameState.level);
        }

        updateBgmState();
        GaugeManager.triggerHeal(GameState.life);
        togglePinchEffect(GameState.life < GameState.maxLife * 0.15);

        // プールリセット
        GameState.blackHolePooledScore = 0n;
        GameState.blackHolePooledExp = 0;
        GameState.blackHolePooledLife = 0;
        GameState.blackHoleChainCount = 0;
    }
}
