// TitleScene.js
import { BaseScene } from './BaseScene.js';
import { GameState, LAYOUT_CONFIG } from '../core/config.js';
import { UI } from '../render/UIComponents.js';
import { soundManager } from '../render/SoundManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { PlayScene } from './PlayScene.js';
import { ConfigScene } from './ConfigScene.js';
import { initTitleAnimation, updateTitleAnimation, drawTitleAnimation, stopTitleAnimation } from '../render/title-animation.js';

export class TitleScene extends BaseScene {
    constructor() {
        super();
        this.btnStart = null;
        this.btnConfig = null;
        
        this.configBtnImage = new Image();
        this.configBtnImage.src = './assets/img/ui/btn_config.png';
    }

    init() {
        super.init();
        GameState.currentScene = 'TITLE';
        initTitleAnimation();

        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;
        const btnWidth = 240;
        const btnHeight = 60;
        const startX = width / 2 - btnWidth / 2;
        const startY = height * 0.7;

        this.btnStart = new UI.TextButton(startX, startY, btnWidth, btnHeight, "START");
        
        // CONFIG button (top right)
        this.btnConfig = new UI.ImageButton(width - 70, 20, 50, 50, this.configBtnImage);
    }

    update(deltaTime) {
        if (!this.isActive) return;
        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;
        updateTitleAnimation(deltaTime, width, height);
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return; // MODAL_UI layer

        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        drawTitleAnimation(ctx, width, height);

        // Title Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = 'bold 80px sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText('PHASE OUT', width / 2, height * 0.4);
        
        ctx.font = '30px sans-serif';
        ctx.fillText('∴ Cluster Stirring', width / 2, height * 0.48);
        ctx.shadowColor = 'transparent';

        if (this.btnStart) this.btnStart.updateAndDraw(ctx);
        if (this.btnConfig) this.btnConfig.updateAndDraw(ctx);
    }

    handleInput(pos, e) {
        if (this.btnStart && this.btnStart.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            GameState.currentScene = 'PUZZLE';
            GameState.reset();
            SceneManager.changeScene(new PlayScene());
            return true;
        }

        if (this.btnConfig && this.btnConfig.contains(pos.x, pos.y)) {
            soundManager.playSE('TAP');
            SceneManager.pushScene(new ConfigScene());
            return true;
        }
        return false;
    }

    destroy() {
        super.destroy();
        stopTitleAnimation();
    }
}
