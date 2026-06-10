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
    }

    init(Events, render) {
        this.ctx = render.context;
        Events.on(render, 'afterRender', () => {
            this.renderAll();
        });
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
        
        this.ctx.restore();
    }
}

export const MasterRenderer = new MasterRendererClass();
