// FooterUIManager.js
import { AppConfig, GameState } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';

export class FooterUIManager {
    constructor() {
        this.time = 0;
    }

    /**
     * フッターUIの更新と描画
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} gameState 
     */
    updateAndDraw(ctx, gameState) {
        // UIアニメーション用の時間を進める
        this.time += 0.05;

        const config = LAYOUT_CONFIG.FOOTER_UI;
        // 起点Y座標はCanvas下端からFOOTER_HEIGHTを引いた位置
        const baseY = LAYOUT_CONFIG.BASE.HEIGHT - LAYOUT_CONFIG.BASE.FOOTER_HEIGHT;
        
        const startX = config.PADDING;
        const startY = baseY + config.PADDING;
        const totalWidth = LAYOUT_CONFIG.BASE.WIDTH - config.PADDING * 2;
        const totalHeight = LAYOUT_CONFIG.BASE.FOOTER_HEIGHT - config.PADDING * 2;
        
        const panelCount = config.PANEL_COUNT;
        const panelWidth = (totalWidth - config.GAP * (panelCount - 1)) / panelCount;

        ctx.save();
        
        // パネルを3分割して描画
        for (let i = 0; i < panelCount; i++) {
            const x = startX + i * (panelWidth + config.GAP);
            this.drawPanel(ctx, x, startY, panelWidth, totalHeight, i);
        }

        ctx.restore();
    }

    /**
     * 各パネルの描画（NO SIGNAL表示）
     */
    drawPanel(ctx, x, y, width, height, index) {
        const config = LAYOUT_CONFIG.FOOTER_UI;
        const effectLevel = AppConfig.EFFECT_LEVEL;

        ctx.save();

        // 描画領域をクリッピング（グリッチ等のはみ出し防止）
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        // 1. 背景の描画
        ctx.fillStyle = config.BG_COLOR;
        ctx.fillRect(x, y, width, height);

        // EFFECT_LEVELごとのパラメータ設定
        let alpha = 1.0;
        let isGlitch = false;
        let glitchOffsetX = 0;
        let glitchOffsetY = 0;

        if (effectLevel === 'FULL') {
            // ランダム明滅
            alpha = 0.8 + Math.random() * 0.2;
            // 低確率でグリッチ発生
            if (Math.random() < config.GLITCH_PROBABILITY) {
                isGlitch = true;
                glitchOffsetX = (Math.random() - 0.5) * 10;
                glitchOffsetY = (Math.random() - 0.5) * 5;
            }
        } else if (effectLevel === 'LITE') {
            // 明滅のみ（乱数計算は最小限）
            alpha = 0.9 + Math.random() * 0.1;
        } else {
            // NONE設定時は静止画として描画（乱数不使用）
            alpha = 1.0;
        }

        ctx.globalAlpha = alpha;

        // 2. テキストの描画 (NO SIGNAL)
        ctx.font = config.FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = x + width / 2;
        const textY = y + height / 2;

        if (isGlitch) {
            // 色収差(RGBズレ)エフェクト
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillText(config.TEXT, textX + glitchOffsetX + 2, textY + glitchOffsetY);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.fillText(config.TEXT, textX + glitchOffsetX - 2, textY + glitchOffsetY);
            ctx.globalCompositeOperation = 'source-over'; // 元に戻す
        } else {
            // 通常描画
            ctx.fillStyle = config.TEXT_COLOR;
            ctx.fillText(config.TEXT, textX, textY);
        }

        // 3. 走査線（スキャンライン）の描画
        if (effectLevel === 'FULL') {
            // 動く太い走査線
            const scanY = (this.time * config.SCANLINE_SPEED * 100) % height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, y + scanY, width, config.SCANLINE_HEIGHT);
            
            // パネル全体への細かい走査線オーバーレイ
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let sy = 0; sy < height; sy += 4) {
                ctx.fillRect(x, y + sy, width, 1);
            }
        }

        // 4. パネル枠線の描画
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.restore();
    }
}
