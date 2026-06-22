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

## 留意事項
*   コンフィグモーダル（`ConfigScene.js`）の DEBUG タブ描画処理については、現在の「`DebugConfig.js` から設定値を読み込む」美しい疎結合が保たれているため、今回のリファクタリング対象には含めず現状維持とする。
*   デバッグ情報の表示ON/OFF制御フラグ（`ENABLE_DEBUG_OVERLAY`）の判定も、`DebugManager` 側で確実に行うこと。
*   v0.26.X は「ホワイトフェイズ・ブラックフェイズの体験をユーザーに提供する」という目的のバージョンである。バージョンカウントを行う際にはZ桁を用いること。
