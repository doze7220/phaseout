// RippleManager.js
import { AppConfig } from '../core/config.js';
import { RIPPLE_CONFIG } from '../core/effectConfig.js';
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
            duration: RIPPLE_CONFIG.RIPPLE_DURATION_MS
        });
    }

    update(realDelta, gameDelta) {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.elapsed += realDelta;
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
        ctx.globalCompositeOperation = RIPPLE_CONFIG.COMPOSITE_OP;

        const anim = RIPPLE_CONFIG.ANIM;

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            const elapsed = r.elapsed;

            const progress = elapsed / r.duration;
            let scale, opacity;

            if (progress <= anim.PHASE1_END) {
                const p = progress / anim.PHASE1_END;
                scale = Math.max(anim.MIN_SCALE, p * anim.PHASE1_TARGET_SCALE);
                opacity = Math.max(0, 1.0 - (p * (1.0 - anim.PHASE1_TARGET_OPACITY)));
            } else {
                const phase2Duration = 1.0 - anim.PHASE1_END;
                const p = (progress - anim.PHASE1_END) / phase2Duration;
                scale = Math.max(anim.MIN_SCALE, anim.PHASE1_TARGET_SCALE + (p * (anim.PHASE2_TARGET_SCALE - anim.PHASE1_TARGET_SCALE)));
                opacity = Math.max(0, anim.PHASE1_TARGET_OPACITY - (p * (anim.PHASE1_TARGET_OPACITY - anim.PHASE2_TARGET_OPACITY)));
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
