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

        import('../render/effects.js').then(module => {
            module.playSceneBGM('RESULT');
        });
    }

    onFadeInStart() {
        super.onFadeInStart();
        // pushSceneにより暗転遷移がスキップされるため、BGM再生はinit内で実施
    }

    update(realDelta, gameDelta) {
        if (!this.isActive) return;
        if (this.isTransitioning) return;

        // リザルト演出はスロー/倍速で見たい可能性があるため gameDelta を渡す
        ResultRenderer.update(realDelta, gameDelta);
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
