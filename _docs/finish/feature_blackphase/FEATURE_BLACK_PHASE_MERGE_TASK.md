# ブラックフェイズ統合タスク一覧

このドキュメントは `FEATURE_BLACK_PHASE.md` で実装されたブラックフェイズの各仕様・変更点を、プロジェクトの公式設計資料（Single Source of Truth）へ統合するためのタスクリストです。

## 1. `PROJECT_ARCHITECTURE.md` への統合タスク
- [x] **3. ディレクトリ・ファイル構成と厳密な責務** の更新
  - `BackgroundManager.js`: 特異点空間（黒背景、ワープ星空、特異点）の描画および、ワイプ時の `ctx.clip()` トランジション描画の責務を追記。
  - `ScreenEffectTransition.js`: ブラックフェイズ突入（`PHASE_BLACK_ENTER`）および復帰（`PHASE_BLACK_EXIT`）演出の描画責務を追記。
  - `ScreenEffectVignette.js`: 画像シーケンスによるヒビ割れ演出の描画責務を追記（特異点描画の責務は削除）。
  - `SpriteCacheManager.js`: ヒビ割れ画像シーケンスの白グレア事前焼き付け（多段マルチパス発光）やブラックフェイズ専用宝石キャッシュ生成責務を追記。
- [x] **4.2. フェイズ管理（PhaseManager）** の更新
  - `PHASE_BLACK_ENTER` / `PHASE_BLACK` / `PHASE_BLACK_EXIT` の状態について、物理エンジンのステイシス解除や `flushBlackHolePool` 等の詳細を追記または更新。
- [x] **4.4. グローバル状態（GameState）の主要プロパティ** の更新
  - `blackPhaseCount` (通過回数)、`breakGauge`、`blackHoleVisualPulse`、`blackHoleChainCount`、`currentCrackSetKey` を追加。
  - プール用変数 (`blackHolePooledScore`, `blackHolePooledExp`, `blackHolePooledLife`) を追加。

## 2. `PROJECT_FUNCTION_INDEX.md` への統合タスク
- [x] **`PhaseManager.js`**
  - `init`, `update` (ステイシス・減衰ロジック), `addPhaseGauge` (サバイバル減衰), `enterBlackPhase`, `enterWhitePhase` の引数・処理内容の追記。
- [x] **`logic.js`**
  - `pointerDownHandler` (タップ回復・パルス), `beforeUpdateHandler` (引力), `finalizeDestruction` (無限チェイン), `flushBlackHolePool` の追記。
- [x] **`ResultRenderer.js`**
  - `drawSummary`（1 TAP MAX SCORE の 'BLACK', 'WHITE' 専用アイコンおよび虹色発光対応）の追記。
- [x] **`BackgroundManager.js`**
  - `drawBlackPhaseWarpStars`, `_drawBlackHole` の追記。
- [x] **`ScreenEffectTransition.js`**
  - `drawPhaseBlackEnter`, `drawPhaseBlackExit` の追記。
- [x] **`ScreenEffectVignette.js`**
  - `update`, `drawFrontEffects` の処理変更（画像シーケンスヒビ割れ対応など）の追記。および `drawInGamePostEffects` からの特異点描画削除を追記。
- [x] **`SpriteCacheManager.js`**
  - `generateGemCaches`, `generateScoreCaches`, `AssetManager.loadAssets` (白グレア事前焼き付け対応) の追記。

## 3. `PROJECT_MATH_AND_BALANCE.md` への統合タスク
- [x] **ブラックフェイズ特有の動的加速減衰式**
  - `(BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * (t / TIME_DIVISOR)^POWER)` の数式定義を追記。
- [x] **サバイバル機構による減衰率**
  - `BLACK_GAUGE_ACQUISITION_DECAY_RATE (0.8)` と通過回数 (`blackPhaseCount`) に基づく、ゲージ獲得量・タップ回復量の減衰計算を追記。
- [x] **スコア計算モデルの特例**
  - 獲得EXP減衰なし (100%)。
  - スコアは `RATE x √(チェイン数-2) ^ 2` で無限チェインとして加算される仕様を追記。
- [x] **宝石補充制御モデル**
  - ブラックフェイズ中の宝石補充確率 `SPAWN_RATE.BLACK = 0.8`、補充インターバル `SPAWN_INTERVAL_FRAMES.BLACK = 10` の制限を追記。

## 4. `PROJECT_EFFECT.md` への統合タスク
- [x] **ヒビ割れ演出の仕様**
  - `CRACK_SETS` による画像シーケンス、動的閾値による進行表現、白グレアの「事前焼き付け（Pre-baking）」と「多段マルチパス発光」仕様を追記。
- [x] **特異点（ブラックホール）の描画仕様**
  - パルス効果、ブレイクゲージ残量連動の半径拡縮について追記。
  - 描画レイヤーが「BACKGROUND (1層)」へ移行されたことを明記。
- [x] **星空のトランジション**
  - 静止星空とワープ星空（`blackStars`）の分離、復帰ワイプアウト時の `ctx.clip()` によるクリッピング手法を追記。
- [x] **システムログ・全体演出**
  - `BLACK RESURRECT` 等のシステムログ演出と、トライバル展開・逆再生の突入・復帰演出仕様を追記。

## 5. `PROJECT_GLOSSARY_AND_GAMEDESIGN.md` への統合タスク
- [x] **ブラックフェイズ（特異点崩壊）**
  - フェイズ移行条件、ゲームルールの特例（無限チェイン、タップ延命、時間経過による崩壊）の正式定義を追記。
- [x] **ブレイクゲージ**
  - ブラックフェイズ中における「寿命インジケーター」としての役割の定義を更新・追記。
- [x] **特異点**
  - プール機能（蓄積したスコア等の解放）や吸い込み挙動の用語定義を追記。
