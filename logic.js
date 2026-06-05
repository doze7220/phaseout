// logic.js
import { GameState, LAYOUT_CONFIG, CONNECTION_THRESHOLD, LIFE_CONFIG, AppConfig, LEVEL_CONFIG } from './config.js';
import { formatScore, formatResultScore } from './score.js';
import { animateLaserLevels, spawnParticles, triggerScreenShake, hideChainPopup, showScorePopup, GaugeManager, updateLevelDisplay, togglePinchEffect, toggleStasisEffect, clearLasers } from './effects.js';
import { createGem } from './physics.js';
import { showResultOverlay } from './scene.js';

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


export function setupGameLogic(engine, render) {
    // 初回UI更新
    GaugeManager.init(GameState.life);
    updateLevelDisplay(GameState.level);
    togglePinchEffect(false);
    GameState.playStartTime = Date.now();

    pointerDownHandler = (e) => {
        e.preventDefault(); 

        if (GameState.isAnimating || GameState.isGameOver) return;

        const rect = render.canvas.getBoundingClientRect();
        const scaleX = render.options.width / rect.width;
        const scaleY = render.options.height / rect.height;

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const mousePosition = {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };

        const { Query } = window.Matter;
        const clickedBodies = Query.point(GameState.GEMS, mousePosition);

        if (clickedBodies.length > 0) {
            const clickedGem = clickedBodies[0];
            if (!clickedGem.isMarkedForDeletion) {
                // タップ時LIFE消費
                const tapCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
                GameState.life -= tapCost;
                checkGameOver();
                
                GaugeManager.triggerDamage(GameState.life);
                togglePinchEffect(GameState.life < GameState.maxLife * 0.15);

                // タップされた宝石にエフェクト用タイマーを設定（約10フレーム）
                clickedGem.render = clickedGem.render || {};
                clickedGem.render.tapEffectTimer = 10;
                clickedGem.render.isTapOrigin = true; // 脈打ちと火花の起点フラグ

                startChain(clickedGem);
            }
        }
    };

    render.canvas.addEventListener('mousedown', pointerDownHandler, { passive: false });
    render.canvas.addEventListener('touchstart', pointerDownHandler, { passive: false });

    let isResultShown = false;
    let lastTime = performance.now();

    // 時間経過によるLIFE減少処理
    beforeUpdateHandler = () => {
        const now = performance.now();
        const deltaTime = now - lastTime;
        lastTime = now;

        // 毎フレームのゲージ状態更新
        GaugeManager.update(deltaTime, GameState.life, GameState.maxLife, GameState.exp, GameState.nextLevelExp);

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
                
                // フェーズ3: 静寂とリザルト（余韻のウェイト）
                setTimeout(() => {
                    showResultOverlay(formatResultScore(GameState.actualScore));
                }, 1500);
            }
            return;
        }

        const decay = LIFE_CONFIG.INITIAL_DECAY * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
        GameState.life -= decay;
        checkGameOver();

        togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
    };
    window.Matter.Events.on(engine, 'beforeUpdate', beforeUpdateHandler);
}

export function removeGameLogic() {
    if (pointerDownHandler && GameState.render && GameState.render.canvas) {
        GameState.render.canvas.removeEventListener('mousedown', pointerDownHandler);
        GameState.render.canvas.removeEventListener('touchstart', pointerDownHandler);
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
    return dist < (g1.customRadius + g2.customRadius + CONNECTION_THRESHOLD);
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
        finalizeDestruction(chainGems);
    });
}

function finalizeDestruction(chain) {
    const n = chain.length;

    if (n >= 3) {
        const chainCount = BigInt(n);
        const chainBonus = chainCount <= 2n ? 1n : (chainCount - 2n) ** 2n;
        const baseScore = 10n ** BigInt(GameState.level);
        const points = baseScore * chainBonus;
        
        GameState.actualScore += points;
        
        if (points > GameState.maxScorePerTap) {
            GameState.maxScorePerTap = points;
        }
        if (n > GameState.maxChain) {
            GameState.maxChain = n;
        }
        const colorStr = chain[0].colorStr;
        if (!GameState.maxChainPerColor[colorStr]) {
            GameState.maxChainPerColor[colorStr] = 0;
        }
        if (n > GameState.maxChainPerColor[colorStr]) {
            GameState.maxChainPerColor[colorStr] = n;
        }
        
        // 経験値(EXP)獲得処理
        // 新色が初めて破壊された時の下駄処理
        if (GameState.colorDestroyCounts[colorStr] === undefined) {
            const existingKeys = Object.keys(GameState.colorDestroyCounts);
            if (existingKeys.length > 0) {
                let sum = 0;
                for (const key of existingKeys) {
                    sum += GameState.colorDestroyCounts[key];
                }
                GameState.colorDestroyCounts[colorStr] = Math.floor(sum / existingKeys.length);
            } else {
                GameState.colorDestroyCounts[colorStr] = 0;
            }
        }

        // A. 大チェイン減衰
        const baseExp = Math.round(n * (100 / (n + 100)));
        
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
            finalExp = Math.round(baseExp * (minDestroyCount / GameState.colorDestroyCounts[colorStr]));
        }
        
        // EXP加算
        GameState.exp += finalExp;
        GameState.totalExp += finalExp;
        GameState.colorDestroyCounts[colorStr] += n;
        
        // LIFE回復処理
        GameState.life += LIFE_CONFIG.RESTORE_BASE * n;
        if (GameState.life > GameState.maxLife) {
            GameState.life = GameState.maxLife;
        }

        // ここでゲームオーバー判定を上書き（最後のタップでライフが0になっても連鎖で回復した場合の救済）
        if (GameState.life > 0 && GameState.isGameOver) {
            GameState.isGameOver = false;
            if (GameState.engine) {
                GameState.engine.timing.timeScale = 1.0;
            }
            toggleStasisEffect(false);
        }

        // 経験値によるレベルアップ判定
        while (GameState.exp >= GameState.nextLevelExp) {
            GameState.exp -= GameState.nextLevelExp;
            GameState.level++;
            // 次のレベルの必要経験値を再計算
            GameState.nextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * (LEVEL_CONFIG.EXP_CURVE_MULTIPLIER ** (GameState.level - 1)));
        }

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

    // トップ破壊色の検知とオーラ反映
    let maxCount = 0;
    let topColor = 'transparent';
    for (const color in GameState.stats) {
        if (GameState.stats[color] > maxCount) {
            maxCount = GameState.stats[color];
            topColor = color;
        }
    }
    
    // ヘッダーエフェクトの更新
    const puzzleHeader = document.getElementById('puzzle-header');
    if (puzzleHeader) {
        puzzleHeader.style.setProperty('--aura-color', topColor);
        puzzleHeader.classList.remove('aura-flash');
        void puzzleHeader.offsetWidth; // trigger reflow
        puzzleHeader.classList.add('aura-flash');
    }

    clearLasers();

    // 補充処理
    for (let i = 0; i < n; i++) {
        const x = 50 + Math.random() * (LAYOUT_CONFIG.APP_WIDTH - 100);
        const y = -50 - i * 50;

        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }

    GameState.isAnimating = false;
}
