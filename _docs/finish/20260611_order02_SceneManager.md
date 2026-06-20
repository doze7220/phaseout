# 機能要件定義書: 汎用シーンスタックマネージャー（SceneManager）の導入

あなたは優秀なゲームエンジニアです。
『PHASE OUT ∴ Cluster Stirring』において、現在のパズル画面の単一駆動から、汎用的なシーンスタック管理（単一ロード・加算ロード両対応）へ移行するための大手術を行います。`PROJECT_ARCHITECTURE.md`及び`PROJECT_FUNCTION_INDEX.md`の資料を参照しながら進めてください。

現在のパズル画面のメイン処理（main.js, physics.js のループ部分）を、新設する SceneManager と PlayScene クラスへとライフサイクル（init, update, draw, destroy）に基づいて綺麗に移植・リファクタリングしてください。
直前のアップデート（v0.9.13）で確立した「既存の12層のレンダーパイプライン（MasterRenderer）」の実行順序、および「Matter.jsのDeltaクランプ（最大33ms）」の挙動は絶対に破壊しないでください。

## 1. 導入の目的と背景
現状のフルCanvas描画（DOM排除）および12層のマスターレンダーパイプラインのアーキテクチャを崩すことなく、各画面を動的に「丸ごと入れ替え（単一ロード）」または「重ね合わせ（加算ロード）」できる、堅牢で拡張性の高いシーン管理システム（SceneManager）を構築する。

## 2. アーキテクチャ原則
- 完全Canvas駆動の維持: 新設する各シーンもDOMは一切使用せず、すべてCanvas 2D APIによる描画および座標ベースの入力判定を行う。
- MasterRenderer（12層）との完全融合: SceneManager は独立して動くのではなく、MasterRenderer.js の描画フック内で動作する。

## 3. シーン共通インターフェース
今後作成するすべてのシーンクラスの親となる `js/scene/BaseScene.js` を新設し、以下のメソッド群を持つクラスとして定義してください。
- init(): シーンがロードされた瞬間に1回だけ実行される初期化処理。
- update(deltaTime): 毎フレームの状態・データ更新。
- draw(ctx, layerId): MasterRendererから各レイヤーごとに呼ばれるCanvas描画処理。
- handleInput(pointerInfo): ポインター（タップ）入力のハンドリング処理。
- destroy(): シーンアンロード時のメモリ解放・イベント解除処理。

## 4. SceneManager の機能要件・メソッド仕様
`js/core/SceneManager.js` を新規作成し、単一のインスタンス（シングルトン）として管理する。
- sceneStack (Array): 現在アクティブなシーンを保持する配列。
- changeScene(newSceneInstance): 現在のスタックの全シーンを破棄し、空にしてから新しいシーンを積む（画面入れ替え）。
- pushScene(newSceneInstance): 現在のスタックを維持したまま、上に新しいシーンを積む（加算ロード）。
- popScene(): スタック最前面のシーンを破棄し、元の画面に戻る。
- update(deltaTime): 原則、スタック最前面のシーンの update のみ実行（背面ロジックの停止）。
- draw(ctx, layerId): スタックの下層から順に、全シーンの draw(ctx, layerId) を呼び出す（MasterRendererの12層レイヤー走査から毎レイヤー呼ばれる想定）。
- handleInput(pointerInfo): スタック最前面のシーンのみに伝播させ、背面のゲーム画面へのタップ判定を自動ブロッキングする。

## 5. 既存コード（パズル画面）の移行・リファクタリング要件
- PlayScene の新設: 現在 `main.js`, `physics.js`, `logic.js` に直書き・グローバルに初期化されているパズルの起動処理（initPhysics, setupGameLogicなど）を、新設する `js/scene/PlayScene.js` の `init()` 内へ封じ込める。
- ループの委譲: `physics.js` 内の requestAnimationFrame 描画ループを `SceneManager.update` / `draw` 経由での呼び出しに切り替える。
- ゲームオーバー時の挙動: ライフが0になりリザルト画面へ移行する際は、グローバルフラグの書き換えではなく、`SceneManager.pushScene(new ResultScene())` または `changeScene` によって画面遷移を明確に行う（ResultScene自体の実装はモック/スタブで可）。

## 6. ドキュメントの更新
作業完了後、`changelog.js`, `PROJECT_ARCHITECTURE.md`, `PROJECT_FUNCTION_INDEX.md` を更新し、SceneManagerの導入および各種処理の委譲について反映してください。バージョンは適宜加算してください。

完了要件: エラーなくタイトルからパズル画面（PlayScene）が起動し、これまで通り物理演算と12層の描画が正常に動作すること。完了後、報告をお願いします。
