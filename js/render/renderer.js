// renderer.js
import { GameState, SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, AppConfig } from '../core/config.js';
import { formatScore } from '../core/score.js';
import * as effects from './effects.js';
import { initScoreSpriteCache, drawScoreToCanvas } from './ScoreRenderer.js';

const canvasCache = new Map();

export const AssetManager = {
    images: {},
    async loadAssets() {
        const shapes = ['circle', 'triangle', 'square', 'rectangle'];
        const promises = shapes.map(shape => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `./assets/img/gem/gem_${shape}.png`;
                img.onload = () => {
                    this.images[shape] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: gem_${shape}.png`);
                    resolve();
                };
            });
        });
        await Promise.all(promises);
    }
};

// キャンバスキャッシュの生成（プレレンダリング）
export function initCanvasCache() {
    const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
    const activeColors = COLOR_CONFIG.filter(c => c.enabled);

    for (const shape of activeShapes) {
        for (let i = 0; i < activeColors.length; i++) {
            const colorDef = activeColors[i];
            const cacheKey = `${shape}-${i}`; // 形状-色ID

            // 基準サイズ（少し大きめのキャンバスを作成してはみ出し防止）
            const size = 200; // 長方形(h=150)がはみ出さないように120から200に拡大
            const baseRadius = 50; // キャッシュ内の描画基準半径
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            drawRichGem(ctx, size / 2, size / 2, baseRadius, shape, colorDef.color);

            canvasCache.set(cacheKey, canvas);
        }
    }

    // パーティクル＆火花のスプライト生成
    for (const colorDef of activeColors) {
        const color = colorDef.color;
        // 火花 (spark) 用: ふんわり光る円 (lighter合成用)
        const sparkCanvas = document.createElement('canvas');
        sparkCanvas.width = 32;
        sparkCanvas.height = 32;
        const sCtx = sparkCanvas.getContext('2d');
        const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, 'transparent');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 32, 32);
        canvasCache.set(`spark-${color}`, sparkCanvas);

        // 破片 (particle) 用: 単色の四角形（将来ポリゴン等へ差し替えるためのベース）
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 16;
        particleCanvas.height = 16;
        const pCtx = particleCanvas.getContext('2d');
        pCtx.fillStyle = color;
        pCtx.fillRect(0, 0, 16, 16);
        canvasCache.set(`particle-${color}`, particleCanvas);
    }

    // 波紋（Ripple）スプライトの生成
    const rippleSize = 160; // shadow分余裕を持たせる (本体は120)
    const rippleRadius = 60;
    const rippleCanvas = document.createElement('canvas');
    rippleCanvas.width = rippleSize;
    rippleCanvas.height = rippleSize;
    const rctx = rippleCanvas.getContext('2d');
    
    rctx.beginPath();
    rctx.arc(rippleSize / 2, rippleSize / 2, rippleRadius, 0, Math.PI * 2);
    rctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    rctx.fill();
    
    // シャドウ（inset と outset を同時に表現するためストロークに影をつける）
    rctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    rctx.lineWidth = 2;
    rctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    rctx.shadowBlur = 10;
    rctx.stroke();
    // 影を濃くするためもう一回描く
    rctx.stroke();
    
    canvasCache.set('ripple', rippleCanvas);

    initScoreSpriteCache();
}

// キャッシュされた汎用スプライトの取得
export function getCachedSprite(key) {
    return canvasCache.get(key);
}

// キャッシュされた宝石スプライトの取得
export function getCachedGemSprite(shape, colorId) {
    return canvasCache.get(`${shape}-${colorId}`);
}

// 宝石描画ロジック
function drawRichGem(ctx, x, y, radius, shape, color) {
    ctx.save();

    const isFlat = GRAPHICS_CONFIG.GEM_STYLE === 'flat';

    // まずベースとなるシルエットを単色で描画
    ctx.fillStyle = color;
    ctx.beginPath();
    let drawW, drawH, drawX, drawY;

    if (shape === 'circle') {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        drawW = radius * 2; drawH = radius * 2;
        drawX = x - radius; drawY = y - radius;
    } else if (shape === 'triangle') {
        const r = radius + 2;
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
        ctx.lineTo(x - r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
        ctx.closePath();
        drawW = r * 2.2; drawH = r * 2.2; // 少し余裕を持たせる
        drawX = x - drawW / 2; drawY = y - r;
    } else if (shape === 'square') {
        const sqSize = radius * 2 * 0.8;
        if (ctx.roundRect) {
            ctx.roundRect(x - sqSize / 2, y - sqSize / 2, sqSize, sqSize, radius * 0.2);
        } else {
            ctx.rect(x - sqSize / 2, y - sqSize / 2, sqSize, sqSize);
        }
        drawW = sqSize; drawH = sqSize;
        drawX = x - sqSize / 2; drawY = y - sqSize / 2;
    } else if (shape === 'rectangle') {
        const w = radius * 1.5;
        const h = w * 2;
        if (ctx.roundRect) {
            ctx.roundRect(x - w / 2, y - h / 2, w, h, radius * 0.2);
        } else {
            ctx.rect(x - w / 2, y - h / 2, w, h);
        }
        drawW = w; drawH = h;
        drawX = x - w / 2; drawY = y - h / 2;
    }
    ctx.fill();

    // 縁取り（アウトライン）
    if (isFlat) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
    } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
    }
    ctx.stroke();

    if (!isFlat) {
        ctx.clip(); // シルエットの内側だけに画像を適用
        const img = AssetManager.images[shape];
        if (img) {
            // AI生成画像に含まれる周囲の余白を相殺するため、少し大きめに描画してはみ出させる
            let padScale = 1.35;
            if (shape === 'triangle') padScale = 1.5; // 三角は少し小さめになりがちなので強めに
            if (shape === 'circle') padScale = 1.3;

            const finalW = drawW * padScale;
            const finalH = drawH * padScale;
            const finalX = drawX - (finalW - drawW) / 2;
            const finalY = drawY - (finalH - drawH) / 2;

            // overlay などの合成モードで、グレースケール画像の明暗をベース色にブレンドする
            ctx.globalCompositeOperation = 'overlay'; // overlay または hard-light など
            ctx.drawImage(img, finalX, finalY, finalW, finalH);

            // 明るさを補うためにスクリーン合成で少し乗せるのも効果的
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img, finalX, finalY, finalW, finalH);
        }
    }

    ctx.restore();
}

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
        drawScoreToCanvas(GameState.displayScore, AppConfig.TOTAL_SCORE_FORMAT_FULL);

        // 生成済みのキャッシュ画像を各宝石の座標・角度に合わせてスタンプ描画
        for (let i = 0; i < GEMS.length; i++) {
            const gem = GEMS[i];

            // gem.shapeKey は physics.js でオブジェクト生成時に付与する
            const cacheKey = `${gem.shapeKey}-${gem.colorId}`;
            const cachedCanvas = canvasCache.get(cacheKey);

            if (cachedCanvas) {
                const radius = gem.customRadius;
                const baseRadius = 50; // initCanvasCacheで指定した基準半径

                // 基準キャンバスに対するスケール比率
                let scale = radius / baseRadius;
                let isFlashing = false;
                let flashAlpha = 0.6;

                if (gem.render && gem.render.isTapOrigin) {
                    // 脈打ち（パルス）表現
                    const pulse = Math.sin(performance.now() / 100);
                    scale *= 1 + (0.05 * levelMultiplier * pulse);

                    // パーティクル発生
                    const spawnCount = Math.floor(1 * levelMultiplier);
                    effects.spawnSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, spawnCount);

                    // バースト発生（レーザー到達時）
                    if (effects.laserEffect.hasBurst(gem)) {
                        const burstCount = Math.floor(10 * levelMultiplier);
                        effects.spawnBurstSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, burstCount, levelMultiplier);
                    }
                } else if (effects.laserEffect.getShrinkTimer(gem) > 0) {
                    // 沈み込み表現（縮小） - 限界は0.5
                    const shrink = Math.max(0.5, 0.85 - (levelMultiplier - 1) * 0.05);
                    scale *= shrink;
                    isFlashing = true;
                    // フラッシュの強度 - 上限0.9
                    flashAlpha = Math.min(0.9, 0.6 + (levelMultiplier - 1) * 0.1);
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
