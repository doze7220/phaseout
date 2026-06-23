import { POPUP_EFFECT_CONFIG } from '../core/effectConfig.js';
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

        const layoutConfig = POPUP_EFFECT_CONFIG.FLOAT_TEXT_LAYOUT;
        const numberScale = layoutConfig.NUMBER_SCALE;
        const labelScale = layoutConfig.LABEL_SCALE;

        const paddingScaleNum = layoutConfig.PADDING_NUM * numberScale;
        const paddingScaleLbl = layoutConfig.PADDING_LBL * labelScale;

        const numDispWidth = totalWidth * numberScale;
        const lblDispWidth = labelAdvanceWidth * labelScale;

        const canvasWidth = Math.max(numDispWidth + paddingScaleNum * 2, lblDispWidth + paddingScaleLbl * 2);
        const gap = layoutConfig.GAP;

        const yOffset = (layoutConfig.LABEL_Y_BASE * labelScale) + gap - (layoutConfig.NUM_Y_BASE * numberScale);
        const numDispHeight = layoutConfig.NUM_HEIGHT * numberScale;
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
        if (type === 'damage') { typeOffsetX = POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; typeOffsetY = POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; }
        if (type === 'heal') { typeOffsetX = POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET.HEAL; typeOffsetY = POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET.HEAL; }
        if (type === 'exp') { typeOffsetY = POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET.EXP; }

        const randomX = (Math.random() - 0.5) * POPUP_EFFECT_CONFIG.FLOAT_TEXT_LAYOUT.RANDOM_X_RANGE;
        const finalX = x + randomX + typeOffsetX;
        const finalY = y - canvasHeight + typeOffsetY;

        this.floatingTexts.push({
            image: canvas,
            x: finalX,
            y: finalY,
            elapsed: 0,
            delay: delay,
            duration: POPUP_EFFECT_CONFIG.FLOAT_TEXT_DURATION_MS
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
            const animConfig = POPUP_EFFECT_CONFIG.FLOAT_TEXT_ANIM;
            let opacity = 0;
            let offsetY = animConfig.INITIAL_OFFSET_Y;
            let scale = animConfig.INITIAL_SCALE;

            // フローティングアニメーションの進行処理（出現・拡大・消失）
            if (progress <= animConfig.PHASE1_END) {
                const p = progress / animConfig.PHASE1_END;
                opacity = p;
                offsetY = animConfig.INITIAL_OFFSET_Y * (1 - p);
                scale = animConfig.INITIAL_SCALE + (animConfig.PHASE1_TARGET_SCALE - animConfig.INITIAL_SCALE) * p;
            } else if (progress <= animConfig.PHASE2_END) {
                const p = (progress - animConfig.PHASE1_END) / (animConfig.PHASE2_END - animConfig.PHASE1_END);
                opacity = 1;
                offsetY = 0;
                scale = animConfig.PHASE1_TARGET_SCALE - (animConfig.PHASE1_TARGET_SCALE - animConfig.PHASE2_TARGET_SCALE) * p;
            } else {
                const p = (progress - animConfig.PHASE2_END) / (1.0 - animConfig.PHASE2_END);
                opacity = 1 - p;
                offsetY = animConfig.PHASE3_FINAL_OFFSET_Y * p;
                scale = animConfig.PHASE2_TARGET_SCALE;
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
