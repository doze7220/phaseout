// BootScene.js
import { BaseScene } from './BaseScene.js';
import { GameState } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UI } from '../render/UIComponents.js';
import { soundManager } from '../render/SoundManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { TitleScene } from './TitleScene.js';

export class BootScene extends BaseScene {
    constructor() {
        super();
        this.tapArea = null;
        this.messages = [
            '> INITIALIZING ASTRAEA SYSTEM...',
            '> CHECKING PHYSICAL FRAGMENTS... OK.',
            '> AWAITING OBSERVER "GAZER" INPUT.',
            '',
            '  PLEASE TOUCH SCREEN'
        ];
        this.charIndex = 0;
        this.timer = 0;
        this.isGlitching = false;
        this.glitchTimer = 0;
    }

    init() {
        super.init();
        GameState.currentScene = 'BOOT';
        this.tapArea = new UI.FullScreenTap();
    }

    update(deltaTime) {
        if (!this.isActive) return;

        if (this.isGlitching) {
            this.glitchTimer += deltaTime;
            if (this.glitchTimer >= 150) {
                SceneManager.changeScene(new TitleScene(), false);
            }
            return;
        }

        this.timer += deltaTime;
        const currentText = this.messages.join('\n');
        if (this.charIndex < currentText.length) {
            const char = currentText[this.charIndex];
            const waitTime = (char === '.') ? 150 : 30;
            if (this.timer > waitTime) {
                this.charIndex++;
                this.timer = 0;
            }
        }
    }

    draw(ctx, layerId) {
        if (layerId !== 9) return; // MODAL_UI layer

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        let offsetX = 0;
        if (this.isGlitching) {
            offsetX = (Math.random() - 0.5) * 8;
        }

        const startX = width * 0.1 + offsetX;
        const startY = height * 0.4;
        
        const currentText = this.messages.join('\n');
        const textToDraw = currentText.substring(0, this.charIndex);
        const lines = textToDraw.split('\n');
        
        const drawLines = (color, xShift) => {
            ctx.fillStyle = color;
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], startX + xShift, startY + i * 24);
            }
        };

        if (this.isGlitching) {
            ctx.globalCompositeOperation = 'multiply';
            drawLines('rgba(255,0,0,0.8)', -3);
            drawLines('rgba(0,255,255,0.8)', 3);
            ctx.globalCompositeOperation = 'source-over';
            drawLines('#000', 0);
        } else {
            drawLines('#000', 0);
        }

        if (this.tapArea) {
            this.tapArea.updateAndDraw(ctx);
        }
    }

    handleInput(pos, e) {
        if (this.tapArea && this.tapArea.contains(pos.x, pos.y) && !this.isGlitching) {
            soundManager.resumeContext();
            soundManager.playSE('DECIDE');
            this.isGlitching = true;
            this.glitchTimer = 0;
            return true;
        }
        return false;
    }
}
