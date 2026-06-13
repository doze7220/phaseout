// logic.js
import { GameState, CONNECTION_THRESHOLD, LIFE_CONFIG, AppConfig, LEVEL_CONFIG, STAGE_DATA, getScoreRate, CORE_MATH_CONFIG } from './config.js';
import { LAYOUT_CONFIG } from './LayoutConfig.js';
import { animateLaserLevels, spawnParticles, triggerScreenShake, hideChainPopup, showScorePopup, togglePinchEffect, toggleStasisEffect, clearLasers, showFloatingNumber, triggerVisualizerSpike, playStageBgmSet, switchStageBgmState, setStageBgmVolumeRatio, playSceneBGM, playSE, showLevelUpPopup } from '../render/effects.js';
import { GaugeManager } from '../render/GaugeManager.js';
import { createGem } from './physics.js';
import { showResultOverlay } from '../render/scene.js';
import { SceneManager } from './SceneManager.js';
import { ResultScene } from '../scene/ResultScene.js';
import { InputManager } from './InputManager.js';

let pointerDownHandler = null;
let beforeUpdateHandler = null;

function checkGameOver() {
    if (GameState.life <= 0 && !GameState.isGameOver) {
        GameState.isGameOver = true;
        // フェーズ1: 仮死状態（スローモーション）
        if (GameState.engine) {
            GameState.engine.timing.timeScale = 0.2;
        }
        toggleStasisEffect(true);
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
        if (GameState.isAnimating || GameState.isGameOver) return;

        const mousePosition = pos;

        const { Query } = window.Matter;
        const clickedBodies = Query.point(GameState.GEMS, mousePosition);

        if (clickedBodies.length > 0) {
            const clickedGem = clickedBodies[0];
            if (!clickedGem.isMarkedForDeletion) {
                // タップ時LIFE消費
                const tapCost = (LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
                GameState.life -= tapCost;
                checkGameOver();
                updateBgmState();

                GaugeManager.triggerDamage(GameState.life);
                togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
                showFloatingNumber('-' + Math.floor(tapCost), 'damage', clickedGem.position.x, clickedGem.position.y, 0);
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

    let isResultShown = false;
    let lastTime = performance.now();

    // 時間経過によるLIFE減少処理
    beforeUpdateHandler = () => {
        const now = performance.now();
        const deltaTime = now - lastTime;
        lastTime = now;

        // ステイシス状態（timeScale === 0）やゲームオーバー時以外は内部時間を進める
        if (GameState.engine && GameState.engine.timing.timeScale > 0 && !GameState.isGameOver) {
            GameState.playTimeMs += deltaTime;
        }

        // 毎フレームのゲージ状態更新
        const currentLifeDecayRate = getCurrentLifeDecayRate();
        GaugeManager.update(deltaTime, GameState.life, GameState.maxLife, GameState.exp, GameState.nextLevelExp, currentLifeDecayRate);

        if (GaugeManager.isDecayPaused()) return; // アニメーション中は自然消費ストップ

        // 時間が止まっている（コンフィグ等）場合は消費をストップ
        if (GameState.engine && GameState.engine.timing.timeScale === 0) return;

        if (GameState.isGameOver) {
            if (!GameState.isAnimating && !isResultShown) {
                isResultShown = true;
                // フェーズ2: 停滞の執行（完全停止と脱色）
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 0;
                    GameState.isStasis = true; // 完全停止（物理演算スキップ）
                }

                // ドラムロールを強制終了させ、最終スコアをヘッダーに即座に反映させる
                GameState.displayScore = GameState.actualScore;
                GaugeManager.update(0, GameState.life, GameState.maxLife, GameState.exp, GameState.nextLevelExp, currentLifeDecayRate);

                playSE('GAMEOVER');

                // フェーズ3: 静寂とリザルト（余韻のウェイト）
                setTimeout(() => {
                    SceneManager.pushScene(new ResultScene());
                }, 1500);
            }
            return;
        }

        const decay = (LIFE_CONFIG.INITIAL_DECAY * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1)) * GameState.debug.lifeDecayMultiplier;
        GameState.life -= decay;
        checkGameOver();
        updateBgmState();

        togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
    };
    window.Matter.Events.on(engine, 'beforeUpdate', beforeUpdateHandler);
}

export function getCurrentLifeDecayRate() {
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

function areGemsTouching(g1, g2) {
    const dx = g1.position.x - g2.position.x;
    const dy = g1.position.y - g2.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (g1.customRadius + g2.customRadius + (CONNECTION_THRESHOLD * GameState.debug.bfsMultiplier));
}

function getAdjacencyList(activeGems) {
    const adjList = new Map();
    activeGems.forEach(g => adjList.set(g.id, []));

    for (let i = 0; i < activeGems.length; i++) {
        for (let j = i + 1; j < activeGems.length; j++) {
            const g1 = activeGems[i];
            const g2 = activeGems[j];
            if (areGemsTouching(g1, g2)) {
                adjList.get(g1.id).push(g2);
                adjList.get(g2.id).push(g1);
            }
        }
    }
    return adjList;
}

function startChain(startGem) {
    GameState.isAnimating = true;

    const activeGems = GameState.GEMS.filter(g => !g.isMarkedForDeletion);
    const adjList = getAdjacencyList(activeGems);

    const visited = new Set();
    visited.add(startGem.id);

    const targetColorId = startGem.colorId;
    const targetColorStr = startGem.colorStr;

    const levels = [];
    const chainGems = [startGem];
    let currentLevelNodes = [startGem];

    while (currentLevelNodes.length > 0) {
        const nextLevelNodes = [];
        const currentLevelConnections = [];

        for (const current of currentLevelNodes) {
            const neighbors = adjList.get(current.id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && neighbor.colorId === targetColorId) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({
                        from: current,
                        to: neighbor
                    });
                }
            }
        }

        if (currentLevelConnections.length > 0) {
            levels.push(currentLevelConnections);
        }
        currentLevelNodes = nextLevelNodes;
    }

    chainGems.forEach(gem => gem.isMarkedForDeletion = true);

    animateLaserLevels(levels, chainGems, targetColorStr, () => {
        finalizeDestruction(chainGems, { x: startGem.position.x, y: startGem.position.y }, levels.length);
    });
}

function finalizeDestruction(chain, tapPos, maxDepth = 1) {
    const n = chain.length;
    const colorStr = chain[0].colorStr;
    const fx = tapPos ? tapPos.x : chain[0].position.x;
    const fy = tapPos ? tapPos.y : chain[0].position.y;

    // --- 経験値(EXP)獲得処理 (n >= 1) ---
    // A. 大チェイン減衰
    const baseExp = Math.round(n * (CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY / (n + CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY)));

    // 基準値（現在アンロック済みの色のうち最小の破壊数）の取得
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

    // B. 色別の獲得減衰
    let finalExp = baseExp;
    if (GameState.colorDestroyCounts[colorStr] > 0 && minDestroyCount > 0) {
        finalExp = Math.ceil(baseExp * (minDestroyCount / GameState.colorDestroyCounts[colorStr]));
    }

    finalExp *= GameState.debug.expMultiplier;

    // EXP加算
    if (finalExp > 0) {
        GameState.exp += finalExp;
        GameState.totalExp += finalExp;
        showFloatingNumber('+' + finalExp, 'exp', fx, fy, 500);
    }
    GameState.colorDestroyCounts[colorStr] += n;
    triggerVisualizerSpike(colorStr);

    // 破壊SEリクエスト（SoundManager側で自動スケジューリング）
    for (let i = 0; i < n; i++) {
        playSE('BREAK');
    }

    // --- スコア・回復処理 (n >= 3) ---
    if (n >= 3) {
        const chainCount = BigInt(n);
        const chainBonus = chainCount <= 2n ? 1n : (chainCount - 2n) ** 2n;
        const rateNumber = getScoreRate(GameState.level);
        
        // Depthボーナス: (1 + maxDepth/10) -> (10n + maxDepth) / 10n
        const depthDivisor = CORE_MATH_CONFIG.DEPTH_BONUS_DIVISOR;
        const depthBonusMul = depthDivisor + BigInt(maxDepth);
        
        // RATE * ((chain - 2) ^ 2) * (1 + depth/10)
        let points = ((BigInt(Math.floor(rateNumber)) * chainBonus * depthBonusMul) / depthDivisor) * GameState.debug.scoreMultiplier;
        // 編成ボーナスは未実装のため省略

        GameState.actualScore += points;
        GameState.totalScorePerColor[colorStr] += points;

        if (points > GameState.maxScorePerTap) {
            GameState.maxScorePerTap = points;
            GameState.maxScoreColor = colorStr;
        }
        if (n > GameState.maxChain) {
            GameState.maxChain = n;
            GameState.maxChainColor = colorStr;
        }
        if (!GameState.maxChainPerColor[colorStr]) {
            GameState.maxChainPerColor[colorStr] = 0;
        }
        if (n > GameState.maxChainPerColor[colorStr]) {
            GameState.maxChainPerColor[colorStr] = n;
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
                GameState.engine.timing.timeScale = 1.0;
            }
            toggleStasisEffect(false);
        }

        // 経験値によるレベルアップ判定
        let leveledUp = false;
        let oldLevel = GameState.level;
        let oldRate = rateNumber;
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
