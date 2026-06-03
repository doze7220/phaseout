// effects.js
import { GameState, LASER_ANIMATION_MS, LIFE_CONFIG, LEVEL_UP_ANIMATION } from './config.js';
import { formatScore } from './score.js';

// 連鎖ポップアップの表示
export function showChainPopup(count, color) {
    const chainPopup = document.getElementById('chain-popup');
    if (!chainPopup) return;

    chainPopup.innerText = `${formatScore(count)} Chain`;
    // 文字色は白にし、黒の縁取り＋宝石色のグロウ（シャドウ）を付与
    chainPopup.style.color = '#FFFFFF';
    chainPopup.style.textShadow = `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 20px ${color}, 0 0 40px ${color}`;

    // アニメーションのリセット（再トリガーのための工夫）
    chainPopup.classList.remove('active', 'fade-out');
    void chainPopup.offsetWidth; // リフローを強制
    chainPopup.classList.add('active');

    // 以前のタイムアウトがあればクリア
    if (chainPopup.fadeTimeout) {
        clearTimeout(chainPopup.fadeTimeout);
        chainPopup.fadeTimeout = null;
    }
}

export function hideChainPopup() {
    const chainPopup = document.getElementById('chain-popup');
    if (chainPopup) {
        chainPopup.classList.remove('active');
        chainPopup.classList.add('fade-out');
    }
}

export function showScorePopup(points) {
    const chainPopup = document.getElementById('chain-popup');
    if (!chainPopup) return;

    // 「+」を削除し、改行を入れて2行にする
    chainPopup.innerHTML = `${formatScore(points)}<br><span style="font-size: 0.6em;">Score</span>`;
    // スコア時はゴールドのグロウ（シャドウ）
    chainPopup.style.color = '#FFFFFF';
    chainPopup.style.textShadow = `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 20px #FFD700, 0 0 40px #FFD700`;
    chainPopup.classList.remove('active', 'fade-out');
    void chainPopup.offsetWidth;
    chainPopup.classList.add('active');

    // 以前のタイムアウトがあればクリア
    if (chainPopup.fadeTimeout) {
        clearTimeout(chainPopup.fadeTimeout);
    }
    // 1秒後にフェードアウト
    chainPopup.fadeTimeout = setTimeout(() => {
        chainPopup.classList.remove('active');
        chainPopup.classList.add('fade-out');
    }, 1000);
}

// レーザーの同心円状並列アニメーション
export function animateLaserLevels(levels, chainGems, glowColor, onComplete) {
    // 単発（連鎖なし）の場合はアニメーション不要でコールバックへ
    if (chainGems.length <= 1) {
        onComplete();
        return;
    }

    let currentLevelIndex = 0;
    let currentChainCount = 1;

    function nextLevel() {
        if (currentLevelIndex >= levels.length) {
            // 全階層のレーザーが完了。余韻を少し残して完了処理
            setTimeout(() => {
                onComplete();
            }, 150);
            return;
        }

        const currentConnections = levels[currentLevelIndex];
        const now = performance.now();

        // 現在の階層の全レーザーを同時に発火
        currentConnections.forEach(conn => {
            GameState.lightLines.push({
                b1: conn.from,
                b2: conn.to,
                color: glowColor,
                startTime: now,
                duration: LASER_ANIMATION_MS
            });
        });

        // ポップアップ更新
        currentChainCount += currentConnections.length;
        showChainPopup(currentChainCount, glowColor);

        currentLevelIndex++;
        setTimeout(nextLevel, LASER_ANIMATION_MS);
    }

    // アニメーションスタート
    nextLevel();
}

// パーティクルの生成
export function spawnParticles(x, y, colorStr) {
    const count = 5 + Math.floor(Math.random() * 5); // 1個につき5〜9個のパーティクル
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        GameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 4 + Math.random() * 4,
            color: colorStr,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}

// 画面揺れ（スクリーンシェイク）の演出
export function triggerScreenShake() {
    const gameWrapper = document.getElementById('game-wrapper');
    if (!gameWrapper) return;

    // CSSクラス付与で揺らす（style.cssに後で定義）
    gameWrapper.classList.remove('shake');
    void gameWrapper.offsetWidth;
    gameWrapper.classList.add('shake');

    // 一定時間後にクラス削除
    setTimeout(() => {
        gameWrapper.classList.remove('shake');
    }, 500);
}

// Matter.jsのafterRenderにフックしてエフェクトを描画
export function hookEffectsRenderer(Events, render) {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;

        // 1. レーザーの描画
        if (GameState.lightLines.length > 0) {
            const now = performance.now();
            const glowColor = GameState.lightLines[0].color;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;

            GameState.lightLines.forEach(line => {
                const elapsed = now - line.startTime;
                let progress = Math.max(0, Math.min(elapsed / line.duration, 1.0));

                progress = progress * (2 - progress); // easeOutQuad

                const startX = line.b1.position.x;
                const startY = line.b1.position.y;
                const endX = line.b2.position.x;
                const endY = line.b2.position.y;

                const curX = startX + (endX - startX) * progress;
                const curY = startY + (endY - startY) * progress;

                // レーザー到達判定
                if (progress >= 1.0 && !line.hasArrived) {
                    line.hasArrived = true;
                    // 到達先の沈み込みタイマー設定
                    line.b2.render = line.b2.render || {};
                    line.b2.render.tapEffectTimer = 10;
                    
                    // 起点（心臓）のバーストフラグ設定
                    const originGem = GameState.GEMS.find(g => g.render && g.render.isTapOrigin);
                    if (originGem) {
                        originGem.render.burstFlag = true;
                    }
                }

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(curX, curY);
                ctx.stroke();
            });
            ctx.shadowBlur = 0; // リセット
        }

        // 2. パーティクルの更新と描画
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const p = GameState.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                GameState.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // 3. 火花（sparks）の更新と軽量描画（加算合成）
        if (GameState.sparks.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            for (let i = GameState.sparks.length - 1; i >= 0; i--) {
                const s = GameState.sparks[i];
                
                s.x += s.vx;
                s.y += s.vy;
                s.life -= s.decay;
                
                if (s.life <= 0) {
                    GameState.sparks.splice(i, 1);
                    continue;
                }
                
                ctx.globalAlpha = Math.max(0, s.life);
                ctx.fillStyle = s.color;
                ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
            }
            ctx.restore();
        }
    });
}

export const GaugeManager = {
    vMain: LIFE_CONFIG.MAX_LIFE,
    vRed: 0,
    vGreen: 0,
    greenTarget: 0,
    pauseDecayTimer: 0,
    redTimer: 0,
    greenTimer: 0,
    isRedAnimating: false,
    isGreenAnimating: false,

    init(life) {
        this.vMain = life;
        this.vRed = life;
        this.vGreen = life;
        this.pauseDecayTimer = 0;
        this.redTimer = 0;
        this.greenTimer = 0;
        this.isRedAnimating = false;
        this.isGreenAnimating = false;
        this.render(life, LIFE_CONFIG.MAX_LIFE);
    },

    triggerDamage(actualLife) {
        this.pauseDecayTimer = 500;
        this.redTimer = 500;
        this.isRedAnimating = true;

        // 今見えている最も高いゲージから赤をオーバーレイ
        this.vRed = Math.max(this.vRed, this.vMain, this.vGreen);

        // actualLifeが青ゲージを下回った場合は即座に下げる
        if (actualLife < this.vMain) {
            this.vMain = actualLife;
        }
    },

    triggerHeal(actualLife) {
        this.pauseDecayTimer = 500;
        this.greenTimer = 500;
        this.isGreenAnimating = true;

        this.vGreen = this.vMain; // 青ゲージの位置からスタート
        this.greenTarget = actualLife;
    },

    isDecayPaused() {
        return this.pauseDecayTimer > 0;
    },

    update(deltaTime, actualLife, maxLife) {
        // タイマー更新
        if (this.pauseDecayTimer > 0) this.pauseDecayTimer -= deltaTime;

        // 赤アニメーション
        if (this.redTimer > 0) {
            this.redTimer -= deltaTime;
        } else if (this.isRedAnimating) {
            this.isRedAnimating = false;
            this.vRed = this.vMain;
        }

        // 緑アニメーション
        if (this.greenTimer > 0) {
            this.greenTimer -= deltaTime;
            const progress = 1.0 - (this.greenTimer / 500);
            this.vGreen = this.vMain + (this.greenTarget - this.vMain) * progress;
        } else if (this.isGreenAnimating) {
            this.isGreenAnimating = false;
            this.vMain = this.greenTarget;
            this.vGreen = this.vMain;
        }

        // 何もアニメーションしていない時の青ゲージ追従
        if (this.pauseDecayTimer <= 0) {
            this.vMain = actualLife;
            this.vRed = actualLife;
            this.vGreen = actualLife;
            this.isRedAnimating = false;
            this.isGreenAnimating = false;
        }

        this.render(actualLife, maxLife);
    },

    render(actualLife, maxLife) {
        const damages = document.querySelectorAll('.gauge-damage');
        const heals = document.querySelectorAll('.gauge-heal');
        const mains = document.querySelectorAll('.gauge-main');

        const mainRatio = Math.max(0, Math.min(this.vMain / maxLife, 1));
        const redRatio = Math.max(0, Math.min(this.vRed / maxLife, 1));
        const greenRatio = Math.max(0, Math.min(this.vGreen / maxLife, 1));

        let color = LIFE_CONFIG.COLORS.HIGH;
        if (actualLife / maxLife < 0.15) color = LIFE_CONFIG.COLORS.LOW;
        else if (actualLife / maxLife < 0.3) color = LIFE_CONFIG.COLORS.MID;

        mains.forEach(el => {
            el.style.height = `${mainRatio * 100}%`;
            el.style.backgroundColor = color;
        });

        damages.forEach(el => {
            el.style.backgroundColor = LIFE_CONFIG.COLORS.DAMAGE;
            if (this.redTimer > 0 && this.vRed > this.vMain) {
                el.style.height = `${redRatio * 100}%`;
                el.style.opacity = 1;
            } else {
                el.style.opacity = 0;
                el.style.height = `0%`;
            }
        });

        heals.forEach(el => {
            if (this.greenTimer > 0 && this.vGreen > this.vMain) {
                el.style.height = `${greenRatio * 100}%`;
                el.style.opacity = 1;
            } else {
                el.style.opacity = 0;
                el.style.height = `0%`;
            }
        });
    }
};

// レベル表示の更新
export function updateLevelDisplay(level) {
    const display = document.getElementById('level-display');
    if (!display) return;

    display.innerText = `Lv. ${level}`;

    // アニメーション再トリガー
    display.classList.remove('level-up-glow');
    void display.offsetWidth;
    display.classList.add('level-up-glow');
}

// レベルアップポップアップ表示
export function showLevelUpPopup(oldLevel, newLevel) {
    const popup = document.getElementById('level-up-popup');
    if (!popup) return;

    // 以前のタイムアウトがあればクリア
    if (popup.animationTimeout) {
        clearTimeout(popup.animationTimeout);
    }
    if (popup.hideTimeout) {
        clearTimeout(popup.hideTimeout);
    }

    popup.innerHTML = `
        <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">String Level Up</div>
        <div style="font-size: 3.5em; font-weight: bold;">${oldLevel} → ${newLevel}</div>
    `;
    popup.style.display = 'block';
    popup.style.color = LEVEL_UP_ANIMATION.color;
    
    // 初期状態：2倍サイズ、透明
    popup.style.transition = 'none';
    popup.style.transform = 'translate(-50%, -50%) scale(2)';
    popup.style.opacity = '0';

    void popup.offsetWidth; // リフロー強制

    // 縮小しながらフェードイン
    popup.style.transition = `transform ${LEVEL_UP_ANIMATION.timeShrinkMs}ms ease-out, opacity ${LEVEL_UP_ANIMATION.timeShrinkMs}ms ease-out`;
    popup.style.transform = 'translate(-50%, -50%) scale(1)';
    popup.style.opacity = LEVEL_UP_ANIMATION.alphaCenter.toString();

    // 中央固定時間経過後、拡大しながらフェードアウト
    popup.animationTimeout = setTimeout(() => {
        popup.style.transition = `transform ${LEVEL_UP_ANIMATION.timeExpandMs}ms ease-in, opacity ${LEVEL_UP_ANIMATION.timeExpandMs}ms ease-in`;
        popup.style.transform = 'translate(-50%, -50%) scale(1.5)';
        popup.style.opacity = '0';

        popup.hideTimeout = setTimeout(() => {
            popup.style.display = 'none';
        }, LEVEL_UP_ANIMATION.timeExpandMs);

    }, LEVEL_UP_ANIMATION.timeShrinkMs + LEVEL_UP_ANIMATION.timeCenterMs);
}

// ピンチ演出の切り替え
export function togglePinchEffect(isPinch) {
    const gameWrapper = document.getElementById('game-wrapper');
    if (!gameWrapper) return;

    if (isPinch) {
        gameWrapper.classList.add('pinch-mode');
    } else {
        gameWrapper.classList.remove('pinch-mode');
    }
}
