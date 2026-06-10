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
        this.onPointerDownCallbacks = [];
    }

    getLogicalPosition(clientX, clientY) {
        if (!this.targetElement) return { x: clientX, y: clientY };
        const rect = this.targetElement.getBoundingClientRect();
        
        const scaleX = LAYOUT_CONFIG.APP_WIDTH / rect.width;
        // targetElement.height が定義されていればそれを論理高さとし、なければパズル領域の高さを利用する
        const logicalHeight = this.targetElement.height || (LAYOUT_CONFIG.APP_HEIGHT - LAYOUT_CONFIG.HEADER_HEIGHT - LAYOUT_CONFIG.FOOTER_HEIGHT);
        const scaleY = logicalHeight / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
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
