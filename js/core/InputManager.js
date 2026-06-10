// InputManager.js
import { LAYOUT_CONFIG } from './config.js';

class InputManagerClass {
    constructor() {
        this.targetElement = null;
        this.onPointerDownCallbacks = [];
        this._handlePointerDown = this._handlePointerDown.bind(this);
    }

    init(targetElement) {
        this.dispose();
        this.targetElement = targetElement;
        if (this.targetElement) {
            this.targetElement.addEventListener('mousedown', this._handlePointerDown, { passive: false });
            this.targetElement.addEventListener('touchstart', this._handlePointerDown, { passive: false });
        }
    }

    dispose() {
        if (this.targetElement) {
            this.targetElement.removeEventListener('mousedown', this._handlePointerDown);
            this.targetElement.removeEventListener('touchstart', this._handlePointerDown);
        }
        this.targetElement = null;
        // コールバックは保持する（シーン遷移等でDOMが再生成されてもイベントリスナーは生き続けるため）
    }

    getLogicalPosition(clientX, clientY) {
        if (!this.targetElement) return { x: clientX, y: clientY };
        const rect = this.targetElement.getBoundingClientRect();
        
        // 高DPI環境(devicePixelRatio)を貫通する絶対的な論理サイズ
        const LOGICAL_WIDTH = LAYOUT_CONFIG.APP_WIDTH;
        const LOGICAL_HEIGHT = LAYOUT_CONFIG.APP_HEIGHT;

        // object-fit: contain と同じスケール比率の算出（絶対論理サイズ基準）
        const scale = Math.min(rect.width / LOGICAL_WIDTH, rect.height / LOGICAL_HEIGHT);
        
        // 余白（レターボックス/ピラーボックス）の算出
        const offsetX = (rect.width - LOGICAL_WIDTH * scale) / 2;
        const offsetY = (rect.height - LOGICAL_HEIGHT * scale) / 2;

        return {
            x: (clientX - rect.left - offsetX) / scale,
            y: (clientY - rect.top - offsetY) / scale
        };
    }

    onPointerDown(callback) {
        this.onPointerDownCallbacks.push(callback);
    }

    offPointerDown(callback) {
        this.onPointerDownCallbacks = this.onPointerDownCallbacks.filter(cb => cb !== callback);
    }

    _handlePointerDown(e) {
        if (e.cancelable) {
            e.preventDefault();
        }

        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            return;
        }

        const pos = this.getLogicalPosition(clientX, clientY);
        this.onPointerDownCallbacks.forEach(cb => cb(pos, e));
    }
}

export const InputManager = new InputManagerClass();
