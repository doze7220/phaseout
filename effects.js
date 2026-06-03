// effects.js
import { GameState, LASER_ANIMATION_MS, LIFE_CONFIG } from './config.js';
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
    });
}

// LIFEゲージの更新（SVG stroke-dashoffsetとカラーの制御）
export function updateLifeGauge(currentLife, maxLife) {
    const paths = document.querySelectorAll('.life-gauge-path');
    if (!paths.length) return;

    const ratio = Math.max(0, Math.min(currentLife / maxLife, 1));
    const offset = 100 - (ratio * 100);

    let color = LIFE_CONFIG.COLORS.HIGH;
    if (ratio < 0.2) {
        color = LIFE_CONFIG.COLORS.LOW;
    } else if (ratio < 0.5) {
        color = LIFE_CONFIG.COLORS.MID;
    }

    paths.forEach(path => {
        path.style.strokeDashoffset = offset;
        path.style.stroke = color;
    });
}

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
