// renderer.js
import { GameState, SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, AppConfig, EFFECT_MATH_CONFIG } from '../core/config.js';

import * as effects from './effects.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';



// Matter.jsのレンダリングループへのフック
export function hookCustomRenderer(Events, render, GEMS) {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const levelMultiplier = 1 + (GameState.level - 1) * 0.1;

        // フェーズ2: 完全停止時の脱色フィルター
        if (GameState.engine && GameState.engine.timing.timeScale === 0 && !GameState.disableStasisFilter) {
            ctx.filter = 'grayscale(100%) brightness(1.2)';
        }

        // Drum roll for displayScore
        if (GameState.displayScore !== GameState.actualScore) {
            let diff = GameState.actualScore - GameState.displayScore;
            let step = diff / 5n;
            if (step === 0n) step = (diff > 0n) ? 1n : -1n;

            GameState.displayScore += step;

            // オーバーシュート防止
            if ((diff > 0n && GameState.displayScore > GameState.actualScore) ||
                (diff < 0n && GameState.displayScore < GameState.actualScore)) {
                GameState.displayScore = GameState.actualScore;
            }
        }

        // スコアのCanvas描画を毎フレーム実行（DOMのオーバーヘッドはないので高速）
        // 描画は GaugeManager.update から drawHeaderUI が呼ばれるため、ここでは処理不要

        // 生成済みのキャッシュ画像を各宝石の座標・角度に合わせてスタンプ描画
        for (let i = 0; i < GEMS.length; i++) {
            const gem = GEMS[i];

            const cachedCanvas = SpriteCacheManager.getGem(gem.shapeKey, gem.colorId);

            if (cachedCanvas) {
                const radius = gem.customRadius;
                const baseRadius = 50; // initCanvasCacheで指定した基準半径

                // 基準キャンバスに対するスケール比率
                let scale = radius / baseRadius;
                let isFlashing = false;
                let flashAlpha = 0.6;

                if (gem.render && gem.render.isTapOrigin) {
                    // 脈打ち（パルス）表現
                    const pulse = Math.sin(performance.now() / EFFECT_MATH_CONFIG.PULSE_SPEED);
                    scale *= 1 + (EFFECT_MATH_CONFIG.PULSE_MULTI * levelMultiplier * pulse);

                    // パーティクル発生
                    const spawnCount = Math.floor(EFFECT_MATH_CONFIG.SPARK_COUNT_MULTI * levelMultiplier);
                    effects.spawnSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, spawnCount);

                    // バースト発生（レーザー到達時）
                    if (effects.laserEffect.hasBurst(gem)) {
                        const burstCount = Math.floor(EFFECT_MATH_CONFIG.BURST_SPARK_COUNT_MULTI * levelMultiplier);
                        effects.spawnBurstSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, burstCount, levelMultiplier);
                    }
                } else if (effects.laserEffect.getShrinkTimer(gem) > 0) {
                    // 沈み込み表現（縮小） - 限界はSHRINK_MIN
                    const shrink = Math.max(EFFECT_MATH_CONFIG.SHRINK_MIN, EFFECT_MATH_CONFIG.SHRINK_BASE - (levelMultiplier - 1) * EFFECT_MATH_CONFIG.SHRINK_LEVEL_MULTI);
                    scale *= shrink;
                    isFlashing = true;
                    // フラッシュの強度 - 上限FLASH_MAX
                    flashAlpha = Math.min(EFFECT_MATH_CONFIG.FLASH_MAX, EFFECT_MATH_CONFIG.FLASH_BASE + (levelMultiplier - 1) * EFFECT_MATH_CONFIG.FLASH_LEVEL_MULTI);
                }

                ctx.save();
                ctx.translate(gem.position.x, gem.position.y);
                ctx.rotate(gem.angle);
                ctx.scale(scale, scale);

                // 中央を原点として描画
                const size = cachedCanvas.width;
                ctx.drawImage(cachedCanvas, -size / 2, -size / 2);

                // フラッシュ表現
                if (isFlashing && AppConfig.EFFECT_LEVEL !== 'NONE') {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                }

                ctx.restore();
            }
        }

        // 描画終了時にフィルターをリセット
        if (GameState.engine && GameState.engine.timing.timeScale === 0 && !GameState.disableStasisFilter) {
            ctx.filter = 'none';
        }
    });
}
