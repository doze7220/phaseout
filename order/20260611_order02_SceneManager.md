機能要件定義書: 汎用シーンスタックマネージャー（SceneManager）の導入

添付した PROJECT_ARCHITECTURE.md および REQUIREMENT_SCENE_MANAGER.md（この要件定義書）を完全に理解してください。
現在のパズル画面の単一駆動から、汎用的なシーンスタック管理（単一ロード・加算ロード両対応）へ移行するため、まずは js/core/SceneManager.js を新規作成してください。
その後、現在のパズル画面のメイン処理（main.js, physics.js のループ部分）を PlayScene クラスへとライフサイクル（init, update, draw, destroy）に基づいて綺麗に移植・リファクタリングしてください。既存の11層のレンダーパイプライン（MasterRenderer）の実行順序およびMatter.jsのDeltaクランプの挙動は絶対に破壊しないでください。

1. 導入の目的と背景
本作『PHASE OUT: Cluster Stirring』は、現在パズルゲーム本編のみが実装されているが、将来的に「ホーム画面」「パーティ編成」「ガチャ」等のマルチシーン展開を予定している。
現状のフルCanvas描画（DOM排除）および11層のマスターレンダーパイプラインのアーキテクチャを崩すことなく、各画面を動的に「丸ごと入れ替え（単一ロード）」または「重ね合わせ（加算ロード）」できる、堅牢で拡張性の高いシーン管理システム（SceneManager）を構築する。

2. アーキテクチャ原則 (Single Source of Truth)
完全Canvas駆動の維持: 新設する各シーン（ホーム、ガチャ等）もDOMは一切使用せず、すべてCanvas 2D APIによる描画および座標ベースの入力判定を行う。

MasterRenderer（11層）との完全融合: SceneManager は独立して動くのではなく、MasterRenderer.js の描画フック内で動作する。

ライフサイクル・カプセル化: 各シーンは自身の初期化（init）、更新（update）、描画（draw）、破棄（destroy）のライフサイクルを自己完結させ、他シーンのメモリやグローバル汚染を引き起こさない。

3. シーン共通インターフェース（ダミークラス / 抽象定義）
今後作成するすべてのシーンクラスは、以下の統合インターフェースを必ず実装しなければならない。

JavaScript
/**
 * @interface IGameScene
 */
export class BaseScene {
    /** シーンがスタックに積まれた（ロードされた）瞬間に一度だけ実行 */
    init() {}

    /**
     * 毎フレームのデータ・状態更新
     * @param {number} deltaTime - 前フレームからの経過時間(ms)
     */
    update(deltaTime) {}

    /**
     * Canvasへの描画要求（MasterRendererからレイヤーごとに細分化して呼ばれる、または一括）
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     * @param {number} layerId - MasterRendererの現在の走査レイヤーID
     */
    draw(ctx, layerId) {}

    /** ポインター（マウス/タッチ）入力のハンドリング */
    handleInput(pointerInfo) {}

    /** シーンが破棄（アンロード）される瞬間に実行。メモリ解放、イベント解除を担う */
    destroy() {}
}
4. SceneManager の機能要件・メソッド仕様
js/core/SceneManager.js として新規実装する。ゲーム全体で単一のインスタンス（シングルトン）として管理する。

4.1. 内部状態（プロパティ）
sceneStack (Array): 現在アクティブなシーンのインスタンスを保持する配列（末尾が最前面のシーン）。

4.2. メソッド仕様
① changeScene(newSceneInstance) 【単一ロード・画面入れ替え】
用途: タイトル ➔ ホーム、ホーム ➔ パズル本編など、画面を完全に切り替える場合。

処理フロー:

現在 sceneStack に存在するすべてのシーンの destroy() を順次呼び出し、メモリを完全に解放する。

sceneStack を空（長さ0）にする。

引数で渡された newSceneInstance の init() を実行する。

sceneStack.push(newSceneInstance) でスタックに積む。

② pushScene(newSceneInstance) 【加算ロード・画面重ね合わせ】
用途: パズル中に「コンフィグモーダル（STASIS）」を開く、または報酬確認ウィンドウを上に重ねる場合。

処理フロー:

引数で渡された newSceneInstance の init() を実行する。

現在のスタックを維持したまま、sceneStack.push(newSceneInstance) を行う（現在の画面の上に重なる）。

③ popScene() 【重ね合わせシーンの破棄】
用途: 重ねたモーダルやサブウィンドウを閉じ、元の画面に戻る場合。

処理フロー:

sceneStack の長さが1以下の場合は処理をスキップ（ベースシーンの消失防止）。

スタックの末尾から要素を取り出し（pop()）、そのシーンの destroy() を実行して安全にメモリから解放する。

④ update(deltaTime) 【状態更新の委譲】
処理フロー:

原則、スタックの最前面（配列の末尾）にあるシーンの update(deltaTime) のみを実行する（背面にあるシーンのロジックを一時停止させるため）。

※ ただし、背面の演出を動かし続けたい例外的なケースに対応できるよう、シーン側のプロパティ（例: isOverlay）等で背面更新を許可する余地を残すこと。

⑤ draw(ctx, layerId) 【描画パイプラインとの連動】
処理フロー:

MasterRenderer.js の11層レイヤー走査（renderAll）から、毎レイヤーごとに呼び出される。

スタックに積まれているすべてのシーンに対して、下層（インデックス0）から順番に scene.draw(ctx, layerId) を呼び出し、Canvas上で正しく重ね合わせが行われるようにする。

⑥ handleInput(pointerInfo) 【入力判定の遮断（ブロッキング）】
処理フロー:

スタックの最前面（配列の末尾）にあるシーンのみに handleInput を伝播させる。これにより、上にウィンドウ（MODAL_UIなど）が開いている間、背面のゲーム画面に対するタップ判定を100%自動でブロッキングする。

5. 既存コード（パズル画面）の移行・リファクタリング要件
既存のパズルロジックを、このシステムへ安全に適合させるための改修要件。

PlayScene の新設:
現在 main.js, physics.js, logic.js に直書き・グローバルに初期化されているパズルの起動処理（initPhysics, setupGameLogicなど）を、新設する PlayScene クラスの init() 内へ封じ込める。

ループの委譲:
physics.js 内の requestAnimationFrame 描画ループを SceneManager.update / draw 経由での呼び出しに切り替える。

ゲームオーバー時の挙動:
ライフが0になりリザルト画面へ移行する際は、グローバルフラグの書き換えではなく、SceneManager.pushScene(new ResultScene()) または changeScene によって画面遷移を明確に行う。

