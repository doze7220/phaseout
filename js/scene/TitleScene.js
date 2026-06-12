// TitleScene.js
import { BaseScene } from './BaseScene.js';
import { GameState } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UI } from '../render/UIComponents.js';
import { soundManager } from '../render/SoundManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { PlayScene } from './PlayScene.js';
import { ConfigScene } from './ConfigScene.js';
import { initTitleAnimation, updateTitleAnimation, drawTitleAnimation, stopTitleAnimation } from '../render/title-animation.js';
import { changelog } from '../../changelog.js';

export class TitleScene extends BaseScene {
    constructor() {
        super();
        this.fullScreenTap = null;
        this.btnConfig = null;
        this.time = 0;
        
        this.configBtnImage = new Image();
        this.configBtnImage.src = './assets/img/ui/btn_config.png';
    }

    init() {
        super.init();
        GameState.currentScene = 'TITLE';
        initTitleAnimation();
        this.time = 0;

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;

        this.fullScreenTap = new UI.FullScreenTap({ fillStyle: 'transparent' });
        
        // CONFIG button (top right)
        this.btnConfig = new UI.ImageButton(
            width - LAYOUT_CONFIG.BUTTON.CONFIG_RIGHT, 
            LAYOUT_CONFIG.BUTTON.CONFIG_TOP, 
            LAYOUT_CONFIG.BUTTON.CONFIG_SIZE, 
            LAYOUT_CONFIG.BUTTON.CONFIG_SIZE, 
            this.configBtnImage
        );
    }

    update(deltaTime) {
        if (!this.isActive) return;
        this.time += deltaTime;
        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;
        updateTitleAnimation(deltaTime, width, height);
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return; // MODAL_UI layer

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        drawTitleAnimation(ctx, width, height);

        const conf = LAYOUT_CONFIG.TITLE_SCENE;
        // Title Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = LAYOUT_CONFIG.TEXT.TITLE_MAIN_FONT;
        ctx.shadowColor = conf.SHADOW_COLOR;
        ctx.shadowBlur = conf.SHADOW_BLUR;
        ctx.shadowOffsetX = conf.SHADOW_OFFSET_X;
        ctx.shadowOffsetY = conf.SHADOW_OFFSET_Y;
        ctx.fillText('PHASE OUT', width / 2, height * LAYOUT_CONFIG.TEXT.TITLE_MAIN_Y_RATIO);
        
        ctx.fillText('∴', width / 2, height * LAYOUT_CONFIG.TEXT.TITLE_SYMBOL_Y_RATIO);

        ctx.font = LAYOUT_CONFIG.TEXT.TITLE_SUB_FONT;
        ctx.fillText('Cluster Stirring', width / 2, height * LAYOUT_CONFIG.TEXT.TITLE_SUB_Y_RATIO);
        ctx.shadowColor = 'transparent';

        // Version Text
        ctx.font = conf.VERSION_FONT;
        ctx.fillStyle = conf.VERSION_COLOR;
        ctx.textBaseline = 'bottom';
        // Display latest version from changelog
        const latestVer = changelog[0].version;
        ctx.fillText(`Ver ${latestVer}`, width / 2, height - conf.VERSION_Y_OFFSET);

        if (this.fullScreenTap) this.fullScreenTap.updateAndDraw(ctx);

        // TAP TO START (明滅)
        const alpha = Math.abs(Math.sin(this.time / 800));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 32px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('TAP TO START', width / 2, height * LAYOUT_CONFIG.TITLE_SCENE.START_BTN_Y_RATIO);

        if (this.btnConfig) this.btnConfig.updateAndDraw(ctx);
    }

    handleInput(pos, e) {
        if (this.btnConfig && this.btnConfig.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            SceneManager.pushScene(new ConfigScene());
            return true;
        }

        if (this.fullScreenTap && this.fullScreenTap.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            GameState.currentScene = 'PUZZLE';
            GameState.reset();
            SceneManager.changeScene(new PlayScene());
            return true;
        }

        return false;
    }

    destroy() {
        super.destroy();
        stopTitleAnimation();
    }
}
