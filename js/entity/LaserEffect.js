// LaserEffect.js
import { LASER_ANIMATION_MS, AppConfig } from '../core/config.js';
import { showChainPopup } from '../render/effects.js'; // To prevent circular dependency, maybe I should decouple this, but for now we use facade.
// Actually, circular dependency with effects.js can be tricky.
// Better to pass GameState.GEMS or handle the popup via screenEffects if possible.
// For now, I will import it from effects.js.

export class LaserEffect {
    constructor() {
        this.lightLines = [];
        this.shrinkingGems = new Map();
        this.burstGems = new Set();
    }

    getShrinkTimer(gem) {
        return this.shrinkingGems.get(gem) || 0;
    }

    hasBurst(gem) {
        return this.burstGems.has(gem);
    }

    animateLaserLevels(levels, chainGems, glowColor, onComplete, GameState, screenEffects, playSE) {
        // 単発（連鎖なし）の場合はアニメーション不要でコールバックへ
        if (chainGems.length <= 1) {
            onComplete();
            return;
        }

        let currentLevelIndex = 0;
        let currentChainCount = 1;

        const nextLevel = () => {
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
                this.lightLines.push({
                    b1: conn.from,
                    b2: conn.to,
                    color: glowColor,
                    startTime: now,
                    duration: LASER_ANIMATION_MS
                });
            });

            // SE再生（連鎖数に応じたピッチ上昇、上限15連鎖相当）
            if (playSE) {
                const pitchRate = Math.min(2.0, 1.0 + (currentChainCount * 0.05));
                playSE('LASER', { playbackRate: pitchRate });
            }

            // ポップアップ更新
            currentChainCount += currentConnections.length;
            if (screenEffects) {
                screenEffects.showChainPopup(currentChainCount, glowColor);
            }

            currentLevelIndex++;
            setTimeout(nextLevel, LASER_ANIMATION_MS);
        };

        // アニメーションスタート
        nextLevel();
    }

    updateAndDraw(ctx, GameState) {
        // 前フレームでバーストしたフラグをクリア
        this.burstGems.clear();

        // 沈み込みタイマーの更新
        for (const [gem, timer] of this.shrinkingGems.entries()) {
            if (timer > 1) {
                this.shrinkingGems.set(gem, timer - 1);
            } else {
                this.shrinkingGems.delete(gem);
            }
        }

        if (this.lightLines.length > 0) {
            const now = performance.now();
            const glowColor = this.lightLines[0].color;

            ctx.save();
            if (AppConfig.EFFECT_LEVEL === 'FULL') {
                ctx.globalCompositeOperation = 'lighter'; // Additive blending for lasers
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = 15;
            } else if (AppConfig.EFFECT_LEVEL === 'LITE') {
                ctx.globalCompositeOperation = 'source-over'; // 加算合成なし
                ctx.strokeStyle = '#ffffff'; // 白に統一
                ctx.lineWidth = 4;
                ctx.shadowBlur = 0; // シャドウ計算は負荷が高いのでOFF
            } else { // NONE
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.globalAlpha = 1.0; // 透明度をなくし確実に見えるように
                ctx.shadowBlur = 0;
            }
            ctx.lineCap = 'round';

            this.lightLines.forEach(line => {
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
                    // 到達先の沈み込みタイマー設定（内部状態）
                    this.shrinkingGems.set(line.b2, 10);
                    
                    // 起点（心臓）のバーストフラグ設定（内部状態）
                    const originGem = GameState.GEMS.find(g => g.render && g.render.isTapOrigin);
                    if (originGem) {
                        this.burstGems.add(originGem);
                    }
                }

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(curX, curY);
                ctx.stroke();
            });
            ctx.restore();
            
            // Cleanup arrived lines that have lingered long enough (though currently they just keep drawing until cleared by next turn? No, wait.)
            // Actually, in the original code, lightLines are cleared when GameState resets or when logic finishes.
            // Wait, the original code never spliced lightLines! It just drew them and let them linger.
            // They are cleared when a new cluster is tapped (GameState.lightLines = [] in logic.js).
        }
    }

    clear() {
        this.lightLines = [];
        this.shrinkingGems.clear();
        this.burstGems.clear();
    }
}
