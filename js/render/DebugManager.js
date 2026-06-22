// DebugManager.js
import { AppConfig, GameState, THEME_COLORS, LIFE_CONFIG, PHASE_SHIFT_MATH } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { PhaseManager } from '../core/PhaseManager.js';
import { ENABLE_DEBUG_OVERLAY, DEBUG_START_INITIAL_VALUES } from '../core/DebugConfig.js';
import { UIManager } from '../core/UIManager.js';

export const DebugManager = {
    init(options = {}) {
        const isDebugStart = options.isDebugStart || false;

        if (isDebugStart && DEBUG_START_INITIAL_VALUES) {
            // デバッグスタート時の初期値インジェクション
            AppConfig.DEBUG_MODE = DEBUG_START_INITIAL_VALUES.debugMode ?? AppConfig.DEBUG_MODE;
            AppConfig.SHIFT_DECAY_MULT = DEBUG_START_INITIAL_VALUES.shiftDecayMult ?? AppConfig.SHIFT_DECAY_MULT;
            
            GameState.debug.bfsMultiplier = DEBUG_START_INITIAL_VALUES.bfsMultiplier ?? GameState.debug.bfsMultiplier;
            GameState.debug.scoreMultiplier = DEBUG_START_INITIAL_VALUES.scoreMultiplier ?? GameState.debug.scoreMultiplier;
            GameState.debug.lifeDecayMultiplier = DEBUG_START_INITIAL_VALUES.lifeDecayMultiplier ?? GameState.debug.lifeDecayMultiplier;
            GameState.debug.expMultiplier = DEBUG_START_INITIAL_VALUES.expMultiplier ?? GameState.debug.expMultiplier;
            GameState.debug.timeScale = DEBUG_START_INITIAL_VALUES.timeScale ?? GameState.debug.timeScale;
            GameState.debug.showWireframe = DEBUG_START_INITIAL_VALUES.showWireframe ?? GameState.debug.showWireframe;
        } else {
            // 通常スタート時またはアプリ起動時の無害化・デフォルトリセット
            AppConfig.SHIFT_DECAY_MULT = 1;

            GameState.debug = {
                bfsMultiplier: 1,
                scoreMultiplier: 1n,
                lifeDecayMultiplier: 1,
                expMultiplier: 1,
                timeScale: 1.0,
                showWireframe: false
            };
        }
    },

    draw(ctx) {
        // デバッグスタートボタン描画（ENABLE_DEBUG_OVERLAY が真、かつタイトル画面の場合のみ）
        if (ENABLE_DEBUG_OVERLAY && GameState.currentScene === 'TITLE') {
            const btnConf = LAYOUT_CONFIG.DEBUG_OVERLAY;
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
            ctx.filter = 'none';

            // ボタン背景（半透明赤系）と枠
            ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
            ctx.fillRect(btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);

            // テキスト
            ctx.fillStyle = '#ffffff';
            ctx.font = btnConf.START_BTN_FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DEBUG START', btnConf.START_BTN_X + btnConf.START_BTN_WIDTH / 2, btnConf.START_BTN_Y + btnConf.START_BTN_HEIGHT / 2);
            ctx.restore();

            // UIManagerへのヒットエリア座標更新 (レイヤー12: DEBUG_OVERLAY)
            UIManager.updateButtonRect('DEBUG_START_BTN', 12, btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);
        } else {
            UIManager.deactivateButton('DEBUG_START_BTN');
        }

        if (!AppConfig.DEBUG_MODE) return;

        // デバッグ用文字列の構築
        const debugLines = [];
        
        debugLines.push(`現在フェイズ：${PhaseManager.getCurrentPhaseName()}`);

        // LIFE減少内訳の計算 (1フレームあたり)
        const basePerFrame = LIFE_CONFIG.INITIAL_DECAY;
        const levelMult = Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
        const levelPerFrame = basePerFrame * levelMult;
        const levelDiff = levelPerFrame - basePerFrame;

        const timeMult = GameState.debug.lifeDecayMultiplier;
        const finalPerFrame = levelPerFrame * timeMult;
        const timeDiff = finalPerFrame - levelPerFrame;

        debugLines.push(`LIFE減少内訳：基:${basePerFrame.toFixed(2)}  時:${timeDiff.toFixed(2)}/f　LV:-${levelDiff.toFixed(2)}/f`);
        debugLines.push('');
        
        const activeColors = GameState.activeColors || [];
        let totalStats = 0;
        let minCount = Infinity;
        let maxCount = 0;
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 1;
            if (count < minCount) minCount = count;
            if (count > maxCount) maxCount = count;
            totalStats += GameState.stats[color] || 0;
        }
        if (minCount === Infinity) minCount = 1;
        if (maxCount === 0) maxCount = 1;

        debugLines.push(`全：合計 (${totalStats})個`);

        for (const color of activeColors) {
            let colorName = "不明";
            if (color === THEME_COLORS.RED) colorName = "赤";
            else if (color === THEME_COLORS.BLUE) colorName = "青";
            else if (color === THEME_COLORS.GREEN) colorName = "緑";
            else if (color === THEME_COLORS.YELLOW) colorName = "黄";
            else if (color === THEME_COLORS.PURPLE) colorName = "紫";
            else if (color === THEME_COLORS.ORANGE) colorName = "橙";
            else if (color === THEME_COLORS.CYAN) colorName = "水";

            const count = GameState.colorDestroyCounts[color] || 1;
            const actualEfficiency = minCount / count;

            const actualCount = GameState.stats[color] || 0;
            const internalCount = GameState.colorDestroyCounts[color] || 0;
            const pureBonus = Math.max(0, internalCount - actualCount);
            const effPercent = (actualEfficiency * 100).toFixed(1);
            const actualCountStr = actualCount.toString().padStart(4, '0');
            const pureBonusStr = pureBonus.toString().padStart(3, '0');
            const effStr = effPercent.padStart(5, '0');
            debugLines.push(`${colorName}：破 ${actualCountStr}個 + 補 ${pureBonusStr}個 / 効 ${effStr}%`);
        }

        debugLines.push('');
        const decayRate = Math.pow(PHASE_SHIFT_MATH.GAUGE_ACQUISITION_DECAY_RATE || 0.8, GameState.whitePhaseCount || 0).toFixed(2);
        debugLines.push(`Ｓゲージ： ${Math.floor(PhaseManager.phaseGauge).toString().padStart(4, '0')} / ＋${Math.floor(PhaseManager.lastGaugeAdd)} (補正 x${decayRate}) / -${PhaseManager.lastDecayAmount.toFixed(1)}/s / 回数x${GameState.whitePhaseCount || 0}`);
        debugLines.push(`Ｒゲージ： ${Math.floor(PhaseManager.breakGauge || 0).toString().padStart(4, '0')} / ＋${Math.floor(PhaseManager.lastBreakGaugeAdd || 0)} / -${(PhaseManager.lastBreakDecayAmount || 0).toFixed(1)}/s`);

        if (debugLines.length === 0) return;

        // デバッグウィンドウの描画
        const conf = LAYOUT_CONFIG.DEBUG_OVERLAY;
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.font = conf.WINDOW_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // 読みやすくするための黒半透明背景
        ctx.fillStyle = conf.WINDOW_BG_COLOR;
        ctx.fillRect(
            conf.WINDOW_X,
            conf.WINDOW_Y,
            conf.WINDOW_WIDTH,
            debugLines.length * conf.LINE_HEIGHT + (conf.WINDOW_PADDING * 2)
        );

        ctx.fillStyle = conf.TEXT_COLOR;
        let y = conf.TEXT_START_Y;
        for (const line of debugLines) {
            ctx.fillText(line, conf.TEXT_OFFSET_X, y);
            y += conf.LINE_HEIGHT;
        }
        ctx.restore();
    }
};
