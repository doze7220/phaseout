// renderer.js
import { GameState, SHAPE_CONFIG, COLOR_CONFIG, AppConfig } from '../core/config.js';
import { GRAPHICS_CONFIG, EFFECT_MATH_CONFIG, LASER_EFFECT_CONFIG } from '../core/effectConfig.js';

import * as effects from './effects.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { MasterRenderer, LAYERS } from './MasterRenderer.js';
import { PhaseManager } from '../core/PhaseManager.js';



// Matter.jsのレンダリングループへのフック
export function setupGemRenderer(GameState) {
    // スコアのドラムロール更新
    MasterRenderer.registerGlobalUpdate(() => {
        if (GameState.displayScore !== GameState.actualScore) {
            let diff = GameState.actualScore - GameState.displayScore;
            let step = diff / 5n;
            if (step === 0n) step = (diff > 0n) ? 1n : -1n;

            GameState.displayScore += step;

            if ((diff > 0n && GameState.displayScore > GameState.actualScore) ||
                (diff < 0n && GameState.displayScore < GameState.actualScore)) {
                GameState.displayScore = GameState.actualScore;
            }
        }
    });

    // フィルタ設定 (レイヤー6以下のUI未満のレイヤーにのみステイシスフィルタを適用)
    MasterRenderer.setLayerFilterCallback((ctx, layerIndex) => {
        if (layerIndex <= 6 && GameState.engine && !GameState.disableStasisFilter) {
            let intensity = 0;
            if (GameState.isWhiteExitWipeOut) {
                // ワイプアウト演出中はフィルタを無効化（オーバーレイで表現するため）
                intensity = 0;
            } else if (GameState.isPuzzlePaused) {
                // コンフィグ等による完全停止時は即座に100%
                intensity = 1.0;
            } else if (GameState.stasisTimeScale !== undefined && GameState.stasisTimeScale < 1.0) {
                // 演出ステイシス時は stasisTimeScale に連動してフェード
                intensity = 1.0 - GameState.stasisTimeScale;
            }

            if (intensity > 0) {
                ctx.filter = `grayscale(${intensity * 100}%) brightness(${1.0 + intensity * 0.2})`;
            }
        }
    });

    // 宝石（第3層）の描画
    MasterRenderer.registerLayer(LAYERS.GEMS, (ctx) => {
        const levelMultiplier = 1 + (GameState.level - 1) * 0.1;
        const GEMS = GameState.GEMS;
        if (!GEMS) return;

        for (let i = 0; i < GEMS.length; i++) {
            const gem = GEMS[i];
            const cachedCanvas = SpriteCacheManager.getGem(gem.shapeKey, gem.colorId);

            if (cachedCanvas) {
                const radius = gem.customRadius;
                const baseRadius = 50; 
                let scale = radius / baseRadius;
                let isFlashing = false;
                let flashAlpha = 0.6;

                if (gem.render && gem.render.isTapOrigin) {
                    const pulse = Math.sin(MasterRenderer.getGameTime() / LASER_EFFECT_CONFIG.PULSE_SPEED);
                    scale *= 1 + (LASER_EFFECT_CONFIG.PULSE_MULTI * levelMultiplier * pulse);
                    
                    const spawnCount = Math.floor(LASER_EFFECT_CONFIG.SPARK_COUNT_MULTI * levelMultiplier);
                    effects.spawnSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, spawnCount);
                    
                    if (effects.laserEffect.hasBurst(gem)) {
                        const burstCount = Math.floor(LASER_EFFECT_CONFIG.BURST_SPARK_COUNT_MULTI * levelMultiplier);
                        effects.spawnBurstSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, burstCount, levelMultiplier);
                    }
                } else if (effects.laserEffect.getShrinkTimer(gem) > 0) {
                    const shrink = Math.max(LASER_EFFECT_CONFIG.SHRINK_MIN, LASER_EFFECT_CONFIG.SHRINK_BASE - (levelMultiplier - 1) * LASER_EFFECT_CONFIG.SHRINK_LEVEL_MULTI);
                    scale *= shrink;
                    isFlashing = true;
                    flashAlpha = Math.min(LASER_EFFECT_CONFIG.FLASH_MAX, LASER_EFFECT_CONFIG.FLASH_BASE + (levelMultiplier - 1) * LASER_EFFECT_CONFIG.FLASH_LEVEL_MULTI);
                }

                let offsetX = 0;
                let isGlitch = false;
                let glitchIntensity = 0;

                if (PhaseManager.getCurrentPhaseName() === 'ホワイトステイシス中' && AppConfig.EFFECT_LEVEL === 'FULL') {
                    const gaugeRatio = PhaseManager.getGaugeRatio();
                    if (gaugeRatio <= EFFECT_MATH_CONFIG.WHITE_PHASE_GLITCH_THRESHOLD) {
                        isGlitch = true;
                        glitchIntensity = 1.0 - (gaugeRatio / EFFECT_MATH_CONFIG.WHITE_PHASE_GLITCH_THRESHOLD);
                        if (Math.random() < glitchIntensity * 0.5) {
                            offsetX = (Math.random() - 0.5) * 10 * glitchIntensity;
                        }
                    }
                }

                ctx.save();
                ctx.translate(gem.position.x + offsetX, gem.position.y);
                ctx.rotate(gem.angle);
                ctx.scale(scale, scale);

                const size = cachedCanvas.width;

                if (isGlitch && Math.random() < glitchIntensity * 0.5) {
                    const shiftX1 = (Math.random() - 0.5) * 8 * glitchIntensity;
                    const shiftX2 = (Math.random() - 0.5) * 8 * glitchIntensity;
                    const sliceY = (Math.random() - 0.5) * size * 0.5;
                    const sliceH = size * 0.2;
                    
                    ctx.drawImage(cachedCanvas, -size / 2, -size / 2);
                    
                    ctx.globalCompositeOperation = 'screen';
                    ctx.drawImage(cachedCanvas, 
                        0, size / 2 + sliceY, size, sliceH,
                        -size / 2 + shiftX1, sliceY, size, sliceH
                    );
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    ctx.drawImage(cachedCanvas, -size / 2, -size / 2);
                }

                if (isFlashing && AppConfig.EFFECT_LEVEL !== 'NONE') {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                }
                ctx.restore();
            }
        }
    });
}
