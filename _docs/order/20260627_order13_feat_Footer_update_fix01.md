# デバッグ対応指示：CharacterPuzzleManagerの初期化結線

デバッグログの調査により、`CharacterPuzzleManager.init()` がゲームの初期化フローから呼び出されていない（結線漏れ）ことが判明したため、以下の改修を行え。

## 1. CharacterPuzzleManagerの初期化呼び出し追加
*   **対象モジュール**: `js/core/physics.js`（`initPhysics` 関数内）、または `js/core/logic.js`（`setupGameLogic` 関数内）のいずれか、アーキテクチャ上最も適切なパズル初期化箇所。
*   **改修内容**:
    1.  ファイル上部に `CharacterPuzzleManager` をインポートせよ。
    2.  パズル初期化フロー（`GameState.reset()` 等が実行された直後のタイミング）にて、`CharacterPuzzleManager.init(GameState.party);` を実行する処理を追加せよ。

## 2. 動作確認
*   上記を結線した上でパズルをリロードし、コンソールに `[CharPzMng] 初期化完了. Slots: ...` のログが出力され、FooterUIにキャラクター（ルビィ）の画像・名前・ゲージが正しく描画されることを確認せよ。

上記を実施し、フッターUIへのキャラクター受肉を完了させよ。
