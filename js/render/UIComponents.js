import { UIManager } from '../core/UIManager.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
// 注: AssetManagerなどは必要に応じて後でimportする前提

class BaseControl {
    constructor(x, y, width, height, options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.options = options;
        this.isHovered = false;
        this.isPressed = false;
    }

    contains(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    updateAndDraw(ctx) {
        // サブクラスでオーバーライド
    }
}

class TextButton extends BaseControl {
    constructor(x, y, width, height, text, options = {}) {
        super(x, y, width, height, options);
        this.text = text;
        this.isActive = options.isActive || false;
    }

    updateAndDraw(ctx) {
        const radius = this.options.radius || LAYOUT_CONFIG.BUTTON.RADIUS;
        
        // 背景
        if (this.isActive) {
            ctx.fillStyle = '#4caf50'; // トグルボタンと同じ緑
        } else {
            ctx.fillStyle = this.isPressed ? '#555' : (this.isHovered ? '#777' : '#333');
        }
        
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, radius);
        ctx.fill();
        
        // 枠線
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // テキスト
        ctx.fillStyle = '#fff';
        ctx.font = this.options.font || LAYOUT_CONFIG.BUTTON.FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    }
}

class ImageButton extends BaseControl {
    constructor(x, y, width, height, image, options = {}) {
        super(x, y, width, height, options);
        this.image = image;
    }

    updateAndDraw(ctx) {
        if (this.isPressed) {
            ctx.filter = 'brightness(0.7)';
        } else if (this.isHovered) {
            ctx.filter = 'brightness(1.2)';
        } else {
            ctx.filter = 'none';
        }
        
        if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 代替描画
            ctx.fillStyle = '#f0f';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.filter = 'none';
    }
}

class ToggleSwitch extends BaseControl {
    constructor(x, y, width, height, isOn, options = {}) {
        super(x, y, width, height, options);
        this.isOn = isOn;
    }

    toggle() {
        this.isOn = !this.isOn;
    }

    updateAndDraw(ctx) {
        const radius = this.height / 2;
        
        // 背景 (丸角)
        ctx.fillStyle = this.isOn ? '#4caf50' : '#777';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, radius);
        ctx.fill();
        
        // 枠線
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // ノブ (丸)
        const padding = 4;
        const knobRadius = radius - padding;
        const knobX = this.isOn ? this.x + this.width - radius : this.x + radius;
        const knobY = this.y + radius;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // テキスト (ON/OFF)
        ctx.fillStyle = '#fff';
        ctx.font = this.options.font || 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.isOn) {
            ctx.fillText('ON', this.x + radius, this.y + radius);
        } else {
            ctx.fillText('OFF', this.x + this.width - radius, this.y + radius);
        }
    }
}

class Window extends BaseControl {
    constructor(x, y, width, height, title, options = {}) {
        super(x, y, width, height, options);
        this.title = title;
        this.isModal = options.isModal || false;
    }

    updateAndDraw(ctx) {
        // モーダルの場合の暗幕レイヤー
        if (this.isModal) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // ウィンドウ背景
        ctx.fillStyle = 'rgba(20, 20, 20, 0.95)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 枠線
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // タイトルバー
        const titleHeight = LAYOUT_CONFIG.MODAL.TITLE_HEIGHT;
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x, this.y, this.width, titleHeight);
        ctx.fillStyle = '#fff';
        ctx.font = LAYOUT_CONFIG.MODAL.FONT_TITLE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.title, this.x + this.width / 2, this.y + titleHeight / 2);
    }
}

class FullScreenTap extends BaseControl {
    constructor(options = {}) {
        // サイズは描画時にCanvasサイズから決まる想定
        super(0, 0, 0, 0, options);
    }

    updateAndDraw(ctx) {
        this.width = ctx.canvas.width;
        this.height = ctx.canvas.height;
        
        if (this.options.fillStyle) {
            ctx.fillStyle = this.options.fillStyle;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

class ScrollArea {
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
        const lineHeight = options.lineHeight || LAYOUT_CONFIG.CONFIG_SCENE.LOG_LINE_HEIGHT;
        const layer = options.layer || 9;
        
        // デフォルトの行描画関数
        const renderItem = options.renderItemCallback || ((ctx, item, x, y, index) => {
            ctx.fillStyle = '#ddd';
            ctx.font = LAYOUT_CONFIG.TEXT.SCROLL_FONT;
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
            ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
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
            ctx.font = LAYOUT_CONFIG.TEXT.DEFAULT_FONT;
            ctx.fillText('▼', x + width / 2, y + height - scrollBtnHeight / 2);
        }
        UIManager.updateButtonRect(this.idPrefix + 'Down', layer, x, y + height - scrollBtnHeight, width, scrollBtnHeight);
        UIManager.setButtonCallback(this.idPrefix + 'Down', () => {
            this.scrollOffsetY += height * 0.5; // 半ページスクロール
        });
    }

    resetScroll() {
        this.scrollOffsetY = 0;
    }
}

export const UI = {
    BaseControl,
    TextButton,
    ImageButton,
    ToggleSwitch,
    Window,
    FullScreenTap,
    ScrollArea
};
