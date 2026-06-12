// PlayScene.js
import { BaseScene } from './BaseScene.js';
import { initPhysics, updatePhysics, destroyPhysics } from '../core/physics.js';
import { GameState } from '../core/config.js';
import { SceneManager } from '../core/SceneManager.js';
import { ResultScene } from './ResultScene.js';

export class PlayScene extends BaseScene {
    constructor() {
        super();
    }

    init() {
        super.init();
        // パズルの起動処理
        // initPhysics() は重い同期処理を含むため、完了後の次フレームで
        // 巨大な deltaTime が物理エンジンへ流入するTime Spikeが発生しやすい。
        // これは SceneManager.needsDeltaReset フラグ ↔ MasterRenderer.loop の
        // 連携により、initPhysics() を含む pushScene 完了後のフレームで
        // lastTime がリセットされることで防止される。
        initPhysics();
        // NOTE: InputManagerからの入力ハンドリングは、main.jsでSceneManagerに委譲されるため、
        // logic.jsでの `InputManager.onPointerDown` は、一旦そのまま生かすか、
        // もしくは handleInput に移行する必要がありますが、今回は最小限の変更とするため
        // physics.js (initPhysics -> setupGameLogic) 内での登録をそのまま利用します。
        // ※ 本来は logic.js の pointerDownHandler を切り離してここで呼ぶのが理想です。
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // 物理エンジン（Matter.js）のDeltaクランプ処理を含む更新ループを実行
        updatePhysics(deltaTime);

        // ゲームオーバー判定とResultSceneへの遷移
        // logic.js側で GameState.isGameOver が true になり、かつ ResultScene がまだスタックに無い場合
        // ※ logic.js側で直接 pushScene を呼ぶ形に改修する場合はここは不要ですが、
        // 責務分担として SceneManager 経由で遷移させます。
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
