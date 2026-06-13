// BaseScene.js
export class BaseScene {
    constructor() {
        this.isActive = false;
    }

    /**
     * シーンがロードされた瞬間に1回だけ実行される初期化処理
     */
    init() {
        this.isActive = true;
    }

    /**
     * FADE_INが開始される瞬間に実行される処理（BGMの再生など）
     */
    onFadeInStart() {
        // オーバーライド用
    }

    /**
     * 毎フレームの状態・データ更新
     * @param {number} deltaTime - 前回フレームからの経過時間（ミリ秒）
     */
    update(deltaTime) {
        // オーバーライド用
    }

    /**
     * MasterRendererから各レイヤーごとに呼ばれるCanvas描画処理
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     * @param {number} layerId - 現在描画中のレイヤーID
     */
    draw(ctx, layerId) {
        // オーバーライド用
    }

    /**
     * ポインター（タップ）入力のハンドリング処理
     * @param {Object} pointerInfo - 座標情報 {x, y}
     * @param {Event} e - オリジナルのイベントオブジェクト
     * @returns {boolean} 入力を消費した場合はtrue（背面のシーンへ伝播しない）
     */
    handleInput(pointerInfo, e) {
        // オーバーライド用
        return false;
    }

    /**
     * シーンアンロード時のメモリ解放・イベント解除処理
     */
    destroy() {
        this.isActive = false;
    }
}
