// FooterUIManager.js
import { AppConfig, GameState, THEME_COLORS } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { CharacterPuzzleManager } from '../core/CharacterPuzzleManager.js';
import { AssetManager } from './SpriteCacheManager.js';

let debugLogDone = false;

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
        if (!debugLogDone) {
            const slotData = CharacterPuzzleManager.getSlotData(0);
            console.log("[Footer] 初回フレーム - Slot 0 Data:", slotData);
            if (slotData) {
                // AssetManager.images に実画像がロードされてキャッシュされているか確認
                const img = AssetManager.images[slotData.id];
                console.log(`[Footer] 画像ロード状態 (${slotData.id}):`, !!img, img);
            }
            debugLogDone = true;
        }

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

        // パネル描画順: 左から2人目, 1人目, 3人目 (インデックス: 1, 0, 2)
        const slotMapping = [1, 0, 2];

        ctx.save();
        
        // パネルを3分割して描画
        for (let i = 0; i < panelCount; i++) {
            const x = startX + i * (panelWidth + config.GAP);
            const slotIndex = slotMapping[i];
            this.drawPanel(ctx, x, startY, panelWidth, totalHeight, i, slotIndex);
        }

        ctx.restore();
    }

    /**
     * 各パネルの描画（キャラクター情報 or NO SIGNAL表示）
     */
    drawPanel(ctx, x, y, width, height, index, slotIndex) {
        const config = LAYOUT_CONFIG.FOOTER_UI;
        const effectLevel = AppConfig.EFFECT_LEVEL;
        const slotData = CharacterPuzzleManager.getSlotData(slotIndex);

        ctx.save();

        // 1. 背景とクリッピングが必要な要素の描画
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        ctx.fillStyle = config.BG_COLOR;
        ctx.fillRect(x, y, width, height);

        if (!slotData) {
            // --- slotData が null の場合 (NO SIGNAL) ---
            let alpha = 1.0;
            let isGlitch = false;
            let glitchOffsetX = 0;
            let glitchOffsetY = 0;

            if (effectLevel === 'FULL') {
                alpha = 0.8 + Math.random() * 0.2;
                if (Math.random() < config.GLITCH_PROBABILITY) {
                    isGlitch = true;
                    glitchOffsetX = (Math.random() - 0.5) * 10;
                    glitchOffsetY = (Math.random() - 0.5) * 5;
                }
            } else if (effectLevel === 'LITE') {
                alpha = 0.9 + Math.random() * 0.1;
            }

            ctx.globalAlpha = alpha;

            // テキストの描画 (NO SIGNAL)
            ctx.font = config.FONT;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textX = x + width / 2;
            const textY = y + height / 2;

            if (isGlitch) {
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.fillText(config.TEXT, textX + glitchOffsetX + 2, textY + glitchOffsetY);
                ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.fillText(config.TEXT, textX + glitchOffsetX - 2, textY + glitchOffsetY);
                ctx.globalCompositeOperation = 'source-over';
            } else {
                ctx.fillStyle = config.TEXT_COLOR;
                ctx.fillText(config.TEXT, textX, textY);
            }

            // 走査線の描画
            if (effectLevel === 'FULL') {
                const scanY = (this.time * config.SCANLINE_SPEED * 100) % height;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x, y + scanY, width, config.SCANLINE_HEIGHT);
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let sy = 0; sy < height; sy += 4) {
                    ctx.fillRect(x, y + sy, width, 1);
                }
            }
        }
        
        ctx.restore(); // クリッピング解除

        // パネル枠線の描画 (常に描画)
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // --- キャラクター情報の描画 (はみ出し許可のためクリップ外) ---
        if (slotData) {
            ctx.save();
            
            // パネルの横幅（左右）だけクリッピングし、上方向へのフリーなはみ出しを許可する
            ctx.beginPath();
            ctx.rect(x, y - 2000, width, height + 4000);
            ctx.clip();

            // 画像の描画 (パネル左下基準)
            const img = AssetManager.images[slotData.id];
            if (img) {
                const imgX = x + config.CHAR_IMAGE_OFFSET_X;
                const imgY = (y + height) - config.CHAR_IMAGE_DRAW_SIZE - config.CHAR_IMAGE_OFFSET_Y;
                ctx.drawImage(img, imgX, imgY, config.CHAR_IMAGE_DRAW_SIZE, config.CHAR_IMAGE_DRAW_SIZE);
            }

            ctx.restore();

            const textX = x + config.CHAR_TEXT_OFFSET_X;
            const themeColor = THEME_COLORS[slotData.colorId] || THEME_COLORS.CYAN;

            // キャラクター名の描画
            ctx.font = config.CHAR_NAME_FONT;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = config.CHAR_NAME_COLOR;
            ctx.fillText(slotData.name, textX, y + config.CHAR_NAME_OFFSET_Y);

            // スキル名の描画
            ctx.font = config.SKILL_NAME_FONT;
            ctx.fillStyle = themeColor;
            ctx.fillText(slotData.skillName, textX, y + config.SKILL_NAME_OFFSET_Y);

            // ゲージの描画
            const gaugeX = textX;
            const gaugeY = y + config.GAUGE_OFFSET_Y;
            
            ctx.fillStyle = config.GAUGE_BG_COLOR;
            ctx.fillRect(gaugeX, gaugeY, config.GAUGE_WIDTH, config.GAUGE_HEIGHT);

            const ratio = Math.max(0, Math.min(1, slotData.currentCharge / slotData.maxCharge));
            const currentWidth = config.GAUGE_WIDTH * ratio;
            ctx.fillStyle = themeColor;
            ctx.fillRect(gaugeX, gaugeY, currentWidth, config.GAUGE_HEIGHT);
        }

        ctx.restore();
    }
}
