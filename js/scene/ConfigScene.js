// ConfigScene.js
import { BaseScene } from './BaseScene.js';
import { GameState, AppConfig, GRAPHICS_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UI } from '../render/UIComponents.js';
import { SceneManager } from '../core/SceneManager.js';
import { soundManager } from '../render/SoundManager.js';
import * as effects from '../render/effects.js';
import { changelog } from '../../changelog.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
import { UIManager } from '../core/UIManager.js';

export class ConfigScene extends BaseScene {
    constructor() {
        super();
        this.window = null;
        this.btnClose = null;
        this.toggleDebug = null;
        this.toggleMathPopup = null;
        this.effectBtns = [];
        this.gemStyleBtns = [];
        this.changelogScrollUI = null;
        this.changelogLines = [];
        this.lineHeight = LAYOUT_CONFIG.CONFIG_SCENE.LOG_LINE_HEIGHT;

        this.closeImage = new Image();
        this.closeImage.src = './assets/img/ui/btn_close.png';
        
        this.prepareChangelog();
    }

    prepareChangelog() {
        this.changelogLines = [];
        for (const log of changelog) {
            this.changelogLines.push(`[${log.version}] ${log.date}`);
            for (const change of log.changes) {
                const maxLen = 35;
                let text = `- ${change}`;
                while (text.length > 0) {
                    this.changelogLines.push(text.substring(0, maxLen));
                    text = text.substring(maxLen);
                }
            }
            this.changelogLines.push("");
        }
    }

    init() {
        super.init();
        
        // パズル中のステイシス化
        if (GameState.currentScene === 'PUZZLE') {
            if (GameState.engine && !GameState.isGameOver) {
                GameState.engine.timing.timeScale = 0;
            }
            GameState.isStasis = true;
            effects.toggleStasisEffect(true);
            soundManager.setStasisFilter(true);
        }

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;
        const winWidth = LAYOUT_CONFIG.MODAL.WIDTH;
        const winHeight = LAYOUT_CONFIG.MODAL.HEIGHT;
        const startX = width / 2 - winWidth / 2;
        const startY = height / 2 - winHeight / 2;

        this.window = new UI.Window(startX, startY, winWidth, winHeight, "Config", { isModal: true });
        
        // 右上のXボタン
        const closeBtnSize = LAYOUT_CONFIG.MODAL.CLOSE_BTN_SIZE;
        const closeBtnX = startX + winWidth - closeBtnSize - LAYOUT_CONFIG.MODAL.CLOSE_BTN_RIGHT;
        const closeBtnY = startY + LAYOUT_CONFIG.MODAL.CLOSE_BTN_TOP;
        this.btnClose = new UI.ImageButton(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, this.closeImage);

        // デバッグモード切替トグル
        const debugToggleX = startX + winWidth - LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_RIGHT;
        const debugToggleY = startY + LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_Y;
        this.toggleDebug = new UI.ToggleSwitch(debugToggleX, debugToggleY, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.DEBUG_MODE);

        // エフェクト設定ボタン
        const effectLevels = ['FULL', 'LITE', 'NONE'];
        const effectBtnWidth = LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_WIDTH;
        const effectBtnHeight = LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_HEIGHT;
        const effectBtnStartX = startX + LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_LEFT;
        const effectBtnY = startY + LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_Y;

        this.effectBtns = effectLevels.map((level, index) => {
            const btnX = effectBtnStartX + index * (effectBtnWidth + LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_GAP);
            return {
                level: level,
                btn: new UI.TextButton(btnX, effectBtnY, effectBtnWidth, effectBtnHeight, level, { radius: effectBtnHeight / 2 })
            };
        });

        // 宝石スタイル設定ボタン
        const gemStyles = [
            { label: 'RICH', value: 'rich' },
            { label: 'FLAT', value: 'flat' }
        ];
        const gemStyleBtnY = startY + LAYOUT_CONFIG.CONFIG_SCENE.GEM_STYLE_BTN_Y;

        this.gemStyleBtns = gemStyles.map((item, index) => {
            const btnX = effectBtnStartX + index * (effectBtnWidth + LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_BTN_GAP);
            return {
                value: item.value,
                btn: new UI.TextButton(btnX, gemStyleBtnY, effectBtnWidth, effectBtnHeight, item.label, { radius: effectBtnHeight / 2 })
            };
        });

        // 詳細スコア表示トグル
        const mathToggleX = startX + winWidth - LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_RIGHT;
        const mathToggleY = startY + LAYOUT_CONFIG.CONFIG_SCENE.MATH_TOGGLE_Y;
        this.toggleMathPopup = new UI.ToggleSwitch(mathToggleX, mathToggleY, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.SHOW_MATH_POPUP);

        // ChangeLog スクロールエリア
        this.changelogScrollUI = new UI.ScrollArea('configScroll');
        this.logAreaX = startX + LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_LEFT;
        this.logAreaY = startY + LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_Y;
        this.logAreaWidth = winWidth - LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_MARGIN_RIGHT;
        this.logAreaHeight = winHeight - LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_MARGIN_BOTTOM;
    }

    update(deltaTime) {
        if (!this.isActive) return;
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return;

        if (this.window) this.window.updateAndDraw(ctx);

        // 内部のテキスト等描画
        const winX = this.window.x;
        const winY = this.window.y;
        
        // Xボタン
        if (this.btnClose) this.btnClose.updateAndDraw(ctx);

        // デバッグテキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
        ctx.fillText('デバッグモード', winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT, winY + LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TEXT_Y);
        
        if (this.toggleDebug) this.toggleDebug.updateAndDraw(ctx);

        // エフェクト設定テキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
        ctx.fillText('エフェクト設定', winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT, winY + LAYOUT_CONFIG.CONFIG_SCENE.EFFECT_TEXT_Y);

        for (const item of this.effectBtns) {
            item.btn.isActive = (AppConfig.EFFECT_LEVEL === item.level);
            item.btn.updateAndDraw(ctx);
        }

        // 宝石スタイル設定テキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
        ctx.fillText('宝石スタイル', winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT, winY + LAYOUT_CONFIG.CONFIG_SCENE.GEM_STYLE_TEXT_Y);

        for (const item of this.gemStyleBtns) {
            item.btn.isActive = (GRAPHICS_CONFIG.GEM_STYLE === item.value);
            item.btn.updateAndDraw(ctx);
        }

        // 詳細スコアテキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
        ctx.fillText('詳細スコア表示', winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT, winY + LAYOUT_CONFIG.CONFIG_SCENE.MATH_TEXT_Y);

        if (this.toggleMathPopup) this.toggleMathPopup.updateAndDraw(ctx);

        // ChangeLogテキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
        ctx.fillText('更新履歴', winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT, winY + LAYOUT_CONFIG.CONFIG_SCENE.LOG_TEXT_Y);

        ctx.fillStyle = '#222';
        ctx.fillRect(this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight);

        if (this.changelogScrollUI) {
            this.changelogScrollUI.updateAndDraw(ctx, this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight, this.changelogLines, {
                lineHeight: this.lineHeight,
                layer: 9
            });
        }
    }

    handleInput(pos, e) {
        // UIManager に登録されたUI（ScrollAreaの上/下ボタン等）の判定
        if (UIManager.handlePointerDown(pos, e)) {
            soundManager.playSE('TAP');
            return true;
        }

        // 枠外タップ判定
        if (this.window && !this.window.contains(pos.x, pos.y)) {
            soundManager.playSE('CANCEL');
            SceneManager.popScene();
            return true;
        }

        // Xボタン判定
        if (this.btnClose && this.btnClose.contains(pos.x, pos.y)) {
            soundManager.playSE('CANCEL');
            SceneManager.popScene();
            return true;
        }

        // デバッグモード切替
        if (this.toggleDebug && this.toggleDebug.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            this.toggleDebug.toggle();
            AppConfig.DEBUG_MODE = this.toggleDebug.isOn;
            return true;
        }

        // 詳細スコア表示切替
        if (this.toggleMathPopup && this.toggleMathPopup.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            this.toggleMathPopup.toggle();
            AppConfig.SHOW_MATH_POPUP = this.toggleMathPopup.isOn;
            if (typeof window !== 'undefined') localStorage.setItem('phaseout_show_math_popup', AppConfig.SHOW_MATH_POPUP);
            return true;
        }

        // エフェクト設定ボタン
        for (const item of this.effectBtns) {
            if (item.btn.contains(pos.x, pos.y)) {
                soundManager.playSE('TAP');
                AppConfig.EFFECT_LEVEL = item.level;
                if (typeof window !== 'undefined') localStorage.setItem('phaseout_effect_level', item.level);
                return true;
            }
        }

        // 宝石スタイル設定ボタン
        for (const item of this.gemStyleBtns) {
            if (item.btn.contains(pos.x, pos.y)) {
                soundManager.playSE('TAP');
                GRAPHICS_CONFIG.GEM_STYLE = item.value;
                SpriteCacheManager.generateAllCaches();
                if (typeof window !== 'undefined') localStorage.setItem('phaseout_gem_style', item.value);
                return true;
            }
        }

        return true; // モーダルなので背面の判定をブロック
    }

    destroy() {
        super.destroy();
        
        // パズル中のステイシス解除
        if (GameState.currentScene === 'PUZZLE') {
            GameState.isStasis = false;
            effects.toggleStasisEffect(false);
            GameState.disableStasisFilter = true;
            if (GameState.engine && !GameState.isGameOver) {
                GameState.engine.timing.timeScale = 1;
            }
            soundManager.setStasisFilter(false);
            setTimeout(() => { GameState.disableStasisFilter = false; }, 500);
        }
    }
}
