// LaserEffect.js
import { LASER_ANIMATION_MS, AppConfig, SOUND_MATH_CONFIG, EFFECT_MATH_CONFIG } from '../core/config.js';
import { showChainPopup } from '../render/effects.js'; // To prevent circular dependency, maybe I should decouple this, but for now we use facade.
// Actually, circular dependency with effects.js can be tricky.
// Better to pass GameState.GEMS or handle the popup via screenEffects if possible.
// For now, I will import it from effects.js.

export class LaserEffect {
    constructor() {
        this.lightLines = [];
        this.shrinkingGems = new Map();
        this.burstGems = new Set();
        this.laserAnimationState = null;
    }

    getShrinkTimer(gem) {
        return this.shrinkingGems.get(gem) || 0;
    }

    hasBurst(gem) {
        return this.burstGems.has(gem);
    }

    animateLaserLevels(levels, chainGems, glowColor, onComplete, GameState, screenEffects, playSE, isWhitePhase = false) {
        // 単発（連鎖なし）の場合はアニメーション不要でコールバックへ
        if (chainGems.length <= 1) {
            onComplete(0);
            return;
        }

        let currentLevelIndex = 0;
        let currentChainCount = 1;
        let maxPrismDepth = 0;
        const gemPrismDepths = new Map();
        
        let baseColorId = 0;
        if (levels.length > 0 && levels[0].length > 0) {
            baseColorId = levels[0][0].from.colorId;
        }

        let actualGlowColor = isWhitePhase ? '#ffffff' : glowColor;

        this.laserAnimationState = {
            active: true,
            levels,
            chainGems,
            glowColor,
            onComplete,
            GameState,
            screenEffects,
            playSE,
            isWhitePhase,
            currentLevelIndex: 0,
            currentChainCount: 1,
            maxPrismDepth: 0,
            gemPrismDepths: new Map(),
            baseColorId,
            actualGlowColor,
            elapsed: 0
        };

        this.fireNextLevel();
    }

    fireNextLevel() {
        const state = this.laserAnimationState;
        if (!state || !state.active) return;

        if (state.currentLevelIndex >= state.levels.length) {
            // 全階層完了、少し余韻を残す
            state.active = false;
            // TODO: ここも厳密には update 管理できるが、影響範囲が大きいため一時的に setTimeout を残すか、または遅延フラグを持たせる。
            // ユーザー要件的にはアニメーションの遅延なので、ひとまず setTimeout でコールバックを呼ぶか、onComplete 専用の delay を設ける。
            setTimeout(() => {
                if(state.onComplete) state.onComplete(state.maxPrismDepth);
            }, 150);
            return;
        }

        const currentConnections = state.levels[state.currentLevelIndex];
        let maxDepthInThisLevel = state.maxPrismDepth;

        currentConnections.forEach(conn => {
            if (!state.gemPrismDepths.has(conn.from.id)) {
                state.gemPrismDepths.set(conn.from.id, 0);
            }
            const fromDepth = state.gemPrismDepths.get(conn.from.id);
            const toDepth = fromDepth + (conn.from.colorId !== conn.to.colorId ? 1 : 0);
            state.gemPrismDepths.set(conn.to.id, toDepth);

            if (toDepth > maxDepthInThisLevel) {
                maxDepthInThisLevel = toDepth;
            }
        });

        if (maxDepthInThisLevel > state.maxPrismDepth) {
            state.maxPrismDepth = maxDepthInThisLevel;
            if (state.screenEffects) {
                state.screenEffects.triggerPrismLinkStep(state.maxPrismDepth, state.baseColorId, state.isWhitePhase);
            }
            if (state.playSE) {
                const pitchRate = Math.min(SOUND_MATH_CONFIG.SE_PITCH_MAX, 1.0 + (state.maxPrismDepth * SOUND_MATH_CONFIG.SE_PITCH_STEP));
                state.playSE('PRISM_LINK_BURST', { playbackRate: pitchRate });
            }
        }

        currentConnections.forEach(conn => {
            const depth = state.gemPrismDepths.get(conn.to.id);
            const widthMult = 1.0 + (depth * EFFECT_MATH_CONFIG.PRISM_LINK.LASER_WIDTH_MULT);

            this.lightLines.push({
                b1: conn.from,
                b2: conn.to,
                color: state.actualGlowColor,
                elapsed: 0,
                duration: LASER_ANIMATION_MS,
                widthMult: widthMult
            });
        });

        if (state.playSE) {
            const pitchRate = Math.min(SOUND_MATH_CONFIG.SE_PITCH_MAX, 1.0 + (state.currentChainCount * SOUND_MATH_CONFIG.SE_PITCH_STEP));
            state.playSE('LASER', { playbackRate: pitchRate });
        }

        state.currentChainCount += currentConnections.length;
        if (state.screenEffects) {
            state.screenEffects.showChainPopup(state.currentChainCount, state.glowColor, state.currentLevelIndex + 1);
        }

        state.currentLevelIndex++;
    }

    update(realDelta, gameDelta) {
        if (!this.laserAnimationState || !this.laserAnimationState.GameState) return; // Wait until GameState is passed
        const state = this.laserAnimationState;
        
        if (!state.GameState.isPuzzlePaused) {
            for (const [gem, timer] of this.shrinkingGems.entries()) {
                if (timer > 1) {
                    this.shrinkingGems.set(gem, timer - 1);
                } else {
                    this.shrinkingGems.delete(gem);
                }
            }
        }
        
        for (let line of this.lightLines) {
            if (!state.GameState.isPuzzlePaused) {
                line.elapsed += gameDelta;
            }
        }

        if (state.active) {
            if (!state.GameState.isPuzzlePaused) {
                state.elapsed += gameDelta;
                if (state.elapsed >= LASER_ANIMATION_MS) {
                    state.elapsed -= LASER_ANIMATION_MS;
                    this.fireNextLevel();
                }
            }
        }
    }

    updateAndDraw(ctx, GameState) {
        // 前フレームでバーストしたフラグをクリア
        this.burstGems.clear();

        if (this.lightLines.length > 0) {
            const effectLevel = AppConfig.EFFECT_LEVEL;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.shadowBlur = 0; // Ensure shadow is off for performance

            this.lightLines.forEach(line => {
                const elapsed = line.elapsed;
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
                    this.shrinkingGems.set(line.b2, EFFECT_MATH_CONFIG.LASER_SHRINK_TIMER);
                    
                    // 起点（心臓）のバーストフラグ設定（内部状態）
                    const originGem = GameState.GEMS.find(g => g.render && g.render.isTapOrigin);
                    if (originGem) {
                        this.burstGems.add(originGem);
                    }
                }

                const widthMult = line.widthMult || 1.0;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(curX, curY);

                if (effectLevel === 'FULL') {
                    // マルチストロークによる疑似グロー（shadowBlurより軽量かつ美麗）
                    ctx.globalCompositeOperation = 'lighter';
                    
                    // 1本目：太く薄いグロー
                    ctx.strokeStyle = line.color;
                    ctx.globalAlpha = 0.2;
                    ctx.lineWidth = 14 * widthMult;
                    ctx.stroke();

                    // 2本目：中くらいのグロー
                    ctx.globalAlpha = 0.5;
                    ctx.lineWidth = 6 * widthMult;
                    ctx.stroke();

                    // 3本目：中心の白いコア
                    ctx.strokeStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                    ctx.lineWidth = 2 * widthMult;
                    ctx.stroke();
                } else if (effectLevel === 'LITE') {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                    ctx.lineWidth = 4 * widthMult;
                    ctx.stroke();
                } else { // NONE
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                    ctx.lineWidth = 4 * widthMult;
                    ctx.stroke();
                }
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
