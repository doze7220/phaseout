// ConfigScene.js
import { BaseScene } from './BaseScene.js';
import { LAYOUT_CONFIG } from '../core/config.js';
import { UI } from '../render/UIComponents.js';
import { SceneManager } from '../core/SceneManager.js';

export class ConfigScene extends BaseScene {
    constructor() {
        super();
        this.window = null;
        this.btnClose = null;
    }

    init() {
        super.init();
        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;
        const winWidth = 600;
        const winHeight = 800;
        const startX = width / 2 - winWidth / 2;
        const startY = height / 2 - winHeight / 2;

        this.window = new UI.Window(startX, startY, winWidth, winHeight, "CONFIG", { isModal: true });
        this.btnClose = new UI.TextButton(startX + winWidth / 2 - 100, startY + winHeight - 80, 200, 50, "CLOSE");
    }

    update(deltaTime) {
        if (!this.isActive) return;
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return;

        if (this.window) this.window.updateAndDraw(ctx);
        if (this.btnClose) this.btnClose.updateAndDraw(ctx);
    }

    handleInput(pos, e) {
        if (this.btnClose && this.btnClose.contains(pos.x, pos.y)) {
            SceneManager.popScene();
            return true;
        }
        return true; // Modal blocks all touches behind it
    }
}
