# ブラックフェイズ（特異点崩壊）アーキテクチャ・実装状況

## 1. 変更ファイルと対象関数一覧（インデックス）
* **`js/core/PhaseManager.js`**
  - `init()`: `blackPhaseElapsedTime`（ブラックフェイズ専用タイマー）の初期化処理を追加。
  - `update()`: ブレイクゲージの時間減衰ロジック（`BLACK_DECAY_BASE` 等を用いた動的加速減衰）。通常フェイズの減衰との排他制御を明確化し、`blackPhaseElapsedTime` を用いて二次関数的な時間加速減衰を正しく計算するように修正。また、ブラックフェイズ突入演出完了時に物理エンジンのステイシスを解除（`timeScale` を `1.0` にフェード復帰）し、`isPuzzlePaused = false` にする処理を追加。さらに `PHASE_BLACK_EXIT` にてステイシス有効化、`flushBlackHolePool()`の実行、時間経過による通常フェイズへの復帰処理（ステイシス解除、BGM再開）を実装。加えて、`PHASE_BLACK_EXIT` 完了時に `GameState.blackPhaseCount` と `GameState.whitePhaseCount` をそれぞれ加算する処理を追加。
  - `addPhaseGauge()`: ホワイトフェイズ中のブレイクゲージ増加処理において、`BLACK_GAUGE_ACQUISITION_DECAY_RATE` と `GameState.blackPhaseCount` を用いた減衰（0.8のべき乗）を適用するロジックを追加。
  - `enterBlackPhase()`: `PHASE_BLACK_ENTER` への移行処理。ブレイクゲージを1000（`GAUGE_MAX`）にセットし、`blackPhaseElapsedTime` をリセット。無限チェイン用変数を初期化。また、BGMのフェードアウト処理と、物理エンジンの `timeScale` を `0.0` へフェードさせるステイシス（時間停止）処理を追加。
  - `enterWhitePhase()`: ホワイトフェイズ突入時に `GameState.currentCrackSetKey` に `CRACK_SETS` からランダムなキーを設定。
  - `checkPhaseTransition()`: デバッグ等でゲージがMAXになった際の強制突入判定。
* **`js/core/logic.js`**
  - `pointerDownHandler()`: 処理の最上流でフェイズ判定を行い、画面のどこをタップしてもブレイクゲージの回復と特異点パルス付与のみを実行（ヒット判定・連鎖・破壊処理を完全にバイパス）。さらにタップ回復量に対して `BLACK_GAUGE_ACQUISITION_DECAY_RATE` と `GameState.blackPhaseCount` を用いた減衰補正を適用。
  - `beforeUpdateHandler()`: ブラックフェイズ中、特異点へ向かう引力（アトラクター）と吸い込み判定（事象の地平線）を追加。
  - `finalizeDestruction()`: ブラックフェイズ中の無限チェイン（累積破壊数）計算と、獲得EXP減衰なしのスコア算出・プール加算（`blackHolePooledScore`等）ロジックを追加。また、スコアの色別按分時に発生する端数を起点色（`startColorStr`）に寄せる（起点不在時は先頭色にフォールバックする）バグ修正を実施。
  - `flushBlackHolePool()`: 特異点によるプール分（スコア・EXP・LIFE）を一括で加算し、リザルト演出やレベルアップ判定を行う関数を新設。一括加算されたスコアがこれまでの最大スコアを超えた場合、1 TAP MAX SCORE の記録色を `'BLACK'` として更新する処理を追加。
* **`js/render/ResultRenderer.js`**
  - `drawSummary()`: 1 TAP MAX SCORE のアイコン描画処理を拡張。記録された色が `'BLACK'` または `'WHITE'` の場合、専用の黒・白アイコンを描画し、時間経過(`elapsed`)と `WHITE_PHASE_EFFECT_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED` を利用した虹色の発光（シャドウブラー）演出を適用。
* **`js/render/ScreenEffectTransition.js`**
  - `drawGlobalPostEffects()`: ブラックフェイズの突入（`PHASE_BLACK_ENTER`）および終了（`PHASE_BLACK_EXIT`）演出をフックするよう改修。
  - `drawPhaseBlackEnter()`: ブラックフェイズへの突入演出（ステイシス、トライバル展開と十字の黒色塗りつぶし、システムログ「BLACK RESURRECT」の表示と消去、暗転へのフェード）を描画。Canvasの重なり合成問題を回避するため、フェード時は単一黒円として描画。
  - `drawPhaseBlackExit()`: ブラックフェイズからの復帰演出（トライバル逆再生、システムログ表示、ホワイトワイプアウトによるパズル再表示）を描画する処理を新設。
* **`js/render/BackgroundManager.js`**
  - `constructor()` / `clear()`: 通常空間の星空 (`stars`) とは別に、ブラックフェイズ専用の吸い込み星空配列 (`blackStars`) を追加。
  - `update()`: ブラックフェイズ中は `blackStars` のみを中心への吸い込み（ワープ逆再生）ロジックで更新し、通常の `stars` は更新を停止して静止状態を維持する処理へ分離。
  - `draw()`: `PHASE_BLACK_EXIT` 中はブラックフェイズの背景を維持しつつ、終盤のワイプアウト（`GameState.isWhiteExitWipeOut`）時において、手前の特異点空間（黒背景、専用星空、特異点）の描画領域を `ctx.clip()` で制限（ワイプの穴の外側のみ描画）し、奥の通常星空が破綻なく入れ替わりで現れるトランジション描画順へ改修。
  - `drawStarrySky()`: 通常空間の静かな星空（円）描画のみを担当するよう仕様変更。
  - `drawBlackPhaseWarpStars()`: 新設。ブラックフェイズ専用のワープ星空（ストリーク長を持つ光の筋）の描画処理。
  - `_drawBlackHole()`: 新設。特異点の描画処理を独立したメソッドへ切り出し。
* **`js/render/ScreenEffectVignette.js`**
  - `constructor()`: 旧式のベクターヒビ割れ初期化を削除し、ブラックフェイズのスコアポップアップ状態を管理する `blackPopup` プロパティを追加。
  - `update()`: `PHASE_BLACK` 状態と同期して `blackPopup` を更新し、終了時にはアニメーションタイマー (`elapsed`) を進めるロジックを追加。
  - `drawFrontEffects()`: ベクターラインによる旧式のヒビ割れ描画を削除し、画像シーケンスと動的閾値による進行型のヒビ割れ演出を描画するよう改修（白グレアはキャッシュに焼き込み済みのため通常描画のみを行う）。
* **`js/render/DebugManager.js`**
  - `draw()`: デバッグウィンドウの表記を「Ｒゲージ」から「Ｂゲージ」に変更し、Ｓゲージと同等のリアルタイム情報（現在の値 / ＋加算値 (補正率) / −減算値/s / 回数）が表示されるよう描画ロジックを更新。
* **`js/render/SpriteCacheManager.js`**
  - `generateGemCaches()`: ブラックフェイズ専用の宝石キャッシュ生成ロジック（`isBlackPhase`）を追加。フラットスタイル以外の場合、元の宝石カラーを用いたハードライト（H.LIGHT）スタイルと同様の質感を重ね、暗転した画面上で宝石の光が強く沈むように調整。
  - `generateScoreCaches()`: ブラックフェイズの数式描画用に数式文字のキャッシュを追加。
  - `AssetManager.loadAssets()`: `CRACK_SETS` の画像シーケンスをロードしキャッシュする処理を追加。さらに画像ロード時に「輝度ベースのアルファ反転・黒統一処理」を行い、転写時に白グレア（ドロップシャドウ）を事前焼き付け（Pre-baking）するロジックを実装。焼き付け時は、段階的に Blur を変更しながら重ね描きする「多段マルチパス（Multi-pass）発光」により、細いヒビ割れの視認性と強い光漏れの両立を実現。
* **`js/core/config.js`**
  - `PHASE_SHIFT_MATH`: ブラックフェイズ用の減衰・回復パラメータ群を管理。`BLACK_DECAY_BASE` (100.0)、`BLACK_DECAY_ACCEL_COEFF` (20.0)、`BLACK_DECAY_TIME_DIVISOR` (10.0)、`BLACK_TAP_RESTORE` (20)、およびブレイクゲージ獲得量・タップ回復量のクリア回数減衰率 `BLACK_GAUGE_ACQUISITION_DECAY_RATE` (0.8) 等の設定により、適正な二次関数の加速減衰とUI描画を実現。
  - `SPAWN_CONFIG`: ブラックフェイズ専用の宝石補充確率（`SPAWN_RATE.BLACK` = 0.8）とインターバル（`SPAWN_INTERVAL_FRAMES.BLACK` = 10）を新設。
  - `GameState`: `blackHoleVisualPulse`, `breakGauge`, `blackHoleChainCount`, `currentCrackSetKey` (ヒビ割れ演出の現在のセットキー)、およびプール用変数 (`blackHolePooledScore`, `blackHolePooledExp`, `blackHolePooledLife`) を管理し、リセット処理を実装。加えて、ブラックフェイズ通過回数を記録する `blackPhaseCount` の初期化を追加。
  - `STARRYSKY_CONFIG`: アーキテクチャ整理のため `effectConfig.js` へ完全移行し、本ファイルからは削除。
* **`js/core/effectConfig.js`**
  - `BLACK_PHASE_EFFECT_CONFIG`: 特異点の最大/最小半径を定義。引力と吸い込み半径を定義。スコアポップアップのパラメータを統合。画像シーケンスによるヒビ割れ演出設定 `CRACK_SETS` を追加（視認性向上のための白グレア設定も含む）。さらに突入時のトライバル展開・塗りつぶし等のアニメーション設定（`TRIBAL_WEIGHTS`, `FINISH`, `TRIBAL_GAP`等）および、復帰時（`PHASE_BLACK_EXIT`）の `STASIS_DELAY_MS`, `TRIBAL_TOTAL_MS`, `TRANSITION_OUT_WIPE_MS` 等の設定、システムログ演出の設定（`LOG_TIMINGS`, `LOG_TOTAL_MS`等）を定義。
  - `STARRYSKY_CONFIG`: `config.js` から移行。ブラックフェイズ用の特異点吸い込み基本速度 (`BLACK_HOLE_SUCTION_SPEED_BASE`)、加速度 (`BLACK_HOLE_SUCTION_ACCEL`)、ワープストリーク長係数 (`STREAK_LENGTH_MULTIPLIER`) を新規追加し、星空エフェクトの定数を統合。

## 2. ブラックフェイズ概要とステート遷移
* **発動条件**: ホワイトフェイズ中に蓄積される「ブレイクゲージ」が1000（`GAUGE_MAX`）に達すること。
* **遷移フロー**:
  1. `PHASE_BLACK_ENTER`: BGMフェードアウトと画面暗転。ブレイクゲージは1000からスタート。
  2. `PHASE_BLACK`: 特異点が出現。時間経過でブレイクゲージが減少（動的加速減衰）。タップでゲージを回復（延命）可能。
  3. `PHASE_BLACK_EXIT`: ブレイクゲージが0（ブラックホール極小化）になると移行。溜め込んだプール分のスコア等（`flushBlackHolePool`）を一括でフラッシュし、トライバル逆再生とホワイトワイプアウトを経て明転し、通常フェイズへ復帰。

## 3. 数式・減衰モデルの定義
* **減衰ロジック**: ホワイトフェイズと同様の二次関数的な加速減衰。
  `(BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * (t / TIME_DIVISOR)^POWER)` （※ t はブラックフェイズ専用の経過時間タイマー `blackPhaseElapsedTime` に基づく）
  また、ブラックフェイズの通過回数（`blackPhaseCount`）に応じて、ブレイクゲージの獲得量およびタップ回復量が `BLACK_GAUGE_ACQUISITION_DECAY_RATE` (0.8) の累乗で動的に減衰するサバイバル機構を持つ。
* **寿命の可視化**: ブレイクゲージの残量（0〜1000）がそのままブラックホールの半径（1px 〜 100px）に直結し、視覚的な寿命のインジケーターとして機能する。
* **スコア計算モデル**: 特異点による宝石破壊時の獲得EXPはチェイン数による減衰なしの等倍（100%）。獲得スコアは演出上の計算式として `RATE x √(チェイン数-2) ^ 2` （実質的に `基本RATE * (チェイン数 - 2)` に等価）として算出され、無限チェインとして加算され続ける。
* **補充制御モデル**: 処理負荷の抑制および枯渇に向かわせるため、ブラックフェイズ中の宝石補充確率は `0.8`（`SPAWN_RATE.BLACK`）、補充判定インターバルは10フレームに1回（`SPAWN_INTERVAL_FRAMES.BLACK`）に制限される。

## 4. 操作ロジックと描画の仕組み
* **操作ガード**: `logic.js` の最上流で状態を検知し、パズルとしての宝石破壊やダメージ処理を完全にキャンセルする。
* **描画レイヤー**: 最奥の背景（Layer 1）に暗転と特異点を描画。さらにその前面（Layer 5等）にブレイクゲージと連動したフラクタルヒビ割れが描画される。

## 5. オーディオ・時間制御（ステイシス）の仕様
* **BGM**: 突入時（`PHASE_BLACK_ENTER`）にBGMがフェードアウトする。フェイズ移行完了時（`PHASE_BLACK`）に専用の崩壊BGMが再生される。
* **ステイシス（時間停止）**: 突入演出中は物理エンジンの `timeScale` を `0.0` へフェードさせ、パズルを一時停止（`GameState.isPuzzlePaused = true`）させる。
* **物理挙動**: 演出完了後のフェイズ中（`PHASE_BLACK`）は、ステイシスが解除され物理エンジン自体は動作を継続する（`GameState.isPuzzlePaused = false`）ため、特異点が発生している最中も宝石の物理挙動は生きている。

## 6. 今後の実装予定（To-Do）
* 特異点でのアーティファクト攻防システムの追加

## 7. 物理エンジン連動のフックポイント（拡張準備）
* **宝石の吸い込み**: `physics.js` の `beforeUpdate` イベント（または `PhaseManager.update` 内）から、`PHASE_BLACK` 時のみ全 `gem` ボディに対して画面中央へ向かう力 (`Body.applyForce`) を継続的に加えるアプローチが有効。

## 8. 他資料への転記予定リスト（作業完了時に実施）
後日、ブラックフェイズの実装が最終段階に入った際に、本資料から以下の基本ドキュメントへ内容を移植・統合する。
* **`PROJECT_FUNCTION_INDEX.md`**: `PhaseManager.js`, `logic.js` 等の関数一覧の更新。
* **`PROJECT_MATH_AND_BALANCE.md`**: ブラックフェイズ独自の動的減衰式、タップ回復量の仕様追記。
* **`PROJECT_EFFECT.md`**: ブラックフェイズ中のヒビ割れやブラックホールの描画仕様。
* **`PROJECT_GLOSSARY_AND_GAMEDESIGN.md`**: 特異点とブラックフェイズの正式なルール定義。
