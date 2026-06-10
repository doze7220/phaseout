// MasterRenderer.js
export const LAYERS = {
    BACKGROUND: 1,
    PHYSICS_OBJECTS: 2,
    LASER: 3,
    PARTICLE: 4,
    SPACE_EFFECT: 5,
    FLOATING_INFO: 6,
    BASE_UI: 7,
    MODAL_UI: 8,
    TRANSITION: 9,
    TAP_FEEDBACK: 10,
    DEBUG: 11
};

class MasterRendererClass {
    constructor() {
        this.ctx = null;
        this.layers = {};
        for (let i = 1; i <= 11; i++) {
            this.layers[i] = [];
        }
        this.globalUpdateCallbacks = [];
        this.preRenderCallbacks = [];
        this.postRenderCallbacks = [];

        this.fpsCount = 0;
        this.lastFpsTime = performance.now();
        this.currentFps = 0;
    }

    init(canvas) {
        this.ctx = canvas.getContext('2d');
        this.lastTime = performance.now();
        this.loopId = null;
    }

    start() {
        if (!this.loopId) {
            this.lastTime = performance.now();
            this.loop = this.loop.bind(this);
            this.loopId = requestAnimationFrame(this.loop);
        }
    }

    stop() {
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }
    }

    loop(time) {
        this.loopId = requestAnimationFrame(this.loop);
        
        let delta = time - this.lastTime;
        this.lastTime = time;

        // グローバル更新（物理など）を実行
        for (const callback of this.globalUpdateCallbacks) {
            callback(delta, time);
        }

        // 全レイヤー描画を実行
        this.renderAll();
    }

    // 各レイヤーの描画処理を登録
    registerLayer(layerId, callback) {
        if (this.layers[layerId]) {
            this.layers[layerId].push(callback);
        } else {
            console.warn(`Layer ${layerId} is not defined.`);
        }
    }

    unregisterLayer(layerId, callback) {
        if (this.layers[layerId]) {
            this.layers[layerId] = this.layers[layerId].filter(cb => cb !== callback);
        }
    }

    // 描画以外の毎フレーム更新処理（displayScoreの更新など）
    registerGlobalUpdate(callback) {
        this.globalUpdateCallbacks.push(callback);
    }

    clearGlobalUpdates() {
        this.globalUpdateCallbacks = [];
    }

    // 全体描画前の処理（フィルタ設定など）
    registerPreRender(callback) {
        this.preRenderCallbacks.push(callback);
    }

    // 全体描画後の処理（フィルタ解除など）
    registerPostRender(callback) {
        this.postRenderCallbacks.push(callback);
    }

    renderAll() {
        if (!this.ctx) return;
        
        // 状態更新
        for (const cb of this.globalUpdateCallbacks) {
            cb();
        }

        this.ctx.save();
        
        // Pre-render (フィルター適用など)
        for (const cb of this.preRenderCallbacks) {
            cb(this.ctx);
        }
        
        // 各レイヤー描画
        for (let i = 1; i <= 11; i++) {
            const callbacks = this.layers[i];
            if (callbacks && callbacks.length > 0) {
                for (const cb of callbacks) {
                    this.ctx.save();
                    cb(this.ctx);
                    this.ctx.restore();
                }
            }
        }
        
        // Post-render
        for (const cb of this.postRenderCallbacks) {
            cb(this.ctx);
        }

        // FPS calculation and drawing
        const now = performance.now();
        this.fpsCount++;
        if (now - this.lastFpsTime >= 1000) {
            this.currentFps = this.fpsCount;
            this.fpsCount = 0;
            this.lastFpsTime = now;
        }

        // FPS表示 (常に最前面)
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.filter = 'none';
        this.ctx.fillStyle = this.currentFps < 30 ? '#FF3B30' : (this.currentFps < 50 ? '#FFCC00' : '#00FF00');
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'bottom';
        // キャンバスサイズ (LAYOUT_CONFIG 等がインポートされていないので固定値か canvas から取得)
        const canvasWidth = this.ctx.canvas ? this.ctx.canvas.width : 720;
        const canvasHeight = this.ctx.canvas ? this.ctx.canvas.height : 1280;
        
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#000';
        this.ctx.strokeText(`FPS: ${this.currentFps}`, canvasWidth - 10, canvasHeight - 10);
        this.ctx.fillText(`FPS: ${this.currentFps}`, canvasWidth - 10, canvasHeight - 10);
        
        this.ctx.restore();
    }
}

export const MasterRenderer = new MasterRendererClass();
