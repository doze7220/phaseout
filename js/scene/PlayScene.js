// PlayScene.js
import { BaseScene } from './BaseScene.js';
import { initPhysics, updatePhysics, destroyPhysics } from '../core/physics.js';
import { GameState } from '../core/config.js';
import { SceneManager } from '../core/SceneManager.js';
import { ResultScene } from './ResultScene.js';
import { StageManager } from '../core/StageManager.js';
import { PhaseManager } from '../core/PhaseManager.js';

export class PlayScene extends BaseScene {
    constructor(options = {}) {
        super();
        this.isDebugStart = options.isDebugStart || false;
    }

    init() {
        super.init();
        PhaseManager.init();
        // ステージデータを事前保持（initPhysics内のGAME.reset()後に色設定が適用される）
        StageManager.init('STAGE_01');
        initPhysics(this.isDebugStart);
        // NOTE: InputManagerからの入力ハンドリングは、main.jsでSceneManagerに委譲されるため、
        // logic.jsでの `InputManager.onPointerDown` は、一旦そのまま生かすか、
        // もしくは handleInput に移行する必要がありますが、今回は最小限の変更とするため
        // physics.js (initPhysics -> setupGameLogic) 内での登録をそのまま利用します。
        // ※ 本来は logic.js の pointerDownHandler を切り離してここで呼ぶのが理想です。
    }

    onFadeInStart() {
        super.onFadeInStart(); // BaseScene側で this.isTransitioning = false に切り替える
        
        // 暗転中のTime Spikeで一気にワープしないよう、SceneManager側にデルタリセットを要求する
        SceneManager.needsDeltaReset = true;

        if (GameState.selectedBgmSet) {
            import('../render/effects.js').then(module => {
                module.playStageBgmSet(GameState.selectedBgmSet);
            });
        }
    }

    update(realDelta, gameDelta) {
        if (!this.isActive) return;
        if (this.isTransitioning) return;

        // PhaseManagerの更新
        PhaseManager.update(gameDelta);

        // 物理エンジン（Matter.js）のDeltaクランプ処理を含む更新ループを実行
        updatePhysics(gameDelta);

        // ゲームオーバー判定とResultSceneへの遷移はlogic.js側に委譲
    }

    draw(ctx, layerId) {
        // パズル画面自体の描画は MasterRenderer の各レイヤーコールバックに登録されている
        // renderer.js や effects.js に委譲しているため、ここでの明示的な Canvas 描画は不要
    }

    handleInput(pointerInfo, e) {
        // logic.js で InputManager.onPointerDown に登録されている既存処理があるため
        // もし完全に委譲する場合はここにロジックを移しますが、
        // 今回は互換性維持のため、logic.jsの既存処理を活かします。
        return false; 
    }

    destroy() {
        super.destroy();
        destroyPhysics();
    }
}
