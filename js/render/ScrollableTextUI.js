import { UIManager } from '../core/UIManager.js';

export class ScrollableTextUI {
    /**
     * @param {string} idPrefix - UIManagerのボタンID用プレフィックス (例: 'configScroll', 'resultScroll')
     */
    constructor(idPrefix) {
        this.idPrefix = idPrefix;
        this.scrollOffsetY = 0;
        this.maxScrollOffsetY = 0;
    }

    /**
     * スクロールUIを描画し、UIManagerへのタップ領域登録を行う。
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     * @param {number} x - 領域のX座標
     * @param {number} y - 領域のY座標
     * @param {number} width - 領域の幅
     * @param {number} height - 領域の高さ
     * @param {Array} items - 描画するアイテムの配列 (文字列やオブジェクト)
     * @param {Object} options - オプション (lineHeight, layer, renderItemCallback)
     */
    updateAndDraw(ctx, x, y, width, height, items, options = {}) {
        const lineHeight = options.lineHeight || 24;
        const layer = options.layer || 9;
        
        // デフォルトの行描画関数 (引数として renderItemCallback が渡されなければただのテキスト描画)
        const renderItem = options.renderItemCallback || ((ctx, item, x, y, index) => {
            ctx.fillStyle = '#ddd';
            ctx.font = '20px monospace';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';
            ctx.fillText(item.toString(), x + 10, y);
        });

        const totalContentHeight = items.length * lineHeight;
        this.maxScrollOffsetY = Math.max(0, totalContentHeight - height);
        
        // オフセットのクランプ
        this.scrollOffsetY = Math.max(0, Math.min(this.scrollOffsetY, this.maxScrollOffsetY));

        // クリッピングとコンテンツ描画
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();

        for (let i = 0; i < items.length; i++) {
            const lineY = y + 10 + (i * lineHeight) - this.scrollOffsetY;
            
            // 画面外のカリング (少し余裕を持たせる)
            if (lineY > y + height || lineY + lineHeight < y) continue;
            
            // カスタムコールバックで1行を描画
            renderItem(ctx, items[i], x, lineY, i);
        }
        ctx.restore();

        // 擬似スクロールUI (上下判定ボタン)
        const scrollBtnHeight = Math.min(80, height / 2);
        
        // 上半分 (▲)
        if (this.scrollOffsetY > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, y, width, scrollBtnHeight);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '24px sans-serif';
            ctx.fillText('▲', x + width / 2, y + scrollBtnHeight / 2);
        }
        UIManager.updateButtonRect(this.idPrefix + 'Up', layer, x, y, width, scrollBtnHeight);
        UIManager.setButtonCallback(this.idPrefix + 'Up', () => {
            this.scrollOffsetY -= height * 0.5; // 半ページスクロール
        });

        // 下半分 (▼)
        if (this.scrollOffsetY < this.maxScrollOffsetY) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, y + height - scrollBtnHeight, width, scrollBtnHeight);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '24px sans-serif';
            ctx.fillText('▼', x + width / 2, y + height - scrollBtnHeight / 2);
        }
        UIManager.updateButtonRect(this.idPrefix + 'Down', layer, x, y + height - scrollBtnHeight, width, scrollBtnHeight);
        UIManager.setButtonCallback(this.idPrefix + 'Down', () => {
            this.scrollOffsetY += height * 0.5; // 半ページスクロール
        });
    }

    /**
     * スクロール位置を一番上へリセットする
     */
    resetScroll() {
        this.scrollOffsetY = 0;
    }
}
