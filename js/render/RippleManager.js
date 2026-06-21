// RippleManager.js
import { AppConfig, EFFECT_MATH_CONFIG } from '../core/config.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';

class RippleManagerClass {
    constructor() {
        this.ripples = [];
    }

    createRipple(x, y) {
        if (AppConfig.EFFECT_LEVEL === 'NONE') return;
        this.ripples.push({
            x: x,
            y: y,
            elapsed: 0,
            duration: EFFECT_MATH_CONFIG.RIPPLE_DURATION_MS
        });
    }

    update(realDelta, gameDelta) {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.elapsed += gameDelta;
            if (r.elapsed >= r.duration) {
                this.ripples.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (this.ripples.length === 0) return;

        const sprite = SpriteCacheManager.get('ripple');
        if (!sprite) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            const elapsed = r.elapsed;

            const progress = elapsed / r.duration;
            let scale, opacity;

            if (progress <= 0.55) {
                const p = progress / 0.55;
                // scale(0)による描画エラーを防ぐため最小値0.01を保証
                scale = Math.max(0.01, p * 0.8);
                opacity = Math.max(0, 1.0 - (p * 0.2));
            } else {
                const p = (progress - 0.55) / 0.45;
                scale = Math.max(0.01, 0.8 + (p * 0.2));
                opacity = Math.max(0, 0.8 * (1.0 - p));
            }

            // 無効な値(NaN)の防御
            if (Number.isNaN(scale) || Number.isNaN(opacity)) {
                this.ripples.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.scale(scale, scale);
            ctx.globalAlpha = opacity;
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            ctx.restore();
        }
        ctx.restore();
    }
}

export const rippleManager = new RippleManagerClass();
