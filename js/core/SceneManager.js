// SceneManager.js
import { COLOR_CONFIG } from './config.js';
import { soundManager } from '../render/SoundManager.js';

export class SceneManagerClass {
    constructor() {
        this.sceneStack = [];
        /**
         * シーン切り替え直後のフレームで巨大なdeltaTimeが流入するのを防ぐフラグ。
         * changeScene / pushScene / popScene 時にtrueに設定し、
         * MasterRendererのloopで検知した直後にリセットされる。
         */
        this.needsDeltaReset = false;

        this.isTransitioning = false;
        this.transitionAlpha = 0;
        this.transitionState = 'NONE'; // 'FADE_OUT' | 'BLACK_WAIT_IN' | 'GLITCH_IN' | 'GLITCH_OUT' | 'BLACK_WAIT_OUT' | 'FADE_IN' | 'NONE'
        this.pendingScene = null;
        this.transitionTimer = 0;
        this.transitionDuration = 300;
        this.glitchColor = '#FFF';
        this.glitchProgress = 0;
        this.glitchPath = [];
    }

    /**
     * 現在のスタックの全シーンを破棄し、空にしてから新しいシーンを積む（画面入れ替え）
     * @param {BaseScene} newSceneInstance 
     * @param {boolean} useFade フェードトランジションを行うかどうか（デフォルトtrue）
     */
    changeScene(newSceneInstance, useFade = true) {
        if (this.isTransitioning) return;

        if (!useFade) {
            this._swapScenes(newSceneInstance);
            if (this.sceneStack.length > 0) {
                this.sceneStack[this.sceneStack.length - 1].onFadeInStart();
            }
            return;
        }

        this.pendingScene = newSceneInstance;
        this.isTransitioning = true;
        this.transitionState = 'FADE_OUT';
        this.transitionAlpha = 0;
        this.transitionTimer = 0;
        this.glitchProgress = 0;
        
        soundManager.stopBGM();
    }

    _swapScenes(newSceneInstance) {
        while (this.sceneStack.length > 0) {
            const scene = this.sceneStack.pop();
            if (scene.isActive) {
                scene.destroy();
            }
        }
        this.pushScene(newSceneInstance);
        this.needsDeltaReset = true;
    }

    /**
     * 現在のスタックを維持したまま、上に新しいシーンを積む（加算ロード）
     * @param {BaseScene} newSceneInstance 
     */
    pushScene(newSceneInstance) {
        this.sceneStack.push(newSceneInstance);
        newSceneInstance.init();
        // 重いinit()完了後のTime Spikeを防ぐためdeltaリセットを要求する
        this.needsDeltaReset = true;
    }

    /**
     * スタック最前面のシーンを破棄し、元の画面に戻る
     */
    popScene() {
        if (this.sceneStack.length > 0) {
            const scene = this.sceneStack.pop();
            if (scene.isActive) {
                scene.destroy();
            }
        }
        // pop後も次フレームのdeltaをリセットして演出の乱れを防ぐ
        this.needsDeltaReset = true;
    }

    /**
     * 毎フレームの更新。原則、スタック最前面のシーンの update のみ実行（背面ロジックの停止）
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionTimer += deltaTime;
            
            let duration = 300;
            if (this.transitionState === 'BLACK_WAIT_IN' || this.transitionState === 'BLACK_WAIT_OUT') {
                duration = 200;
            }

            let progress = this.transitionTimer / duration;
            if (progress > 1) progress = 1;

            if (this.transitionState === 'FADE_OUT') {
                this.transitionAlpha = progress;
                if (progress === 1) {
                    this._swapScenes(this.pendingScene);
                    this.pendingScene = null;
                    
                    this.transitionState = 'BLACK_WAIT_IN';
                    this.transitionTimer = 0;
                    
                    const enabledColors = COLOR_CONFIG.filter(c => c.enabled).map(c => c.color);
                    this.glitchColor = enabledColors[Math.floor(Math.random() * enabledColors.length)] || '#FFF';

                    // パスを事前生成（幅2000px程度までカバー）
                    this.glitchPath = [];
                    for (let x = 0; x <= 2000; x += 15) {
                        let noise = (Math.random() - 0.5) * 6;
                        if (Math.random() < 0.08) {
                            noise += (Math.random() - 0.5) * 80;
                        }
                        this.glitchPath.push({ x, noise });
                    }
                }
            } else if (this.transitionState === 'BLACK_WAIT_IN') {
                this.transitionAlpha = 1;
                if (progress === 1) {
                    this.transitionState = 'GLITCH_IN';
                    this.transitionTimer = 0;
                    this.glitchProgress = 0;
                }
            } else if (this.transitionState === 'GLITCH_IN') {
                this.transitionAlpha = 1;
                this.glitchProgress = progress;
                if (progress === 1) {
                    this.transitionState = 'GLITCH_OUT';
                    this.transitionTimer = 0;
                    this.glitchProgress = 0;
                }
            } else if (this.transitionState === 'GLITCH_OUT') {
                this.transitionAlpha = 1;
                this.glitchProgress = progress;
                if (progress === 1) {
                    this.transitionState = 'BLACK_WAIT_OUT';
                    this.transitionTimer = 0;
                }
            } else if (this.transitionState === 'BLACK_WAIT_OUT') {
                this.transitionAlpha = 1;
                if (progress === 1) {
                    this.transitionState = 'FADE_IN';
                    this.transitionTimer = 0;
                    if (this.sceneStack.length > 0) {
                        this.sceneStack[this.sceneStack.length - 1].onFadeInStart();
                    }
                }
            } else if (this.transitionState === 'FADE_IN') {
                this.transitionAlpha = 1 - progress;
                if (progress === 1) {
                    this.isTransitioning = false;
                    this.transitionState = 'NONE';
                    this.transitionAlpha = 0;
                }
            }
        }

        if (this.sceneStack.length > 0) {
            const currentScene = this.sceneStack[this.sceneStack.length - 1];
            currentScene.update(deltaTime);
        }
    }

    /**
     * スタックの下層から順に、全シーンの draw(ctx, layerId) を呼び出す
     * MasterRendererの12層レイヤー走査から毎レイヤー呼ばれる
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} layerId 
     */
    draw(ctx, layerId) {
        for (let i = 0; i < this.sceneStack.length; i++) {
            const scene = this.sceneStack[i];
            scene.draw(ctx, layerId);
        }

        if (layerId === 10 && this.isTransitioning && this.transitionAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            const width = ctx.canvas.width || 1280;
            const height = ctx.canvas.height || 720;
            ctx.fillRect(0, 0, width, height);

            if (this.transitionState === 'GLITCH_IN' || this.transitionState === 'GLITCH_OUT') {
                ctx.save();
                
                let startProgress = 0;
                let endProgress = 1;
                
                if (this.transitionState === 'GLITCH_IN') {
                    endProgress = this.glitchProgress;
                } else if (this.transitionState === 'GLITCH_OUT') {
                    startProgress = this.glitchProgress;
                }

                const startX = width * startProgress;
                const endX = width * endProgress;

                // 進行度に応じて描画範囲をクリッピング
                ctx.beginPath();
                ctx.rect(startX, 0, endX - startX, height);
                ctx.clip();

                ctx.strokeStyle = this.glitchColor;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                const centerY = height / 2;
                
                if (this.glitchPath.length > 0) {
                    ctx.moveTo(this.glitchPath[0].x, centerY + this.glitchPath[0].noise);
                    for (let i = 1; i < this.glitchPath.length; i++) {
                        const pt = this.glitchPath[i];
                        ctx.lineTo(pt.x, centerY + pt.noise);
                        if (pt.x > width + 50) break; // 画面外まできたら描画打ち切り
                    }
                    ctx.stroke();
                }
                
                ctx.restore();
            }
            ctx.restore();
        }
    }

    /**
     * タップ入力ハンドリング。スタック最前面のシーンのみに伝播させる
     * @param {Object} pointerInfo 
     * @param {Event} e 
     * @returns {boolean} イベントを消費した場合はtrue
     */
    handleInput(pointerInfo, e) {
        if (this.isTransitioning) {
            return true;
        }

        if (this.sceneStack.length > 0) {
            const currentScene = this.sceneStack[this.sceneStack.length - 1];
            return currentScene.handleInput(pointerInfo, e);
        }
        return false;
    }
}

export const SceneManager = new SceneManagerClass();
