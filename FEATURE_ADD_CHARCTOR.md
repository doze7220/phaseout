### 🛡️ 現在の実装進捗とファイル別責務一覧（キャラクターシステム）

**重要**:
*  changelog.jsに関しては、当ファイルでは扱わないこと。
*  作業単位ではなく、ファイル（モジュール）単位に記述を行うこと。
*  「更新対象コード/キーワード」には、具体的な変数名、関数名、ID（文字列）を必ず列挙し、AIの勝手な命名（ハルシネーション）を防ぐこと。
*  データ構造に変更があった場合は、必ずプロパティ構成（スキーマ）を明記すること。
*  次回の着手予定（To-Do）がある場合は、末尾に明記してコンテキストの断絶を防ぐこと。

#### 1. 静的マスターデータ層
*   **ファイル**: `js/core/CharacterData.js`
*   **更新対象コード/キーワード**: `CharacterData`, `id`, `name`, `imagePath`, `skillName`, `skillId`, `maxCharge`, `colorId`, `"char_ruvie"`, `"char_cyan"`, `"char_elie"`, `"Red"`, `"CYAN"`, `"GREEN"`, `"skill_ruby_bullet"`
*   **更新内容概略**: 
    *   キャラクターデータベースの連想配列 `CharacterData` を新設し、初期キャラクター情報を定義。
    *   `colorId` (陣営色指定: Red 等) などの描画用パラメータを各キャラへ追加。
    *   `char_ruvie` から `skillName: "RUBY BULLET"` を削除し、代わりに `SkillData` を参照するための `skillId: "skill_ruby_bullet"` へデータ構造を移行。

#### 2. 動的ロジック層（パズル専用）
*   **ファイル**: `js/core/CharacterPuzzleManager.js`
*   **更新対象コード/キーワード**: `CharacterPuzzleManager`, `slots`, `init`, `getSlotData`, `addCharge`, `colorHex`, `COLOR_CONFIG`, `reset`, `SkillData`, `SkillManager`, `activateSkill`
*   **更新内容概略**: 
    *   アウトゲームと分離された、パズル中のみ存在する動的ステート管理モジュール `CharacterPuzzleManager` を新設。
    *   `init(partyIds)`: 渡された編成ID配列から `CharacterData` を引き、さらに `skillId` を元に `SkillData` から `skillName` を動的マージして、`currentCharge: 0` の動的ステートオブジェクトを生成（空枠 `null` 許容）。これによりUI描画側の後方互換性を維持。デバッグ用の初期化ログを出力。
    *   `getSlotData(slotIndex)`: UI層へ毎フレーム情報を供給するゲッターメソッド。
    *   `addCharge(colorHex, amount)`: 対応する `colorId` を持つキャラクターの `currentCharge` を加算し、`maxCharge` でクランプするロジックを実装。
    *   【バグ修正】 `addCharge` において、呼び出し元から渡される色がHEXコード（`#a81c14ff`等）であるため、`COLOR_CONFIG` を参照し色名（`Red`等）へ逆引き変換し、さらに `toUpperCase()` を用いて大文字で統一してから `colorId` と比較する安全なロジックを実装。
    *   【バグ修正/機能追加】 `addCharge` で上限ジャスト時にクランプ処理をすり抜ける問題を `>=` に修正。さらに、上限到達時にクランプした直後、自動で `SkillManager.activateSkill(slotIndex)` を呼び出すトリガーを結線。
    *   `reset()`: パズル終了時のステート破棄ロジック枠組み。

#### 3. グローバル状態管理層
*   **ファイル**: `js/core/config.js`
*   **更新対象コード/キーワード**: `GameState.party`, `GameState.reset()`
*   **更新内容概略**: 
    *   `GameState` 内にプレイヤーの編成状態を保持する配列 `party` を追加。初期値として `[ "char_ruvie", null, null ]` を設定。
    *   リトライ等で呼ばれる `GameState.reset()` 実行時にも、正しく上記配列が再初期化されるようバグ修正・補完。

#### 4. パズル進行・初期化ロジック層
*   **ファイル**: `js/core/logic.js`
*   **更新対象コード/キーワード**: `setupGameLogic`, `GaugeManager.init(GameState.life)`, `CharacterPuzzleManager.init(GameState.party)`, `finalizeDestruction`, `CharacterPuzzleManager.addCharge`, `colorCounts`
*   **更新内容概略**: 
    *   `setupGameLogic` 内の初回UI更新（`GaugeManager.init`）直後のタイミングで `CharacterPuzzleManager.init(GameState.party)` を呼び出す処理を追加し、パズル開始時の結線漏れを修正。
    *   `finalizeDestruction` 内で、宝石破壊集計処理の直後に `CharacterPuzzleManager.addCharge` を呼び出し、編成キャラクターのスキルゲージを加算するよう結線。

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

#### 8. スキルマスターデータ層
*   **ファイル**: `js/core/SkillData.js`
*   **更新対象コード/キーワード**: `SkillData`, `id`, `name`, `activationType`, `"skill_ruby_bullet"`
*   **更新内容概略**: 
    *   スキルの静的マスターデータを一元管理する連想配列 `SkillData` を新設。
    *   ルビィ用のスキルとして `"skill_ruby_bullet"` を定義し、表示名 `name: "RUBY BULLET"` および `activationType: "AUTO"` を設定。

#### 9. スキル発動管理層
*   **ファイル**: `js/core/SkillManager.js`
*   **更新対象コード/キーワード**: `SkillManager`, `activateSkill`, `CharacterPuzzleManager`
*   **更新内容概略**: 
    *   スキル発動の制御塔となる `SkillManager` モジュールを新設。
    *   `activateSkill(slotIndex)`: 発動対象のスロットインデックスを受け取り、コンソールへ発動ログを出力。その後、`currentCharge = 0` によりゲージをリセットする疎通確認用ロジックを実装。
    *   【機能追加】 ゲージリセット直後に `effects.showSkillPopup(slotData.skillName, slotData.colorId, slotIndex)` を呼び出し、UIへのポップアップ演出をキックする結線を追加。

#### 10. UIエフェクト設定・定数管理
*   **ファイル**: `js/core/effectConfig.js` / `js/core/LayoutConfig.js`
*   **更新対象コード/キーワード**: `SKILL_POPUP_EFFECT_CONFIG`, `DURATION_MS`, `FADE_IN_END`, `LAYOUT_CONFIG.SKILL_POPUP`, `START_Y_OFFSET`, `FONT_TITLE`
*   **更新内容概略**: 
    *   スキルポップアップ演出に必要な寿命、フェード閾値、Y軸移動量、シャドウブラー強度を `effectConfig.js` に新設。
    *   ポップアップのフォント、初期Yオフセット、文字色等のレイアウト定数を `LayoutConfig.js` に新設し、マジックナンバーを排除。

#### 11. スキルポップアップ描画層
*   **ファイル**: `js/render/SkillPopupRenderer.js` (新規作成)
*   **更新対象コード/キーワード**: `SkillPopupRenderer`, `popups`, `update`, `showSkillPopup`, `draw`, `slotMapping`
*   **更新内容概略**: 
    *   スキル発動時のポップアップUIの寿命管理とCanvas描画を専任で管理するクラスを新設。
    *   `showSkillPopup`: `slotMapping = [1, 0, 2]` を用いて発動対象のパネル座標を逆算し、表示リストにポップアップインスタンスを追加。
    *   `draw`: `THEME_COLORS` に基づく陣営色で発光させながら、上方向への移動とフェードイン・フェードアウトを行うアニメーションを描画。

#### 12. UI演出Facadeへの統合
*   **ファイル**: `js/render/ScreenEffectPopup.js` / `js/render/effects.js` / `js/render/ScreenEffects.js`
*   **更新対象コード/キーワード**: `SkillPopupRenderer`, `skillPopupRenderer`, `showSkillPopup`
*   **更新内容概略**: 
    *   `ScreenEffectPopup.js` に `SkillPopupRenderer` を委譲先としてインスタンス化。
    *   `ScreenEffects.js` に `showSkillPopup` の中継メソッドを追加し、内部の `popup` へ委譲。
    *   `effects.js` に `showSkillPopup` のFacadeを新設し、他モジュール（`SkillManager` 等）から安全に呼び出せるよう公開。

#### 13. スキル実行キュー・物理干渉層
*   **ファイル**: `js/core/SkillManager.js` / `js/core/physics.js` / `js/core/SkillData.js`
*   **更新対象コード/キーワード**: `activeSkillQueues`, `SkillManager.update()`, `DESTROY_EXCLUDE_COLOR`, `GameState.GEMS`, `window.Matter.Composite.remove`, `effects.playSE`, `'GUN'`, `'BREAK'`, `effects.spawnBurstSparks`, `effects.spawnParticles`, `effects.toggleStasisEffect`, `PhaseManager.setTimeScaleTarget`, `GameState.disableStasisFilter`
*   **更新内容概略**: 
    *   `SkillData.js` に `skill_ruby_bullet` 用の `type: "DESTROY_EXCLUDE_COLOR"`、`excludeColorId: "RED"`、`markerImagePath: "assets/img/skilleffect/bulletholes.png"` 等のパラメータを追加。
    *   `SkillManager.js` に `activeSkillQueues` を新設し、ステイシス（時止め）下でのロックオン早打ちロジックを実装。対象色（赤）以外の宝石から、現在チェイン中（消去待機中）の宝石を除外した上でランダムに抽出。
    *   ステイシス突入時、`GameState.disableStasisFilter = true` により白黒（グレースケール）化を回避し、さらに `PhaseManager.setTimeScaleTarget` を用いて物理エンジンをフェードでスローダウン・停止させるよう改修。
    *   `MasterRenderer.registerLayer` (LAYERS.FRONT_EFFECTS) を用いて、ロックオン済みの宝石に対して弾痕画像（1/8サイズに縮小・ランダム回転）を描画し続ける演出を実装。
    *   `update()` を状態遷移（LOCKING/DESTROYING）に対応させ、指定フレーム間隔でロックオン（SEと閃光）を実行。
    *   全ロックオンが完了した直後にステイシスを解除し、物理エンジンからの削除（`Matter.Composite.remove`）、固有の火花エフェクト（`effects.spawnBurstSparks`）、および通常の破壊エフェクト（`effects.spawnParticles` / `effects.playSE('BREAK')`）を一斉に実行する演出へ刷新。
    *   `physics.js` の `updatePhysics` 内で、物理ステップの進行（`while`）の外側（`safeDelta`ベース）で `SkillManager.update(safeDelta)` を呼び出すよう結線し、ステイシス中も演出が進行するよう改修。
