### 🛡️ 現在の実装進捗とファイル別責務一覧（キャラクターシステム）

#### 1. 静的マスターデータ層
*   **ファイル**: `js/core/CharacterData.js`
*   **更新内容**: キャラクターデータベース。
    *   現在の定義内容:
        * `id`: キャラクター識別ID
        * `name`: キャラクター名
        * `imagePath`: フッターで表示するパスを含んだ画像ファイル名
        * `skillName`: スキル名
        * `maxCharge`: スキル使用に必要なチャージ量

#### 2. 動的ロジック層（パズル専用）
*   **ファイル**: `js/core/CharacterPuzzleManager.js`
*   **更新内容**: アウトゲーム（編成画面など）とは完全に切り離された、パズル中のみ存在するキャラクターデータ管理基盤。
    *   `init(partyIds)`: 渡された編成ID配列から `CharacterData` を引き、ゲージ量0の動的ステートを生成。空枠（`null`）の許容処理も実装。
    *   `getSlotData(index)`: UI描画層（Footer）へ毎フレームデータを供給するためのGetter。
    *   `addCharge` / `reset`: ゲージの加算、およびパズル終了時の確実なステート破棄ロジック。

#### 3. グローバル状態管理層
*   **ファイル**: `js/core/config.js` (`GameState`)
*   **更新内容**: プレイヤーの現在の編成状態の保持。
    *   `GameState.party` の初期値として `[ "char_ruvie", null, null ]` を定義。
    *   `GameState.reset()` 呼び出し時（リトライ時など）にも編成データが吹き飛ばないよう、初期化処理を補完。

