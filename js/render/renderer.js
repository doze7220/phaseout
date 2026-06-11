// renderer.js
import { GameState, SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, AppConfig, EFFECT_MATH_CONFIG } from '../core/config.js';

import * as effects from './effects.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { MasterRenderer, LAYERS } from './MasterRenderer.js';



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
        if (layerIndex <= 6 && GameState.engine && GameState.engine.timing.timeScale === 0 && !GameState.disableStasisFilter) {
            ctx.filter = 'grayscale(100%) brightness(1.2)';
        }
    });

    // 宝石（第2層）の描画
    MasterRenderer.registerLayer(LAYERS.PHYSICS_OBJECTS, (ctx) => {
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
                    const pulse = Math.sin(performance.now() / EFFECT_MATH_CONFIG.PULSE_SPEED);
                    scale *= 1 + (EFFECT_MATH_CONFIG.PULSE_MULTI * levelMultiplier * pulse);
                    
                    const spawnCount = Math.floor(EFFECT_MATH_CONFIG.SPARK_COUNT_MULTI * levelMultiplier);
                    effects.spawnSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, spawnCount);
                    
                    if (effects.laserEffect.hasBurst(gem)) {
                        const burstCount = Math.floor(EFFECT_MATH_CONFIG.BURST_SPARK_COUNT_MULTI * levelMultiplier);
                        effects.spawnBurstSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, burstCount, levelMultiplier);
                    }
                } else if (effects.laserEffect.getShrinkTimer(gem) > 0) {
                    const shrink = Math.max(EFFECT_MATH_CONFIG.SHRINK_MIN, EFFECT_MATH_CONFIG.SHRINK_BASE - (levelMultiplier - 1) * EFFECT_MATH_CONFIG.SHRINK_LEVEL_MULTI);
                    scale *= shrink;
                    isFlashing = true;
                    flashAlpha = Math.min(EFFECT_MATH_CONFIG.FLASH_MAX, EFFECT_MATH_CONFIG.FLASH_BASE + (levelMultiplier - 1) * EFFECT_MATH_CONFIG.FLASH_LEVEL_MULTI);
                }

                ctx.save();
                ctx.translate(gem.position.x, gem.position.y);
                ctx.rotate(gem.angle);
                ctx.scale(scale, scale);

                const size = cachedCanvas.width;
                ctx.drawImage(cachedCanvas, -size / 2, -size / 2);

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
