// ResultScene.js
import { BaseScene } from './BaseScene.js';
import { showResultOverlay, hideResultOverlay } from '../render/scene.js';

export class ResultScene extends BaseScene {
    constructor() {
        super();
    }

    init() {
        super.init();
        // ResultRendererを起動してCanvasベースのリザルト画面を表示する
        showResultOverlay();
    }

    update(deltaTime) {
        // リザルト画面での更新処理があればここに記述
    }

    draw(ctx, layerId) {
        // MasterRenderer のレイヤー9 (MODAL_UI) などで ResultRenderer が描画するため
        // ここでの明示的な描画は不要
    }

    handleInput(pointerInfo, e) {
        // リザルト画面の入力ハンドリング
        // 既存実装ではUIManagerのボタンで処理しているため、ここはデフォルトのまま
        return false;
    }

    destroy() {
        super.destroy();
        // リザルト画面のクリーンアップ
        hideResultOverlay();
    }
}
