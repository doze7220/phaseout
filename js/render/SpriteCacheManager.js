// SpriteCacheManager.js
import { SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, FLOATING_TEXT_CONFIG, THEME_COLORS } from '../core/config.js';

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

                this._drawRichGem(ctx, size / 2, size / 2, baseRadius, shape, colorDef.color);
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

    _drawRichGem(ctx, x, y, radius, shape, color) {
        ctx.save();
        const isFlat = GRAPHICS_CONFIG.GEM_STYLE === 'flat';

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
            drawW = r * 2.2; drawH = r * 2.2;
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

        if (isFlat) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
        }
        ctx.stroke();

        if (!isFlat) {
            ctx.clip();
            const img = AssetManager.images[shape];
            if (img) {
                let padScale = 1.35;
                if (shape === 'triangle') padScale = 1.5;
                if (shape === 'circle') padScale = 1.3;

                const finalW = drawW * padScale;
                const finalH = drawH * padScale;
                const finalX = drawX - (finalW - drawW) / 2;
                const finalY = drawY - (finalH - drawH) / 2;

                ctx.globalCompositeOperation = 'overlay';
                ctx.drawImage(img, finalX, finalY, finalW, finalH);

                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = 0.5;
                ctx.drawImage(img, finalX, finalY, finalW, finalH);
            }
        }
        ctx.restore();
    }
}

export const SpriteCacheManager = new SpriteCacheManagerClass();
