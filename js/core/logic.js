// logic.js
import { GameState, CONNECTION_THRESHOLD, LIFE_CONFIG, AppConfig, LEVEL_CONFIG, STAGE_DATA, getScoreRate, CORE_MATH_CONFIG, THEME_COLORS } from './config.js';
import { findChainGroup } from './ChainAlgorithm.js';
import { calculateChainScore } from './score.js';
import { LAYOUT_CONFIG } from './LayoutConfig.js';
import { animateLaserLevels, spawnParticles, triggerScreenShake, hideChainPopup, showScorePopup, togglePinchEffect, toggleStasisEffect, clearLasers, showFloatingNumber, triggerVisualizerSpike, playStageBgmSet, switchStageBgmState, setStageBgmVolumeRatio, playSceneBGM, playSE, showLevelUpPopup, spawnPrismFluctuation } from '../render/effects.js';
import { GaugeManager } from '../render/GaugeManager.js';
import { createGem } from './physics.js';
import { showResultOverlay } from '../render/scene.js';
import { SceneManager } from './SceneManager.js';
import { ResultScene } from '../scene/ResultScene.js';
import { InputManager } from './InputManager.js';
import { StageManager } from './StageManager.js';
import { PhaseManager, PHASE_WHITE, PHASE_NORMAL } from './PhaseManager.js';

let pointerDownHandler = null;
let beforeUpdateHandler = null;

function checkGameOver() {
    if (GameState.life <= 0 && !GameState.isGameOver) {
        PhaseManager.setGameOver();
    }
}

function updateBgmState() {
    const isPinchNow = GameState.life <= GameState.maxLife * 0.2;

    if (isPinchNow) {
        if (!GameState.isPinch) {
            GameState.isPinch = true;
            playSE('PINCH_WARNING');
            switchStageBgmState('pinch');
        }
    } else {
        if (GameState.isPinch) {
            GameState.isPinch = false;
            switchStageBgmState(GameState.isFever ? 'fever' : 'normal');
        }
    }

    // 残りHPが最大値の20%〜0%に行くに従い、BGMボリュームを0%に近づける
    const fadeThreshold = GameState.maxLife * 0.2;
    const ratio = Math.max(0.0, Math.min(1.0, GameState.life / fadeThreshold));
    setStageBgmVolumeRatio(ratio);

    if (GameState.level >= 7 && !GameState.isFever) {
        GameState.isFever = true;
        if (!GameState.isPinch) {
            switchStageBgmState('fever');
        }
    }
}


export function setupGameLogic(engine, render) {
    // 初回UI更新
    GaugeManager.init(GameState.life);
    togglePinchEffect(false);
    // Date.now() による記録を廃止し、playTimeMsを内部加算する方式へ移行

    // BGM抽選
    const bgmCandidates = STAGE_DATA.STAGE_01.bgmCandidates;
    const selectedBgmSet = bgmCandidates[Math.floor(Math.random() * bgmCandidates.length)];
    GameState.selectedBgmSet = selectedBgmSet;
    GameState.isPinch = false;
    GameState.isFever = false;

    pointerDownHandler = (pos, e) => {
        if (!PhaseManager.isNormalPhase()) return;
        if (GameState.isAnimating || GameState.isGameOver) return;

        const mousePosition = pos;

        const { Query } = window.Matter;
        const clickedBodies = Query.point(GameState.GEMS, mousePosition);

        if (clickedBodies.length > 0) {
            const clickedGem = clickedBodies[0];
            if (!clickedGem.isMarkedForDeletion) {
                // タップ時LIFE消費 (ホワイトフェイズ中は消費なし)
                if (PhaseManager.getCurrentPhaseName() !== PHASE_WHITE) {
                    const tapCost = (LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
                    GameState.life -= tapCost;
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

        // 毎フレームのゲージ状態更新
        const currentLifeDecayRate = getCurrentLifeDecayRate();
        GaugeManager.update(deltaTime, GameState.life, GameState.maxLife, GameState.exp, GameState.nextLevelExp, currentLifeDecayRate);

        if (GaugeManager.isDecayPaused()) return; // アニメーション中は自然消費ストップ

        // パズルが止まっている（コンフィグ等）場合は消費をストップ
        if (GameState.isPuzzlePaused || (GameState.engine && GameState.engine.timing.timeScale === 0)) return;

        if (!PhaseManager.isNormalPhase()) return;

        if (PhaseManager.getCurrentPhaseName() !== PHASE_WHITE) {
            const decay = (LIFE_CONFIG.INITIAL_DECAY * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
            GameState.life -= decay;
            checkGameOver();
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
        GameState.exp += finalExp;
        GameState.totalExp += finalExp;
        showFloatingNumber('+' + finalExp, 'exp', fx, fy, 500);
    }

    // ビジュアライザスパイク（含まれる各色に対してトリガー）
    for (const color of Object.keys(colorCounts)) {
        triggerVisualizerSpike(color);
    }

    // 破壊SEリクエスト（SoundManager側で自動スケジューリング）
    for (let i = 0; i < n; i++) {
        playSE('BREAK');
    }

    // --- スコア・回復処理 (n >= 3) ---
    if (n >= 3) {
        let points = calculateChainScore(n, maxDepth, PhaseManager.getCurrentPhaseName(), GameState.level);
        points *= GameState.debug.scoreMultiplier;

        GameState.actualScore += points;

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
        if (n > GameState.maxChain) {
            GameState.maxChain = n;
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
        const restoreAmount = LIFE_CONFIG.RESTORE_BASE * n;
        GameState.life += restoreAmount;
        if (GameState.life > GameState.maxLife) {
            GameState.life = GameState.maxLife;
        }
        showFloatingNumber('+' + restoreAmount, 'heal', fx, fy, 0);

        // ここでゲームオーバー判定を上書き（最後のタップでライフが0になっても連鎖で回復した場合の救済）
        if (GameState.life > 0 && GameState.isGameOver) {
            GameState.isGameOver = false;
            if (GameState.engine) {
                GameState.engine.gravity.y = 1;
                GameState.engine.timing.timeScale = 1.0;
            }
            toggleStasisEffect(false);
            // PhaseManagerのステートも戻す
            if (PhaseManager.currentPhase === 'ゲームオーバー演出中') {
                PhaseManager.currentPhase = '通常パズル時';
            }
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

    // 補充処理
    for (let i = 0; i < n; i++) {
        const x = 50 + Math.random() * (LAYOUT_CONFIG.BASE.WIDTH - 100);
        // ヘッダの裏はるか上空 (HEADER_HEIGHT - 150) から降ってくるように
        const y = LAYOUT_CONFIG.BASE.HEADER_HEIGHT - 150 - Math.random() * 50;

        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }

    GameState.isAnimating = false;
}
