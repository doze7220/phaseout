# 実装指示書：デバッグ機能のリファクタリングと `DebugManager.js` の新設

## 目的
モジュールの肥大化を防ぎ、責務を純化するため、現在複数のファイルに分散・間借りしているデバッグ関連のロジック（描画と初期化）を抽出し、新設する `DebugManager.js` へ完全にカプセル化する。

## 変更対象ファイル
*   `js/render/DebugManager.js` (新規作成)
*   `js/render/Visualizer.js` (デバッグ描画ロジックの削除)
*   `js/core/physics.js` (デバッグ初期化ロジックの削除)
*   `js/render/effects.js` (描画レイヤーの登録先変更)
*   `js/main.js` (初期化メソッドの呼び出し追加)

## 実装手順

### 1. `DebugManager.js` の新設
*   `js/render/DebugManager.js` を作成し、クラス（またはシングルトンオブジェクト）としてエクスポートする。
*   **`init()` メソッドの実装**:
    *   現在 `physics.js` の初期化処理（`initPhysics`）内に直書きされている、「デバッグスタート時に `DebugConfig.js` の `START_PRESET` などを読み込んで `GameState.debug` や各種パラメータへインジェクション（初期化）する処理」を切り取り、ここへ移動する。
*   **`draw()` メソッドの実装**:
    *   現在 `Visualizer.js` に存在する `drawDebug(ctx)` メソッドの描画ロジックをすべて切り取り、ここへ移動する。

### 2. 既存ファイルの純化（責務の剥離）
*   **`Visualizer.js`**: `drawDebug` メソッドを削除し、デバッグ機能のためにインポートしていたモジュール（`DebugConfig` 等）があれば削除する。これにより、Visualizer を純粋な「背景エフェクト」クラスにする。
*   **`physics.js`**: デバッグ用の初期化インジェクション処理を削除し、物理エンジンの初期化機能のみに純化させる。

### 3. 初期化と描画パイプラインの結線
*   **`main.js`**:
    *   ゲームのエントリポイントにおける初期化フロー（Canvas初期化や `setupEffectsRenderer` の直前など、適切なタイミング）で、新設した `DebugManager.init()` を呼び出すように追加する。
*   **`effects.js`**:
    *   `setupEffectsRenderer` 内で行っている「第12層（`DEBUG_OVERLAY`）への描画コールバック登録」の参照先を、`Visualizer.drawDebug` から `DebugManager.draw` へと変更する。

### 補足

1. **`main.js` における `init()` 呼び出しの厳密な位置**:
   `setupEffectsRenderer()` の呼び出しの「直前行」に追加してください。これにより、エフェクトレイヤーの登録前にデバッグ機能の初期化が完了していることを保証します。

2. **`ENABLE_DEBUG_OVERLAY` の定義元とアクセス方法**:
   このフラグは `js/core/DebugConfig.js` 内で定義・エクスポートされています。
   `DebugManager.js` 内で `import { ENABLE_DEBUG_OVERLAY } from '../core/DebugConfig.js';` のようにインポートして参照してください。

3. **`DebugManager.init()` が要求する引数**:
   引数として `{ isDebugStart: false }` のようなフラグ（オブジェクト）を要求する仕様として実装してください。このメソッドは以下の「2つの役割」を担います。
   - **通常スタート時（`isDebugStart: false` またはアプリ起動時）**: `GameState.debug` 等のすべてのデバッグ用変数を、ゲーム計算に影響を与えない「無害なデフォルト値（x1 や 0 など）」にリセットする。
   - **デバッグスタート時（`isDebugStart: true`）**: `DebugConfig.js` の `DEBUG_START_INITIAL_VALUES` 等のチート用プリセットを `GameState` へインジェクションする。
   ※いずれの場合も、物理エンジンの `engine` や `world` 等の外部パラメータには依存しない純粋な状態操作として実装してください。

#### 追加指示：デバッグ初期化の完全カプセル化と初期化漏れの修正
今回のリファクタリングに伴い、アーキテクチャの責務を純化するため以下の修正を必ず実行してください。

1. `js/core/config.js` の `GameState.reset()` メソッド内に現在混在している「デバッグ変数（スコア倍率や経験値倍率など）の初期化処理」をすべて削除し、上記 `DebugManager.init()` の通常モード（無害化）側へ完全に移植してください。
2. その際、現在 `GameState.reset()` で初期化処理が漏れてバグの温床となっている**「シフトゲージ減算補正値（SHIFT_DECAY_MULT 関連のデバッグ変数）」をデフォルト値（x1等）にリセットする処理も確実に `DebugManager.init()` 内に追加**してください。
3. 通常のパズル開始時（`physics.js` の `initPhysics` 等で `GameState.reset()` が呼ばれるタイミング）に、あわせて `DebugManager.init({ isDebugStart: false })` を呼び出すように結線し、「デバッグに関する状態のリセットはすべて DebugManager が単一責任で行う」構造を確立してください。


## 留意事項
*   コンフィグモーダル（`ConfigScene.js`）の DEBUG タブ描画処理については、現在の「`DebugConfig.js` から設定値を読み込む」美しい疎結合が保たれているため、今回のリファクタリング対象には含めず現状維持とする。
*   デバッグ情報の表示ON/OFF制御フラグ（`ENABLE_DEBUG_OVERLAY`）の判定も、`DebugManager` 側で確実に行うこと。
*   v0.26.X は「ホワイトフェイズ・ブラックフェイズの体験をユーザーに提供する」という目的のバージョンである。バージョンカウントを行う際にはZ桁を用いること。
