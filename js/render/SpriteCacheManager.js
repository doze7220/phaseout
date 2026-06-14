// SpriteCacheManager.js
import { SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, FLOATING_TEXT_CONFIG, THEME_COLORS } from '../core/config.js';

export const AssetManager = {
    images: {},
    async loadAssets() {
        const shapes = ['circle', 'triangle', 'square', 'rectangle'];
        const shapePromises = shapes.map(shape => {
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

        const symbols = ['symbol_1', 'symbol_2', 'symbol_3', 'symbol_4', 'symbol_5', 'symbol_6', 'symbol_7'];
        const symbolPromises = symbols.map(symbol => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `./assets/img/symbol/${symbol}.png`;
                img.onload = () => {
                    this.images[symbol] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: ${symbol}.png`);
                    resolve();
                };
            });
        });

        await Promise.all([...shapePromises, ...symbolPromises]);
    }
};

class SpriteCacheManagerClass {
    constructor() {
        this.cache = new Map();
        this.isLoaded = false;
    }

    async preloadAssets() {
        if (!this.isLoaded) {
            await AssetManager.loadAssets();
            this.isLoaded = true;
        }
    }

    generateAllCaches() {
        this.cache.clear();
        this.generateGemCaches();
        this.generateEffectCaches();
        this.generateScoreCaches();
    }

    get(key) {
        return this.cache.get(key);
    }

    getGem(shape, colorId) {
        return this.cache.get(`${shape}-${colorId}`);
    }

    generateGemCaches() {
        const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
        const activeColors = COLOR_CONFIG.filter(c => c.enabled);

        for (const shape of activeShapes) {
            for (let i = 0; i < activeColors.length; i++) {
                const colorDef = activeColors[i];
                const cacheKey = `${shape}-${i}`;

                const size = 200;
                const baseRadius = 50;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                this._drawRichGem(ctx, size / 2, size / 2, baseRadius, shape, colorDef);
                this.cache.set(cacheKey, canvas);
            }
        }
    }

    generateEffectCaches() {
        const activeColors = COLOR_CONFIG.filter(c => c.enabled);

        for (const colorDef of activeColors) {
            const color = colorDef.color;
            
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
            this.cache.set(`spark-${color}`, sparkCanvas);

            const particleCanvas = document.createElement('canvas');
            particleCanvas.width = 16;
            particleCanvas.height = 16;
            const pCtx = particleCanvas.getContext('2d');
            pCtx.fillStyle = color;
            pCtx.fillRect(0, 0, 16, 16);
            this.cache.set(`particle-${color}`, particleCanvas);
        }

        const rippleSize = 160;
        const rippleRadius = 60;
        const rippleCanvas = document.createElement('canvas');
        rippleCanvas.width = rippleSize;
        rippleCanvas.height = rippleSize;
        const rctx = rippleCanvas.getContext('2d');
        
        rctx.beginPath();
        rctx.arc(rippleSize / 2, rippleSize / 2, rippleRadius, 0, Math.PI * 2);
        rctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        rctx.fill();
        
        rctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        rctx.lineWidth = 2;
        rctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        rctx.shadowBlur = 10;
        rctx.stroke();
        rctx.stroke();
        
        this.cache.set('ripple', rippleCanvas);
    }

    generateScoreCaches() {
        const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ':', '-', 's', '/', ' ', 'R', 'A', 'T', 'E', 'P', 'C', 'O', 'S', 'x', 'I', 'M'];
        const SCORE_UNITS = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極'];

        const colorSets = [
            { prefix: 'char', color: '#fff' },
            { prefix: 'char-orange', color: THEME_COLORS.ORANGE }
        ];

        for (const set of colorSets) {
            for (const c of chars) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                const metrics = ctx.measureText(c);
                const padding = 6;
                canvas.width = Math.max(Math.ceil(metrics.width), 16) + padding;
                canvas.height = 42;

                ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.textBaseline = 'alphabetic';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowOffsetY = 4;
                ctx.shadowBlur = 6;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';
                ctx.strokeText(c, padding / 2, 36);

                ctx.shadowColor = 'transparent';
                ctx.fillStyle = set.color;
                ctx.fillText(c, padding / 2, 36);

                canvas.advanceWidth = canvas.width - padding;
                this.cache.set(`${set.prefix}-${c}`, canvas);
            }
        }

        for (const unit of SCORE_UNITS) {
            for (let tier = 0; tier <= 3; tier++) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const asterisks = '*'.repeat(tier);
                let astMetrics = { width: 0 };
                if (asterisks) {
                    ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                    astMetrics = ctx.measureText(asterisks);
                }

                ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                const unitMetrics = ctx.measureText(unit);

                const padding = 6;
                const w = Math.max(Math.ceil(unitMetrics.width), Math.ceil(astMetrics.width)) + padding;
                canvas.width = w;
                canvas.height = 42;

                let color = THEME_COLORS.YELLOW;
                let glowColor = 'transparent';
                let glowBlur = 0;
                if (tier === 1) { color = THEME_COLORS.CYAN; glowColor = THEME_COLORS.CYAN; glowBlur = 3; }
                if (tier === 2) { color = THEME_COLORS.RED; glowColor = THEME_COLORS.RED; glowBlur = 5; }
                if (tier >= 3) { color = THEME_COLORS.PURPLE; glowColor = THEME_COLORS.PURPLE; glowBlur = 5; }

                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowOffsetY = 4;
                ctx.shadowBlur = 6;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';

                if (asterisks) {
                    ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                    ctx.textBaseline = 'alphabetic';
                    ctx.strokeText(asterisks, (w - astMetrics.width) / 2, 16);
                }

                ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.textBaseline = 'alphabetic';
                ctx.strokeText(unit, (w - unitMetrics.width) / 2, 36);

                ctx.shadowOffsetY = 0;
                ctx.shadowColor = glowColor;
                ctx.shadowBlur = glowBlur;
                ctx.fillStyle = color;

                if (asterisks) {
                    ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                    ctx.fillText(asterisks, (w - astMetrics.width) / 2, 16);
                }

                ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText(unit, (w - unitMetrics.width) / 2, 36);

                canvas.advanceWidth = canvas.width - padding;
                this.cache.set(`unit-${unit}-${tier}`, canvas);
            }
        }

        const floatChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-'];
        for (const type of Object.keys(FLOATING_TEXT_CONFIG.COLORS)) {
            const color = FLOATING_TEXT_CONFIG.COLORS[type];
            const label = FLOATING_TEXT_CONFIG.LABELS[type];

            const canvasL = document.createElement('canvas');
            const ctxL = canvasL.getContext('2d');
            ctxL.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            const metricsL = ctxL.measureText(label);
            const wL = Math.ceil(metricsL.width);
            const padding = 12;
            canvasL.width = Math.max(wL + padding * 2, 16);
            canvasL.height = 54;
            ctxL.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            ctxL.fillStyle = color;
            ctxL.shadowColor = 'rgba(0,0,0,0.8)';
            ctxL.shadowOffsetY = 4;
            ctxL.shadowBlur = 6;
            ctxL.textBaseline = 'alphabetic';
            ctxL.fillText(label, padding, 40);
            canvasL.advanceWidth = wL;
            this.cache.set(`float-label-${type}`, canvasL);

            for (const c of floatChars) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                const metrics = ctx.measureText(c);
                const wC = Math.ceil(metrics.width);
                canvas.width = Math.max(wC + padding * 2, 16);
                canvas.height = 54;
                ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.textBaseline = 'alphabetic';

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';
                ctx.strokeText(c, padding, 40);

                ctx.fillStyle = color;
                ctx.fillText(c, padding, 40);
                canvas.advanceWidth = wC;
                this.cache.set(`float-char-${type}-${c}`, canvas);
            }
        }
    }

    _drawRichGem(ctx, x, y, radius, shape, colorDef) {
        ctx.save();

        // 物理エンジン(Matter.js)の正三角形(sides=3)は左(180度)を向いて生成されます。
        // 一方、画像テクスチャや描画コードは上(-90度)を向いています。
        // この90度のズレを補正し、かつ床に落ちて平らな面が下になった時に画像が正しく「上」を向くようにするため、
        // 描画時に-90度(-Math.PI / 2)回転させます。
        if (shape === 'triangle') {
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 2);
            ctx.translate(-x, -y);
        }

        const color = colorDef.color;
        const isFlat = GRAPHICS_CONFIG.GEM_STYLE === 'flat';

        let drawW, drawH, drawX, drawY;

        if (shape === 'circle') {
            drawW = radius * 2; drawH = radius * 2;
            drawX = x - radius; drawY = y - radius;
        } else if (shape === 'triangle') {
            const r = radius + 2;
            drawW = r * 2.2; drawH = r * 2.2;
            drawX = x - drawW / 2; drawY = y - r;
        } else if (shape === 'square') {
            const sqSize = radius * 2 * 0.8;
            drawW = sqSize; drawH = sqSize;
            drawX = x - sqSize / 2; drawY = y - sqSize / 2;
        } else if (shape === 'rectangle') {
            const w = radius * 1.5;
            const h = w * 2;
            drawW = w; drawH = h;
            drawX = x - w / 2; drawY = y - h / 2;
        }

        if (isFlat) {
            ctx.fillStyle = color;
            ctx.beginPath();
            if (shape === 'circle') {
                ctx.arc(x, y, radius, 0, Math.PI * 2);
            } else if (shape === 'triangle') {
                const r = radius + 2;
                ctx.moveTo(x, y - r);
                ctx.lineTo(x + r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
                ctx.lineTo(x - r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
                ctx.closePath();
            } else if (shape === 'square') {
                const sqSize = drawW;
                if (ctx.roundRect) {
                    ctx.roundRect(drawX, drawY, sqSize, sqSize, radius * 0.2);
                } else {
                    ctx.rect(drawX, drawY, sqSize, sqSize);
                }
            } else if (shape === 'rectangle') {
                const w = drawW;
                const h = drawH;
                if (ctx.roundRect) {
                    ctx.roundRect(drawX, drawY, w, h, radius * 0.2);
                } else {
                    ctx.rect(drawX, drawY, w, h);
                }
            }
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else {
            const img = AssetManager.images[shape];
            if (img) {
                let imgW = drawW;
                let imgH = drawH;
                let imgX = drawX;
                let imgY = drawY;

                if (shape === 'rectangle') {
                    // 画像は1:1正方形(1024x1024)で中央に1:2の矩形がある。
                    // 物理サイズの高さ(drawH)に合わせた正方形として描画する
                    imgW = drawH;
                    imgH = drawH;
                    imgX = x - imgW / 2;
                    imgY = y - imgH / 2;
                } else if (shape === 'triangle') {
                    // 画像の中心がテクスチャの中央にあり、上頂点が上端付近にある（外接円半径＝画像サイズの半分）と想定
                    // 物理枠の外接円半径 r に合わせて 2*r の正方形として描画する
                    const r = radius + 2;
                    imgW = r * 2;
                    imgH = r * 2;
                    imgX = x - r;
                    imgY = y - r;
                }

                // --- 宝石の質感を活かした着色 ---
                // 1. 画像のアルファチャンネル（シルエット）を活かして単色で塗りつぶす
                ctx.drawImage(img, imgX, imgY, imgW, imgH);
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillStyle = color;
                ctx.fillRect(imgX, imgY, imgW, imgH);

                // 2. 元の画像の明るさ（ハイライトの白、シャドウの黒）を合成して立体感を復活させる
                // hard-light は画像（ソース）が明るければ白く（Screen）、暗ければ黒く（Multiply）合成するため宝石に最適
                ctx.globalCompositeOperation = 'hard-light';
                ctx.drawImage(img, imgX, imgY, imgW, imgH);
                
                ctx.globalCompositeOperation = 'source-over';
            }
        }
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        this._applySymbolStamp(ctx, x, y, radius, shape, colorDef);

        ctx.restore();
    }

    _applySymbolStamp(ctx, x, y, radius, shape, colorConfig) {
        if (!GRAPHICS_CONFIG.SHOW_SYMBOL) return;

        const symbolImg = AssetManager.images[colorConfig.symbolKey];
        if (!symbolImg) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = 512;
        offCanvas.height = 512;
        const offCtx = offCanvas.getContext('2d');

        offCtx.drawImage(symbolImg, 0, 0, 512, 512);

        offCtx.globalCompositeOperation = 'source-in';
        offCtx.fillStyle = colorConfig.symbolColor;
        offCtx.fillRect(0, 0, 512, 512);

        // 図形によってシンボルの適正サイズを変更
        let sizeRatio = 0.65;
        if (shape === 'triangle') {
            // 三角形の場合は内接円により近くするため、サイズを小さくする
            sizeRatio = 0.45;
        } else if (shape === 'rectangle') {
            sizeRatio = 0.55;
        }

        const drawSize = radius * 2 * sizeRatio;
        
        ctx.save();
        // 刻印が宝石に馴染むよう、オーバーレイ合成（アルファ値は COLOR_CONFIG の symbolColor のRGBA指定に従う）
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(offCanvas, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
        ctx.restore();
    }
}

export const SpriteCacheManager = new SpriteCacheManagerClass();
