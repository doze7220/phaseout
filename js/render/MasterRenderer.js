// MasterRenderer.js
import { SceneManager } from '../core/SceneManager.js';

export const LAYERS = {
    BACKGROUND: 1,
    GEMS: 2,
    LASER: 3,
    FOREGROUND_EFFECTS: 4,
    FRONT_EFFECTS: 5,
    IN_GAME_POST_EFFECT: 6,
    UI_BASE: 7,
    POPUP_TEXT: 8,
    MODAL_UI: 9,
    GLOBAL_POST_EFFECT: 10,
    SYSTEM_TOP: 11,
    DEBUG_OVERLAY: 12
};

class MasterRendererClass {
    constructor() {
        this.ctx = null;
        this.layers = {};
        for (let i = 1; i <= 12; i++) {
            this.layers[i] = [];
        }
        this.globalUpdateCallbacks = [];
        this.preRenderCallbacks = [];
        this.postRenderCallbacks = [];
        this.layerFilterCallback = null;

        this.fpsCount = 0;
        this.lastFpsTime = performance.now();
        this.currentFps = 0;
    }

    init(canvas) {
        this.ctx = canvas.getContext('2d');
        this.lastTime = performance.now();
        this.loopId = null;

        // Register FPS drawing to Layer 12
        this.registerLayer(LAYERS.DEBUG_OVERLAY, (ctx) => {
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
            ctx.filter = 'none';
            ctx.fillStyle = this.currentFps < 30 ? '#FF3B30' : (this.currentFps < 50 ? '#FFCC00' : '#00FF00');
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            const canvasWidth = ctx.canvas ? ctx.canvas.width : 720;
            const canvasHeight = ctx.canvas ? ctx.canvas.height : 1280;
            
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000';
            ctx.strokeText(`FPS: ${this.currentFps}`, canvasWidth - 10, canvasHeight - 10);
            ctx.fillText(`FPS: ${this.currentFps}`, canvasWidth - 10, canvasHeight - 10);
        });
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

    setLayerFilterCallback(callback) {
        this.layerFilterCallback = callback;
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
        for (let i = 1; i <= 12; i++) {
            const callbacks = this.layers[i];
            if (callbacks && callbacks.length > 0) {
                for (const cb of callbacks) {
                    this.ctx.save();
                    if (this.layerFilterCallback) {
                        this.layerFilterCallback(this.ctx, i);
                    }
                    cb(this.ctx);
                    this.ctx.restore();
                }
            }
            
            // SceneManagerからの描画呼び出し
            this.ctx.save();
            if (this.layerFilterCallback) {
                this.layerFilterCallback(this.ctx, i);
            }
            SceneManager.draw(this.ctx, i);
            this.ctx.restore();
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

        // FPS表示はレイヤー12のコールバックに移動済み
        
        this.ctx.restore();
    }
}

export const MasterRenderer = new MasterRendererClass();
