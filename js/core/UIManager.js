// UIManager.js

class UIManagerClass {
    constructor() {
        this.buttons = new Map();
    }

    /**
     * UIボタンのヒットエリア座標を更新・登録する。
     * 描画時に呼び出すことで、画面リサイズ等による座標変更に追従する。
     */
    updateButtonRect(id, layer, x, y, width, height) {
        if (!this.buttons.has(id)) {
            this.buttons.set(id, { layer: 0, x: 0, y: 0, width: 0, height: 0, callback: null, active: true });
        }
        const btn = this.buttons.get(id);
        btn.layer = layer;
        btn.x = x;
        btn.y = y;
        btn.width = width;
        btn.height = height;
        btn.active = true;
    }

    /**
     * UIボタンがクリックされた時のコールバックを登録する。
     */
    setButtonCallback(id, callback) {
        if (!this.buttons.has(id)) {
            this.buttons.set(id, { layer: 0, x: 0, y: 0, width: 0, height: 0, callback: null, active: false });
        }
        this.buttons.get(id).callback = callback;
    }

    /**
     * 指定されたボタンのヒット判定を無効にする。
     * @param {string} id 
     */
    deactivateButton(id) {
        if (this.buttons.has(id)) {
            this.buttons.get(id).active = false;
        }
    }

    /**
     * 入力座標（論理座標）に基づき、登録されたボタンの当たり判定を行う。
     * @param {Object} pos {x, y} 論理座標
     * @param {Event} originalEvent オリジナルのDOMイベント
     * @returns {boolean} いずれかのボタンにヒットし、処理された場合はtrue
     */
    handlePointerDown(pos, originalEvent) {
        // layerの降順（大きいほど手前）で判定
        const sortedButtons = Array.from(this.buttons.values())
            .filter(b => b.active)
            .sort((a, b) => b.layer - a.layer);

        for (const btn of sortedButtons) {
            if (pos.x >= btn.x && pos.x <= btn.x + btn.width &&
                pos.y >= btn.y && pos.y <= btn.y + btn.height) {
                // ヒットした場合
                if (btn.callback) {
                    btn.callback(originalEvent);
                }
                return true; // ヒットしたので奥の判定（パズル操作など）をブロックする
            }
        }
        return false;
    }
}

export const UIManager = new UIManagerClass();
