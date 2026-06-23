import { EFFECT_MATH_CONFIG } from '../core/effectConfig.js';
import { getScoreSprite } from './ScoreRenderer.js';

export class FloatingNumberRenderer {
    constructor() {
        this.floatingTexts = [];
    }

    update(gameDelta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            if (ft.delay > 0) {
                ft.delay -= gameDelta;
            } else {
                ft.elapsed += gameDelta;
                if (ft.elapsed >= ft.duration) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }
    }

    showFloatingNumber(text, type, x, y, delay = 0) {
        const chars = text.split('');
        let totalWidth = 0;
        const sprites = [];
        for (const c of chars) {
            const sprite = getScoreSprite(`float-char-${type}-${c}`);
            if (sprite) {
                sprites.push(sprite);
                totalWidth += (sprite.advanceWidth || sprite.width);
            }
        }

        const labelSprite = getScoreSprite(`float-label-${type}`);
        const labelAdvanceWidth = labelSprite ? (labelSprite.advanceWidth || labelSprite.width) : 0;

        const numberScale = 1.125;
        const labelScale = 0.75;

        const paddingScaleNum = 12 * numberScale;
        const paddingScaleLbl = 12 * labelScale;

        const numDispWidth = totalWidth * numberScale;
        const lblDispWidth = labelAdvanceWidth * labelScale;

        const canvasWidth = Math.max(numDispWidth + paddingScaleNum * 2, lblDispWidth + paddingScaleLbl * 2);
        const gap = 1;

        const yOffset = (46 * labelScale) + gap - (16 * numberScale);
        const numDispHeight = 54 * numberScale;
        const canvasHeight = yOffset + numDispHeight;

        // キャッシュ用のオフスクリーンキャンバスを作成（DOMには追加しない）
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (labelSprite) {
            const lx = (canvasWidth - lblDispWidth) / 2 - paddingScaleLbl;
            ctx.drawImage(labelSprite, 0, 0, labelSprite.width, labelSprite.height, lx, 0, labelSprite.width * labelScale, labelSprite.height * labelScale);
        }

        let currentX = (canvasWidth - numDispWidth) / 2 - paddingScaleNum;
        for (const sprite of sprites) {
            const w = sprite.width * numberScale;
            const h = sprite.height * numberScale;
            ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, currentX, yOffset, w, h);
            currentX += (sprite.advanceWidth || sprite.width) * numberScale;
        }

        let typeOffsetX = 0;
        let typeOffsetY = 0;
        if (type === 'damage') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; }
        if (type === 'heal') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; }
        if (type === 'exp') { typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.EXP; }

        const randomX = (Math.random() - 0.5) * 40;
        const finalX = x + randomX + typeOffsetX;
        const finalY = y - canvasHeight + typeOffsetY;

        this.floatingTexts.push({
            image: canvas,
            x: finalX,
            y: finalY,
            elapsed: 0,
            delay: delay,
            duration: EFFECT_MATH_CONFIG.FLOAT_TEXT_DURATION_MS
        });
    }

    draw(ctx) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            if (ft.delay > 0) continue;

            const elapsed = ft.elapsed;
            if (elapsed >= ft.duration) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            const progress = elapsed / ft.duration;
            let opacity = 0;
            let offsetY = 10;
            let scale = 0.8;

            // CSSアニメーション .floatUp の再現
            if (progress <= 0.15) {
                const p = progress / 0.15;
                opacity = p;
                offsetY = 10 - (10 * p);
                scale = 0.8 + 0.3 * p;
            } else if (progress <= 0.30) {
                const p = (progress - 0.15) / 0.15;
                opacity = 1;
                offsetY = 0;
                scale = 1.1 - 0.1 * p;
            } else {
                const p = (progress - 0.30) / 0.70;
                opacity = 1 - p;
                offsetY = -60 * p;
                scale = 1.0;
            }

            ctx.save();
            ctx.translate(ft.x, ft.y + offsetY);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.max(0, opacity);
            ctx.drawImage(ft.image, -ft.image.width / 2, 0);
            ctx.restore();
        }
    }
}
