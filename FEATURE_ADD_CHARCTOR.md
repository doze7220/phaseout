### 🛡️ 現在の実装進捗とファイル別責務一覧（キャラクターシステム）

#### 1. 静的マスターデータ層
*   **ファイル**: `js/core/CharacterData.js`
*   **更新対象コード/キーワード**: `CharacterData`, `id`, `name`, `imagePath`, `skillName`, `maxCharge`, `colorId`, `"char_ruvie"`, `"char_cyan"`, `"char_elie"`, `"RUBY BULLET"`, `"RED"`, `"CYAN"`, `"GREEN"`
*   **更新内容概略**: 
    *   キャラクターデータベースの連想配列 `CharacterData` を新設し、初期キャラクター情報を定義。
    *   `skillName` や `colorId` (陣営色指定: RED 等) などの描画用パラメータを各キャラへ追加。

#### 2. 動的ロジック層（パズル専用）
*   **ファイル**: `js/core/CharacterPuzzleManager.js`
*   **更新対象コード/キーワード**: `CharacterPuzzleManager`, `slots`, `init(partyIds)`, `getSlotData(slotIndex)`, `addCharge(color, amount)`, `reset()`, `console.log("[CharPzMng]")`
*   **更新内容概略**: 
    *   アウトゲームと分離された、パズル中のみ存在する動的ステート管理モジュール `CharacterPuzzleManager` を新設。
    *   `init(partyIds)`: 渡された編成ID配列から `CharacterData` を引いて `currentCharge: 0` の動的ステートオブジェクトを生成（空枠 `null` 許容）。デバッグ用の初期化ログを出力。
    *   `getSlotData(slotIndex)`: UI層へ毎フレーム情報を供給するゲッターメソッド。
    *   `addCharge(color, amount)` / `reset()`: ゲージ加算およびパズル終了時のステート破棄ロジック枠組み。

#### 3. グローバル状態管理層
*   **ファイル**: `js/core/config.js`
*   **更新対象コード/キーワード**: `GameState.party`, `GameState.reset()`
*   **更新内容概略**: 
    *   `GameState` 内にプレイヤーの編成状態を保持する配列 `party` を追加。初期値として `[ "char_ruvie", null, null ]` を設定。
    *   リトライ等で呼ばれる `GameState.reset()` 実行時にも、正しく上記配列が再初期化されるようバグ修正・補完。

#### 4. パズル進行・初期化ロジック層
*   **ファイル**: `js/core/logic.js`
*   **更新対象コード/キーワード**: `setupGameLogic`, `GaugeManager.init(GameState.life)`, `CharacterPuzzleManager.init(GameState.party)`
*   **更新内容概略**: 
    *   `setupGameLogic` 内の初回UI更新（`GaugeManager.init`）直後のタイミングで `CharacterPuzzleManager.init(GameState.party)` を呼び出す処理を追加し、パズル開始時の結線漏れを修正。

#### 5. 画像プリロード管理
*   **ファイル**: `js/render/SpriteCacheManager.js`
*   **更新対象コード/キーワード**: `loadAllSprites()`, `CharacterData`, `imagePath`, `AssetManager.images`
*   **更新内容概略**: 
    *   ゲーム開始時のアセット読み込みループ内で、`CharacterData` の `imagePath` を動的に抽出し、`AssetManager.images` へ全キャラ画像をキャッシュ（事前ロード）する処理を追加。

#### 6. UI描画・レイアウト設定
*   **ファイル**: `js/core/LayoutConfig.js`
*   **更新対象コード/キーワード**: `LAYOUT_CONFIG.FOOTER_UI`, `CHAR_IMAGE_DRAW_SIZE`, `CHAR_IMAGE_OFFSET_X`, `CHAR_IMAGE_OFFSET_Y`, `CHAR_NAME_FONT`, `CHAR_NAME_COLOR`, `SKILL_NAME_FONT`, `GAUGE_HEIGHT`, `GAUGE_WIDTH`, `GAUGE_BG_COLOR`
*   **更新内容概略**: 
    *   キャラクター描画に必要なすべてのレイアウト定数（画像サイズ160、オフセットX: -30、オフセットY: 0、フォントサイズ、ゲージ高30等）をマジックナンバー排除ルールに従い定義。

#### 7. フッターUI描画層
*   **ファイル**: `js/render/FooterUIManager.js`
*   **更新対象コード/キーワード**: `updateAndDraw`, `debugLogDone`, `console.log("[Footer]")`, `slotMapping = [1, 0, 2]`, `drawPanel`, `ctx.clip()`, `ctx.rect(x, y - 2000, width, height + 4000)`, `ctx.drawImage`, `THEME_COLORS[slotData.colorId]`
*   **更新内容概略**: 
    *   `updateAndDraw`: `slotMapping` 配列を用いて、左から「2人目、1人目、3人目」の編成順序となるようパネル描画をマッピング。初回のみ `debugLogDone` を用いてログを出力。
    *   `drawPanel`: 取得した `slotData` の有無（`null` か否か）により、NO SIGNAL表示エフェクトとキャラクター情報表示を分岐。
    *   クリッピング制御: キャラクター画像の描画直前で `ctx.rect(x, y - 2000, width, height + 4000)` により横幅（左右）のみをクリッピングし、上方向へはみ出す描画を許可。
    *   画像描画: `imgY = (y + height) - config.CHAR_IMAGE_DRAW_SIZE - config.CHAR_IMAGE_OFFSET_Y` により「パネル左下」を基準に配置。
    *   テキスト/ゲージ描画: `THEME_COLORS` から陣営色を引き、スキル名および `currentCharge / maxCharge` の比率に基づくゲージ幅を描画。

#### 8. バージョンおよびログ管理
*   **ファイル**: `changelog.js`
*   **更新対象コード/キーワード**: `v0.26.73`, `changes` 配列
*   **更新内容概略**: 
    *   `v0.26.73` の更新内容として、静的/動的データの分離、フッターへの描画とマッピングロジック、`logic.js` 結線バグ修正、および `ctx.clip` によるはみ出しクリッピング最適化の全履歴を記録。
