// SceneManager.js
export class SceneManagerClass {
    constructor() {
        this.sceneStack = [];
    }

    /**
     * 現在のスタックの全シーンを破棄し、空にしてから新しいシーンを積む（画面入れ替え）
     * @param {BaseScene} newSceneInstance 
     */
    changeScene(newSceneInstance) {
        while (this.sceneStack.length > 0) {
            const scene = this.sceneStack.pop();
            if (scene.isActive) {
                scene.destroy();
            }
        }
        this.pushScene(newSceneInstance);
    }

    /**
     * 現在のスタックを維持したまま、上に新しいシーンを積む（加算ロード）
     * @param {BaseScene} newSceneInstance 
     */
    pushScene(newSceneInstance) {
        this.sceneStack.push(newSceneInstance);
        newSceneInstance.init();
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
    }

    /**
     * 毎フレームの更新。原則、スタック最前面のシーンの update のみ実行（背面ロジックの停止）
     * @param {number} deltaTime 
     */
    update(deltaTime) {
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
    }

    /**
     * タップ入力ハンドリング。スタック最前面のシーンのみに伝播させる
     * @param {Object} pointerInfo 
     * @param {Event} e 
     * @returns {boolean} イベントを消費した場合はtrue
     */
    handleInput(pointerInfo, e) {
        if (this.sceneStack.length > 0) {
            const currentScene = this.sceneStack[this.sceneStack.length - 1];
            return currentScene.handleInput(pointerInfo, e);
        }
        return false;
    }
}

export const SceneManager = new SceneManagerClass();
