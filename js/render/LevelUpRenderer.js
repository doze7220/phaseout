import { AppConfig, THEME_COLORS } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';

export class LevelUpRenderer {
    constructor() {
        this.levelUpState = { active: false, oldLevel: 0, newLevel: 0, r1Str: '', r2Str: '', oldCost: 0, newCost: 0, elapsed: 0, duration: 2500 };
    }

    update(gameDelta) {
        if (this.levelUpState.active) {
            this.levelUpState.elapsed += gameDelta;
        }
    }

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        const isMobile = window.innerWidth <= 600;
        const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_RATE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_RATE;

        const r1Str = oldRate >= 10000 ? (oldRate.toExponential(2)) : (oldRate % 1 === 0 ? oldRate : oldRate.toFixed(1));
        const r2Str = newRate >= 10000 ? (newRate.toExponential(2)) : (newRate % 1 === 0 ? newRate : newRate.toFixed(1));

        this.levelUpState = {
            active: true,
            oldLevel, newLevel,
            r1Str, r2Str,
            oldCost: Math.floor(oldCost), newCost: Math.floor(newCost),
            elapsed: 0,
            duration: 2500
        };
    }

    draw(ctx) {
        if (this.levelUpState.active) {
            const lu = this.levelUpState;
            const elapsed = lu.elapsed;
            if (elapsed >= lu.duration) {
                lu.active = false;
            } else {
                let opacity = 1.0;
                let scale = 1.0;

                // フェードイン＆スケール
                if (elapsed < 200) {
                    scale = 0.8 + 0.2 * (elapsed / 200);
                }
                // フェードアウト
                if (elapsed > 2000) {
                    opacity = 1.0 - ((elapsed - 2000) / 500);
                }

                const conf = LAYOUT_CONFIG.POPUPS;
                ctx.save();
                ctx.translate(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2);
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

                // 背景帯
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y, LAYOUT_CONFIG.BASE.WIDTH, conf.LEVEL_UP_BG_HEIGHT);
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y);
                ctx.lineTo(LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y);
                ctx.moveTo(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y + conf.LEVEL_UP_BG_HEIGHT);
                ctx.lineTo(LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y + conf.LEVEL_UP_BG_HEIGHT);
                ctx.stroke();

                ctx.scale(scale, scale);

                // テキスト描画
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.font = conf.FONT_LEVEL_UP_TITLE;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 10;
                ctx.fillText('STIRRING LEVEL UP', 0, conf.LEVEL_UP_TITLE_Y);

                ctx.font = conf.FONT_LEVEL_UP_LEVEL;
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.fillText(`Lv.${lu.oldLevel} >>> Lv.${lu.newLevel}`, 0, conf.LEVEL_UP_LEVEL_Y);

                ctx.font = conf.FONT_LEVEL_UP_STATS;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 0;

                // Rate
                ctx.textAlign = 'right';
                ctx.fillStyle = '#00FFFF'; ctx.fillText('RATE', conf.LEVEL_UP_RATE_LABEL_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = '#aaaaaa'; ctx.fillText(`${lu.r1Str}x`, conf.LEVEL_UP_RATE_OLD_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = '#FF00FF'; ctx.fillText('>>>', conf.LEVEL_UP_RATE_ARROW_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = THEME_COLORS.GREEN; ctx.fillText(`${lu.r2Str}x`, conf.LEVEL_UP_RATE_NEW_X, conf.LEVEL_UP_RATE_Y);

                // Cost
                ctx.fillStyle = '#00FFFF'; ctx.fillText('COST', conf.LEVEL_UP_RATE_LABEL_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = '#aaaaaa'; ctx.fillText(`-${lu.oldCost}`, conf.LEVEL_UP_RATE_OLD_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = '#FF00FF'; ctx.fillText('>>>', conf.LEVEL_UP_RATE_ARROW_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = THEME_COLORS.GREEN; ctx.fillText(`-${lu.newCost}`, conf.LEVEL_UP_RATE_NEW_X, conf.LEVEL_UP_COST_Y);

                ctx.restore();
            }
        }
    }
}
