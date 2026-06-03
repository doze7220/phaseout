// logic.js
import { GameState, CONNECTION_THRESHOLD, LIFE_CONFIG } from './config.js';
import { formatScore } from './score.js';
import { animateLaserLevels, spawnParticles, triggerScreenShake, hideChainPopup, showScorePopup, showLevelUpPopup, GaugeManager, updateLevelDisplay, togglePinchEffect } from './effects.js';
import { createGem } from './physics.js';
import { showResultOverlay } from './scene.js';

let pointerDownHandler = null;
let beforeUpdateHandler = null;

function checkGameOver() {
    if (GameState.life <= 0 && !GameState.isGameOver) {
        GameState.isGameOver = true;
    }
}


export function setupGameLogic(engine, render) {
    // 初回UI更新
    GaugeManager.init(GameState.life);
    updateLevelDisplay(GameState.level);
    togglePinchEffect(false);

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
        GaugeManager.update(deltaTime, GameState.life, GameState.maxLife);

        if (GaugeManager.isDecayPaused()) return; // アニメーション中は自然消費ストップ

        if (GameState.isGameOver) {
            if (!GameState.isAnimating && !isResultShown) {
                isResultShown = true;
                // ゲームオーバーでアニメーションが終わっていればリザルト表示
                showResultOverlay(formatScore(GameState.score));
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
        const points = Math.floor(Math.pow(10, (n - 3) * 0.5) * 100);
        GameState.score += points;
        
        // LIFE回復処理
        GameState.life += LIFE_CONFIG.RESTORE_BASE * n;
        if (GameState.life > GameState.maxLife) {
            GameState.life = GameState.maxLife;
        }

        // ここでゲームオーバー判定を上書き（最後のタップでライフが0になっても連鎖で回復した場合の救済）
        if (GameState.life > 0 && GameState.isGameOver) {
            GameState.isGameOver = false;
        }

        GaugeManager.triggerHeal(GameState.life);
        togglePinchEffect(GameState.life < GameState.maxLife * 0.15);
        
        // レベルアップ判定
        if (GameState.score >= GameState.nextLevelScore) {
            const oldLevel = GameState.level;
            
            // スコアがインフレして一気に複数レベル上がるケースにも対応
            while (GameState.score >= GameState.nextLevelScore) {
                GameState.level++;
                const multiplier = LIFE_CONFIG.SCORE_LEVEL_MULTIPLIER || 1.5;
                // 次の目標スコアを増やす
                GameState.nextLevelScore += Math.floor(LIFE_CONFIG.SCORE_PER_LEVEL * Math.pow(multiplier, GameState.level - 1));
            }
            
            updateLevelDisplay(GameState.level);
            showLevelUpPopup(oldLevel, GameState.level);
        }

        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.innerText = formatScore(GameState.score);
        }

        showScorePopup(points);
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

    GameState.lightLines = [];

    // 補充処理
    for (let i = 0; i < n; i++) {
        const x = 30 + Math.random() * 340;
        const y = -30 - i * 30;

        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }

    GameState.isAnimating = false;
}
