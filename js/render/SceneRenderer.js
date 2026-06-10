// SceneRenderer.js
import { GameState, LAYOUT_CONFIG } from '../core/config.js';
import { UIManager } from '../core/UIManager.js';
import { soundManager } from './SoundManager.js';
import { drawTitleAnimation, updateTitleAnimation } from './title-animation.js';

class SceneRendererClass {
    constructor() {
        this.titleStartTime = 0;
        this.logoImage = null; // 必要であれば画像読み込み
    }

    draw(ctx) {
        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;

        if (GameState.currentScene === 'BOOT') {
            this.drawBoot(ctx, width, height);
            UIManager.deactivateButton('titleStart');
        } else if (GameState.currentScene === 'TITLE') {
            if (this.titleStartTime === 0) {
                this.titleStartTime = performance.now();
            }
            this.drawTitle(ctx, width, height);
        } else {
            this.titleStartTime = 0;
            UIManager.deactivateButton('titleStart');
        }
    }

    drawBoot(ctx, width, height) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const now = performance.now();
        const dots = '.'.repeat(Math.floor(now / 300) % 4);
        ctx.fillText(`Initializing${dots}`, width / 2, height / 2);
    }

    drawTitle(ctx, width, height) {
        const now = performance.now();
        if (this.lastTime === 0) this.lastTime = now;
        const deltaTime = Math.min(now - this.lastTime, 50);
        this.lastTime = now;

        // 背景やアニメーション
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (typeof updateTitleAnimation === 'function') {
            updateTitleAnimation(deltaTime, width, height);
        }

        // title-animation.js に統合したアニメーション描画を呼び出す
        if (typeof drawTitleAnimation === 'function') {
            drawTitleAnimation(ctx, width, height);
        }

        // タイトルテキスト
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = 'bold 80px sans-serif';
        // シャドウ
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText('PHASE OUT', width / 2, height * 0.4);
        
        ctx.font = '30px sans-serif';
        ctx.fillText('∴ Cluster Stirring', width / 2, height * 0.48);
        
        ctx.shadowColor = 'transparent'; // リセット

        // "TAP START" 点滅表示
        const elapsed = now - this.titleStartTime;
        const blink = Math.floor(elapsed / 800) % 2 === 0 ? 1 : 0.2;
        
        ctx.globalAlpha = blink;
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('TAP START', width / 2, height * 0.75);
        ctx.globalAlpha = 1;

        // タイトル画面全体をタップボタンとして登録
        UIManager.updateButtonRect('titleStart', 9, 0, 0, width, height);
        UIManager.setButtonCallback('titleStart', () => {
            soundManager.playSE('TAP'); // 必要に応じてゲームスタート音
            // PUZZLEシーンへ遷移
            GameState.currentScene = 'PUZZLE';
            GameState.reset();
            window.dispatchEvent(new Event('startGame'));
        });
    }
}

export const SceneRenderer = new SceneRendererClass();
