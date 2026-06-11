// BootScene.js
import { BaseScene } from './BaseScene.js';
import { GameState, LAYOUT_CONFIG } from '../core/config.js';
import { UI } from '../render/UIComponents.js';
import { soundManager } from '../render/SoundManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { TitleScene } from './TitleScene.js';

export class BootScene extends BaseScene {
    constructor() {
        super();
        this.tapArea = null;
    }

    init() {
        super.init();
        GameState.currentScene = 'BOOT';
        this.tapArea = new UI.FullScreenTap();
    }

    update(deltaTime) {
        if (!this.isActive) return;
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return; // MODAL_UI layer

        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const now = performance.now();
        const dots = '.'.repeat(Math.floor(now / 300) % 4);
        ctx.fillText(`Initializing${dots}`, width / 2, height / 2 - 40);

        // "TAP TO START" blink
        const blink = Math.floor(now / 800) % 2 === 0 ? 1 : 0.2;
        ctx.globalAlpha = blink;
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('TAP TO START', width / 2, height * 0.75);
        ctx.globalAlpha = 1;

        if (this.tapArea) {
            this.tapArea.updateAndDraw(ctx);
        }
    }

    handleInput(pos, e) {
        if (this.tapArea && this.tapArea.contains(pos.x, pos.y)) {
            soundManager.resumeContext();
            soundManager.playSceneBGM('TITLE');
            soundManager.playSE('DECIDE');
            SceneManager.changeScene(new TitleScene());
            return true;
        }
        return false;
    }
}
