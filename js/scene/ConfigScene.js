// ConfigScene.js
import { BaseScene } from './BaseScene.js';
import { GameState, AppConfig, LAYOUT_CONFIG } from '../core/config.js';
import { UI } from '../render/UIComponents.js';
import { SceneManager } from '../core/SceneManager.js';
import { soundManager } from '../render/SoundManager.js';
import * as effects from '../render/effects.js';
import { changelog } from '../../changelog.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';

export class ConfigScene extends BaseScene {
    constructor() {
        super();
        this.window = null;
        this.btnClose = null;
        this.toggleDebug = null;
        this.effectBtns = [];
        this.changelogScrollUI = null;
        this.changelogLines = [];
        this.lineHeight = 24;

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

        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;
        const winWidth = 600;
        const winHeight = 900;
        const startX = width / 2 - winWidth / 2;
        const startY = height / 2 - winHeight / 2;

        this.window = new UI.Window(startX, startY, winWidth, winHeight, "Config", { isModal: true });
        
        // 右上のXボタン
        const closeBtnSize = 60;
        const closeBtnX = startX + winWidth - closeBtnSize - 20;
        const closeBtnY = startY + 10;
        this.btnClose = new UI.ImageButton(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, this.closeImage);

        // デバッグモード切替トグル
        const debugToggleX = startX + winWidth - 120;
        const debugToggleY = startY + 130;
        this.toggleDebug = new UI.ToggleSwitch(debugToggleX, debugToggleY, 80, 40, AppConfig.DEBUG_MODE);

        // エフェクト設定ボタン
        const effectLevels = ['FULL', 'LITE', 'NONE'];
        const effectBtnWidth = 120;
        const effectBtnHeight = 50;
        const effectBtnStartX = startX + 40;
        const effectBtnY = startY + 280;

        this.effectBtns = effectLevels.map((level, index) => {
            const btnX = effectBtnStartX + index * (effectBtnWidth + 20);
            return {
                level: level,
                btn: new UI.TextButton(btnX, effectBtnY, effectBtnWidth, effectBtnHeight, level, { radius: effectBtnHeight / 2 })
            };
        });

        // ChangeLog スクロールエリア
        this.changelogScrollUI = new UI.ScrollArea('configScroll');
        this.logAreaX = startX + 40;
        this.logAreaY = startY + 410;
        this.logAreaWidth = winWidth - 80;
        this.logAreaHeight = winHeight - 450;
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
        ctx.font = '24px sans-serif';
        ctx.fillText('デバッグモード', winX + 45, winY + 150);
        
        if (this.toggleDebug) this.toggleDebug.updateAndDraw(ctx);

        // エフェクト設定テキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '24px sans-serif';
        ctx.fillText('エフェクト設定', winX + 45, winY + 250);

        for (const item of this.effectBtns) {
            item.btn.isActive = (AppConfig.EFFECT_LEVEL === item.level);
            item.btn.updateAndDraw(ctx);
        }

        // ChangeLogテキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '24px sans-serif';
        ctx.fillText('更新履歴', winX + 45, winY + 390);

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
        // scrollUIの上/下ボタン判定 (UI.ScrollAreaは内部でUIManagerを使っているため、手動でスクロールボタンのロジックを書くか、
        // 既存のScrollAreaを使っているなら UIManager 経由で発火するか。
        // ※今回は UIManager が有効なままになるので ScrollArea のボタンはUIManager経由で発動する)

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

        // エフェクト設定ボタン
        for (const item of this.effectBtns) {
            if (item.btn.contains(pos.x, pos.y)) {
                soundManager.playSE('TAP');
                AppConfig.EFFECT_LEVEL = item.level;
                if (typeof window !== 'undefined') localStorage.setItem('phaseout_effect_level', item.level);
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
