// ConfigScene.js
import { BaseScene } from './BaseScene.js';
import { GameState, AppConfig, saveConfig } from '../core/config.js';
import { GRAPHICS_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UI } from '../render/UIComponents.js';
import { SceneManager } from '../core/SceneManager.js';
import { soundManager } from '../render/SoundManager.js';
import * as effects from '../render/effects.js';
import { changelog } from '../../changelog.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
import { UIManager } from '../core/UIManager.js';
import { PhaseManager } from '../core/PhaseManager.js';
import { DEBUG_VALUES } from '../core/DebugConfig.js';

export class ConfigScene extends BaseScene {
    constructor() {
        super();
        this.window = null;
        this.btnClose = null;
        this.tabGroup = null;

        // Setting Tab
        this.effectBtns = [];
        this.gemStyleBtns = [];
        this.gemOutlineBtns = [];
        this.toggleSymbol = null;
        this.visualizerBtns = [];
        this.toggleMathPopup = null;
        this.toggleAudio = null;
        this.toggleResultAnim = null;
        this.whitePhaseBtns = [];

        // Changelog Tab
        this.changelogScrollUI = null;
        this.changelogLines = [];
        this.lineHeight = LAYOUT_CONFIG.CONFIG_SCENE.LOG_LINE_HEIGHT;

        // Copyright Tab
        this.copyrightScrollUI = null;
        this.copyrightLines = [
            "【PHASE OUT ∴ Cluster Stirring】",
            "　Copyright (c) 2026 ozlab",
            "",
            "■ 使用素材について",
            "",
            "GRAPHIC:",
            "　AI生成(ChatGPT,Gemini等)",
            "",
            "BGM・SE:",
            "　Springin’ Sound Stock 様",
            "　無料効果音で遊ぼう！ 様",
            "　甘茶の音楽工房 様",
            "　魔王魂 様",
            ""
        ];

        // DEBUG Tab
        this.toggleDebug = null;
        this.bfsBtns = [];
        this.scoreBtns = [];
        this.lifeDecayBtns = [];
        this.expBtns = [];
        this.speedBtns = [];
        this.wireframeBtns = [];

        this.closeImage = new Image();
        this.closeImage.src = './assets/img/ui/btn_close.png';

        this.prepareChangelog();
    }

    prepareChangelog() {
        this.changelogLines = [];
        for (const log of changelog) {
            this.changelogLines.push(`[${log.version}] ${log.date}`);
            for (const change of log.changes) {
                const maxLen = LAYOUT_CONFIG.CONFIG_SCENE.LOG_LINE_MAX_LEN;
                let text = `- ${change}`;
                while (text.length > 0) {
                    this.changelogLines.push(text.substring(0, maxLen));
                    text = text.substring(maxLen);
                    // 2行目以降はインデントをつける
                    if (text.length > 0) {
                        text = "  " + text;
                    }
                }
            }
            this.changelogLines.push("");
        }
    }

    init() {
        super.init();

        // パズル中のステイシス化
        if (GameState.currentScene === 'PUZZLE') {
            GameState.isPuzzlePaused = true;
            GameState.isSystemPaused = true;
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

        // 右上のXボタン (タイトルバーと同じサイズに変更)
        const closeBtnSize = LAYOUT_CONFIG.MODAL.TITLE_HEIGHT;
        const closeBtnX = startX + winWidth - closeBtnSize;
        const closeBtnY = startY;
        this.btnClose = new UI.ImageButton(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, this.closeImage);

        // タブグループ
        const tabs = ['設定', '更新履歴', 'クレジット', 'DEBUG'];
        this.tabGroup = new UI.TabGroup(startX + 10, startY + 45, winWidth - 20, 50, tabs);

        // -- Layout common settings --
        const itemLeftX = startX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT;
        const toggleRightX = startX + winWidth - LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_RIGHT;
        const groupRightEdgeX = toggleRightX + LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH;

        const btnWidth = 100;
        const btnHeight = 40;
        const btnGapX = 10;

        const createRightAlignedButtonGroup = (vals, y, formatFn) => {
            const totalWidth = vals.length * btnWidth + (vals.length - 1) * btnGapX;
            const startXPos = groupRightEdgeX - totalWidth;
            return vals.map((val, index) => {
                const btnX = startXPos + index * (btnWidth + btnGapX);
                const labelText = formatFn ? formatFn(val) : (val.label !== undefined ? val.label : val);
                const itemValue = val.value !== undefined ? val.value : val;
                return {
                    value: itemValue,
                    level: itemValue, // backward compatibility
                    mode: itemValue, // backward compatibility
                    btn: new UI.TextButton(btnX, y, btnWidth, btnHeight, labelText)
                };
            });
        };

        // -- Setting Tab UI --

        // エフェクト設定
        const effectLevels = ['FULL', 'LITE', 'NONE'];
        this.effectBtns = createRightAlignedButtonGroup(effectLevels, startY + 110);

        // ビジュアライザ設定
        const visModes = ['OSCILLO', 'BLOCK', 'GLITCH'];
        this.visualizerBtns = createRightAlignedButtonGroup(visModes, startY + 170);

        // 宝石スタイル設定
        const gemStyles = [{ label: 'H.LIGHT', value: 'h-light' }, { label: 'OVERLAY', value: 'overlay' }, { label: 'FLAT', value: 'flat' }];
        this.gemStyleBtns = createRightAlignedButtonGroup(gemStyles, startY + 230);

        // 宝石の強調表示
        const gemOutlines = ['FULL', 'LINE', 'NONE'];
        this.gemOutlineBtns = createRightAlignedButtonGroup(gemOutlines, startY + 290);

        // トライバル刻印表示
        this.toggleSymbol = new UI.ToggleSwitch(toggleRightX, startY + 350, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, GRAPHICS_CONFIG.SHOW_SYMBOL);

        // サウンドON/OFF
        this.toggleAudio = new UI.ToggleSwitch(toggleRightX, startY + 410, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.AUDIO_ENABLED);

        // 詳細スコア表示
        this.toggleMathPopup = new UI.ToggleSwitch(toggleRightX, startY + 470, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.SHOW_MATH_POPUP);

        // リザルトアニメーション
        this.toggleResultAnim = new UI.ToggleSwitch(toggleRightX, startY + 530, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.RESULT_ANIMATION);




        // -- Changelog Tab & Copyright Tab UI --
        this.logAreaX = startX + LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_LEFT;
        this.logAreaY = startY + 110;
        this.logAreaWidth = winWidth - LAYOUT_CONFIG.CONFIG_SCENE.LOG_AREA_MARGIN_RIGHT;
        this.logAreaHeight = winHeight - 130;

        this.changelogScrollUI = new UI.ScrollArea('changelogScroll');
        this.copyrightScrollUI = new UI.ScrollArea('copyrightScroll');


        // -- DEBUG Tab UI --
        this.toggleDebug = new UI.ToggleSwitch(toggleRightX, startY + 110, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_WIDTH, LAYOUT_CONFIG.CONFIG_SCENE.DEBUG_TOGGLE_HEIGHT, AppConfig.DEBUG_MODE);

        const cheatYStart = 170;
        const cheatGapY = 50;

        // BFS探索範囲
        this.bfsBtns = createRightAlignedButtonGroup(DEBUG_VALUES.BFS, startY + cheatYStart, v => `x${v}`);

        // スコア倍率
        this.scoreBtns = createRightAlignedButtonGroup(DEBUG_VALUES.SCORE, startY + cheatYStart + cheatGapY * 1);

        // LIFE減少倍率
        this.lifeDecayBtns = createRightAlignedButtonGroup(DEBUG_VALUES.LIFE_DECAY, startY + cheatYStart + cheatGapY * 2, v => `x${v}`);

        // 獲得EXP倍率
        this.expBtns = createRightAlignedButtonGroup(DEBUG_VALUES.EXP, startY + cheatYStart + cheatGapY * 3, v => `x${v}`);

        // ゲームスピード
        this.speedBtns = createRightAlignedButtonGroup(DEBUG_VALUES.SPEED, startY + cheatYStart + cheatGapY * 4, v => `x${v.toFixed(1)}`);

        // 物理ワイヤーフレーム
        this.wireframeBtns = createRightAlignedButtonGroup(DEBUG_VALUES.WIREFRAME, startY + cheatYStart + cheatGapY * 5);

        // シフト減衰倍率
        this.shiftDecayBtns = createRightAlignedButtonGroup(DEBUG_VALUES.SHIFT_DECAY, startY + cheatYStart + cheatGapY * 6);

        // シフトゲージ
        this.shiftGaugeBtns = createRightAlignedButtonGroup(DEBUG_VALUES.SHIFT_GAUGE, startY + cheatYStart + cheatGapY * 7);

        // リバースゲージ
        this.reverseGaugeBtns = createRightAlignedButtonGroup(DEBUG_VALUES.REVERSE_GAUGE, startY + cheatYStart + cheatGapY * 8);
    }


    onFadeInStart() {
        super.onFadeInStart();
    }

    update(realDelta, gameDelta) {
        if (!this.isActive) return;
        if (this.isTransitioning) return;

        // 非アクティブなタブのスクロールボタンの当たり判定を無効化する
        if (this.tabGroup && this.tabGroup.selectedIndex !== 1) {
            UIManager.deactivateButton('changelogScrollUp');
            UIManager.deactivateButton('changelogScrollDown');
        }
        if (this.tabGroup && this.tabGroup.selectedIndex !== 2) {
            UIManager.deactivateButton('copyrightScrollUp');
            UIManager.deactivateButton('copyrightScrollDown');
        }
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return;

        if (this.window) this.window.updateAndDraw(ctx);
        if (this.btnClose) this.btnClose.updateAndDraw(ctx);
        if (this.tabGroup) this.tabGroup.updateAndDraw(ctx);

        const winX = this.window.x;
        const winY = this.window.y;
        const itemLeftX = winX + LAYOUT_CONFIG.CONFIG_SCENE.PADDING_LEFT;

        const drawLabel = (text, y) => {
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = LAYOUT_CONFIG.BUTTON.FONT;
            ctx.fillText(text, itemLeftX, y);
        };

        switch (this.tabGroup.selectedIndex) {
            case 0: // 設定
                drawLabel('エフェクト設定', winY + 110 + 20);
                for (const item of this.effectBtns) {
                    item.btn.isActive = (AppConfig.EFFECT_LEVEL === item.level);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('ビジュアライザ', winY + 170 + 20);
                for (const item of this.visualizerBtns) {
                    item.btn.isActive = (AppConfig.VISUALIZER_MODE === item.mode);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('宝石スタイル', winY + 230 + 20);
                for (const item of this.gemStyleBtns) {
                    item.btn.isActive = (GRAPHICS_CONFIG.GEM_STYLE === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('宝石の強調表示', winY + 290 + 20);
                for (const item of this.gemOutlineBtns) {
                    item.btn.isActive = (GRAPHICS_CONFIG.GEM_OUTLINE === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('刻印シンボル', winY + 350 + 20);
                if (this.toggleSymbol) this.toggleSymbol.updateAndDraw(ctx);

                drawLabel('サウンド設定', winY + 410 + 20);
                if (this.toggleAudio) this.toggleAudio.updateAndDraw(ctx);

                drawLabel('詳細スコア表示', winY + 470 + 20);
                if (this.toggleMathPopup) this.toggleMathPopup.updateAndDraw(ctx);

                drawLabel('リザルトアニメーション', winY + 530 + 20);
                if (this.toggleResultAnim) this.toggleResultAnim.updateAndDraw(ctx);

                break;

            case 1: // 更新履歴
                ctx.fillStyle = '#222';
                ctx.fillRect(this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight);
                if (this.changelogScrollUI) {
                    this.changelogScrollUI.updateAndDraw(ctx, this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight, this.changelogLines, { lineHeight: this.lineHeight, layer: 9 });
                }
                break;

            case 2: // 著作権
                ctx.fillStyle = '#222';
                ctx.fillRect(this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight);
                if (this.copyrightScrollUI) {
                    this.copyrightScrollUI.updateAndDraw(ctx, this.logAreaX, this.logAreaY, this.logAreaWidth, this.logAreaHeight, this.copyrightLines, { lineHeight: this.lineHeight, layer: 9 });
                }
                break;

            case 3: // DEBUG
                drawLabel('システムデバッグ表示', winY + 110 + 20);
                if (this.toggleDebug) this.toggleDebug.updateAndDraw(ctx);

                const cheatYStart = 170;
                const cheatGapY = 50;

                drawLabel('BFS探索範囲', winY + cheatYStart + 20);
                for (const item of this.bfsBtns) {
                    item.btn.isActive = (GameState.debug.bfsMultiplier === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('スコア倍率', winY + cheatYStart + cheatGapY * 1 + 20);
                for (const item of this.scoreBtns) {
                    item.btn.isActive = (GameState.debug.scoreMultiplier === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('LIFE減少倍率', winY + cheatYStart + cheatGapY * 2 + 20);
                for (const item of this.lifeDecayBtns) {
                    item.btn.isActive = (GameState.debug.lifeDecayMultiplier === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('獲得EXP倍率', winY + cheatYStart + cheatGapY * 3 + 20);
                for (const item of this.expBtns) {
                    item.btn.isActive = (GameState.debug.expMultiplier === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('ゲームスピード', winY + cheatYStart + cheatGapY * 4 + 20);
                for (const item of this.speedBtns) {
                    item.btn.isActive = (GameState.debug.timeScale === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('物理ワイヤーフレーム', winY + cheatYStart + cheatGapY * 5 + 20);
                for (const item of this.wireframeBtns) {
                    item.btn.isActive = (GameState.debug.showWireframe === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('シフト減衰倍率', winY + cheatYStart + cheatGapY * 6 + 20);
                for (const item of this.shiftDecayBtns) {
                    item.btn.isActive = (AppConfig.SHIFT_DECAY_MULT === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('シフトゲージ', winY + cheatYStart + cheatGapY * 7 + 20);
                for (const item of this.shiftGaugeBtns) {
                    item.btn.isActive = (PhaseManager.phaseGauge === item.value);
                    item.btn.updateAndDraw(ctx);
                }

                drawLabel('リバースゲージ', winY + cheatYStart + cheatGapY * 8 + 20);
                for (const item of this.reverseGaugeBtns) {
                    item.btn.isActive = (PhaseManager.breakGauge === item.value);
                    item.btn.updateAndDraw(ctx);
                }
                break;
        }
    }

    handleInput(pos, e) {
        if (UIManager.handlePointerDown(pos, e)) {
            soundManager.playSE('TAP');
            return true;
        }

        if (this.window && !this.window.contains(pos.x, pos.y)) {
            soundManager.playSE('CANCEL');
            SceneManager.popScene();
            return true;
        }

        if (this.btnClose && this.btnClose.contains(pos.x, pos.y)) {
            soundManager.playSE('CANCEL');
            SceneManager.popScene();
            return true;
        }

        if (this.tabGroup && this.tabGroup.handleInput(pos)) {
            soundManager.playSE('TAP');
            return true;
        }

        switch (this.tabGroup.selectedIndex) {
            case 0: // 設定
                for (const item of this.effectBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        AppConfig.EFFECT_LEVEL = item.level;
                        saveConfig();
                        return true;
                    }
                }
                for (const item of this.visualizerBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        AppConfig.VISUALIZER_MODE = item.mode;
                        saveConfig();
                        return true;
                    }
                }
                for (const item of this.gemStyleBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GRAPHICS_CONFIG.GEM_STYLE = item.value;
                        SpriteCacheManager.generateAllCaches();
                        saveConfig();
                        return true;
                    }
                }
                for (const item of this.gemOutlineBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GRAPHICS_CONFIG.GEM_OUTLINE = item.value;
                        SpriteCacheManager.generateAllCaches();
                        saveConfig();
                        return true;
                    }
                }
                if (this.toggleSymbol && this.toggleSymbol.contains(pos.x, pos.y)) {
                    soundManager.playSE('TAP');
                    this.toggleSymbol.toggle();
                    GRAPHICS_CONFIG.SHOW_SYMBOL = this.toggleSymbol.isOn;
                    SpriteCacheManager.generateAllCaches();
                    saveConfig();
                    return true;
                }
                if (this.toggleAudio && this.toggleAudio.contains(pos.x, pos.y)) {
                    soundManager.playSE('TAP');
                    this.toggleAudio.toggle();
                    AppConfig.AUDIO_ENABLED = this.toggleAudio.isOn;
                    soundManager.updateMuteState();
                    saveConfig();
                    return true;
                }
                if (this.toggleMathPopup && this.toggleMathPopup.contains(pos.x, pos.y)) {
                    soundManager.playSE('TAP');
                    this.toggleMathPopup.toggle();
                    AppConfig.SHOW_MATH_POPUP = this.toggleMathPopup.isOn;
                    saveConfig();
                    return true;
                }
                if (this.toggleResultAnim && this.toggleResultAnim.contains(pos.x, pos.y)) {
                    soundManager.playSE('TAP');
                    this.toggleResultAnim.toggle();
                    AppConfig.RESULT_ANIMATION = this.toggleResultAnim.isOn;
                    saveConfig();
                    return true;
                }

                break;
            case 1: // 更新履歴
                break;
            case 2: // 著作権
                break;
            case 3: // DEBUG
                if (this.toggleDebug && this.toggleDebug.contains(pos.x, pos.y)) {
                    soundManager.playSE('TAP');
                    this.toggleDebug.toggle();
                    AppConfig.DEBUG_MODE = this.toggleDebug.isOn;
                    return true;
                }
                for (const item of this.bfsBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.bfsMultiplier = item.value;
                        return true;
                    }
                }
                for (const item of this.scoreBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.scoreMultiplier = item.value;
                        return true;
                    }
                }
                for (const item of this.lifeDecayBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.lifeDecayMultiplier = item.value;
                        return true;
                    }
                }
                for (const item of this.expBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.expMultiplier = item.value;
                        return true;
                    }
                }
                for (const item of this.speedBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.timeScale = item.value;

                        // PlaySceneの scaledDelta を通じて全体に適用されるため、Matter.jsへの直接代入は廃止
                        // if (GameState.currentScene === 'PUZZLE' && GameState.engine && !GameState.isPuzzlePaused) {
                        //     GameState.engine.timing.timeScale = GameState.debug.timeScale;
                        // }
                        return true;
                    }
                }
                for (const item of this.wireframeBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        GameState.debug.showWireframe = item.value;
                        return true;
                    }
                }
                for (const item of this.shiftDecayBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        AppConfig.SHIFT_DECAY_MULT = item.value;
                        saveConfig();
                        return true;
                    }
                }
                for (const item of this.shiftGaugeBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        PhaseManager.phaseGauge = item.value;
                        return true;
                    }
                }
                for (const item of this.reverseGaugeBtns) {
                    if (item.btn.contains(pos.x, pos.y)) {
                        soundManager.playSE('TAP');
                        PhaseManager.breakGauge = item.value;
                        return true;
                    }
                }
                break;
        }

        return true;
    }

    destroy() {
        super.destroy();

        if (GameState.currentScene === 'PUZZLE') {
            GameState.isPuzzlePaused = false;
            GameState.isSystemPaused = false;
            effects.toggleStasisEffect(false);
            GameState.disableStasisFilter = true;
            soundManager.setStasisFilter(false);
            setTimeout(() => { GameState.disableStasisFilter = false; }, 500);

            PhaseManager.checkPhaseTransition();
        }
    }
}
