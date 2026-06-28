import { THEME_COLORS } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { SKILL_POPUP_EFFECT_CONFIG } from '../core/effectConfig.js';

export class SkillPopupRenderer {
    constructor() {
        this.popups = [];
    }

    update(gameDelta) {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const p = this.popups[i];
            p.elapsed += gameDelta;
            if (p.elapsed >= SKILL_POPUP_EFFECT_CONFIG.DURATION_MS) {
                this.popups.splice(i, 1);
            }
        }
    }

    showSkillPopup(skillName, colorId, slotIndex) {
        // パネル描画順: 左から2人目(1), 1人目(0), 3人目(2)
        const slotMapping = [1, 0, 2];
        const panelIndex = slotMapping.indexOf(slotIndex);
        if (panelIndex === -1) return;

        // X座標の計算: 3分割されたパネルの中央
        const configUI = LAYOUT_CONFIG.FOOTER_UI;
        const totalWidth = LAYOUT_CONFIG.BASE.WIDTH - configUI.PADDING * 2;
        const panelWidth = (totalWidth - configUI.GAP * (configUI.PANEL_COUNT - 1)) / configUI.PANEL_COUNT;
        const startX = configUI.PADDING;
        const x = startX + panelIndex * (panelWidth + configUI.GAP) + panelWidth / 2;

        // Y座標の計算: フッター上端からのオフセット
        const baseY = LAYOUT_CONFIG.BASE.HEIGHT - LAYOUT_CONFIG.BASE.FOOTER_HEIGHT;
        const y = baseY + LAYOUT_CONFIG.SKILL_POPUP.START_Y_OFFSET;

        this.popups.push({
            skillName: skillName,
            colorId: colorId,
            x: x,
            y: y,
            elapsed: 0
        });
    }

    draw(ctx) {
        if (this.popups.length === 0) return;

        const config = LAYOUT_CONFIG.SKILL_POPUP;
        const effect = SKILL_POPUP_EFFECT_CONFIG;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const p of this.popups) {
            const progress = p.elapsed / effect.DURATION_MS;
            
            let alpha = 1.0;
            if (progress < effect.FADE_IN_END) {
                alpha = progress / effect.FADE_IN_END;
            } else if (progress > effect.FADE_OUT_START) {
                alpha = 1.0 - (progress - effect.FADE_OUT_START) / (1.0 - effect.FADE_OUT_START);
            }

            const currentY = p.y + effect.MOVE_Y_TOTAL * progress;
            const themeColor = THEME_COLORS[p.colorId] || THEME_COLORS.CYAN;

            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.shadowColor = themeColor;
            ctx.shadowBlur = effect.GLOW_BLUR;

            // 1行目: SKILL EXEC
            ctx.font = config.FONT_TITLE;
            ctx.fillStyle = config.COLOR_TITLE;
            ctx.fillText("SKILL EXEC", p.x, currentY);

            // 2行目: <<skillName>>
            ctx.font = config.FONT_NAME;
            ctx.fillStyle = themeColor;
            ctx.fillText(`<<${p.skillName}>>`, p.x, currentY + config.TEXT_GAP);
        }

        ctx.restore();
    }
}
