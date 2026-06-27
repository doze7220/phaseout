# ブラックフェイズ（特異点崩壊）アーキテクチャ・実装状況

## 1. 変更ファイルと対象関数一覧（インデックス）
* **`js/core/PhaseManager.js`**
  - `init()`: `blackPhaseElapsedTime`（ブラックフェイズ専用タイマー）の初期化処理を追加。
  - `update()`: ブレイクゲージの時間減衰ロジック（`BLACK_DECAY_BASE` 等を用いた動的加速減衰）。通常フェイズの減衰との排他制御を明確化し、`blackPhaseElapsedTime` を用いて二次関数的な時間加速減衰を正しく計算するように修正。
  - `enterBlackPhase()`: `PHASE_BLACK_ENTER` への移行処理。ブレイクゲージを1000（`GAUGE_MAX`）にセットし、`blackPhaseElapsedTime` をリセット。無限チェイン用変数を初期化。また `GameState.currentCrackSetKey` に `CRACK_SETS` からランダムなキーを設定。
  - `enterWhitePhase()`: ホワイトフェイズ突入時に `GameState.currentCrackSetKey` に `CRACK_SETS` からランダムなキーを設定。
  - `checkPhaseTransition()`: デバッグ等でゲージがMAXになった際の強制突入判定。
* **`js/core/logic.js`**
  - `pointerDownHandler()`: 処理の最上流でフェイズ判定を行い、画面のどこをタップしてもブレイクゲージの回復と特異点パルス付与のみを実行（ヒット判定・連鎖・破壊処理を完全にバイパス）。
  - `beforeUpdateHandler()`: ブラックフェイズ中、特異点へ向かう引力（アトラクター）と吸い込み判定（事象の地平線）を追加。
  - `finalizeDestruction()`: ブラックフェイズ中の無限チェイン（累積破壊数）計算と、獲得EXP減衰なしのスコア算出・プール加算（`blackHolePooledScore`等）ロジックを追加。
  - `flushBlackHolePool()`: 特異点によるプール分（スコア・EXP・LIFE）を一括で加算し、リザルト演出やレベルアップ判定を行う関数を新設。
* **`js/render/ScreenEffectVignette.js`**
  - `constructor()`: 旧式のベクターヒビ割れ初期化を削除し、ブラックフェイズのスコアポップアップ状態を管理する `blackPopup` プロパティを追加。
  - `update()`: `PHASE_BLACK` 状態と同期して `blackPopup` を更新し、終了時にはアニメーションタイマー (`elapsed`) を進めるロジックを追加。
  - `drawFrontEffects()`: ベクターラインによる旧式のヒビ割れ描画を削除し、画像シーケンスと動的閾値による進行型のヒビ割れ演出を描画するよう改修（白グレアはキャッシュに焼き込み済みのため通常描画のみを行う）。
  - `drawInGamePostEffects()`: 特異点（ブラックホール）の描画。ブレイクゲージ量に比例した半径の拡縮とパルス加算。終了時のアニメーション等を実装。
* **`js/render/SpriteCacheManager.js`**
  - `generateScoreCaches()`: ブラックフェイズの数式描画用に数式文字のキャッシュを追加。
  - `AssetManager.loadAssets()`: `CRACK_SETS` の画像シーケンスをロードしキャッシュする処理を追加。さらに画像ロード時に「輝度ベースのアルファ反転・黒統一処理」を行い、転写時に白グレア（ドロップシャドウ）を事前焼き付け（Pre-baking）するロジックを実装。焼き付け時は、段階的に Blur を変更しながら重ね描きする「多段マルチパス（Multi-pass）発光」により、細いヒビ割れの視認性と強い光漏れの両立を実現。
* **`js/core/config.js`**
  - `PHASE_SHIFT_MATH`: ブラックフェイズ用の減衰・回復パラメータ群を管理。`BLACK_DECAY_BASE` (100.0)、`BLACK_DECAY_ACCEL_COEFF` (20.0)、`BLACK_DECAY_TIME_DIVISOR` (10.0)、`BLACK_TAP_RESTORE` (20) 等の設定により、適正な二次関数の加速減衰とUI描画を実現。
  - `SPAWN_CONFIG`: ブラックフェイズ専用の宝石補充確率（`SPAWN_RATE.BLACK`）とインターバル（`SPAWN_INTERVAL_FRAMES.BLACK`）を新設。
  - `GameState`: `blackHoleVisualPulse`, `breakGauge`, `blackHoleChainCount`, `currentCrackSetKey` (ヒビ割れ演出の現在のセットキー)、およびプール用変数 (`blackHolePooledScore`, `blackHolePooledExp`, `blackHolePooledLife`) を管理し、リセット処理を実装。
* **`js/core/effectConfig.js`**
  - `BLACK_PHASE_EFFECT_CONFIG`: 特異点の最大/最小半径を定義。引力と吸い込み半径を定義。スコアポップアップのパラメータを統合。旧式のベクター描画用パラメータを削除し、画像シーケンスによるヒビ割れ演出設定 `CRACK_SETS` を追加（視認性向上のための白グレア設定も含む）。

## 2. ブラックフェイズ概要とステート遷移
* **発動条件**: ホワイトフェイズ中に蓄積される「ブレイクゲージ」が1000（`GAUGE_MAX`）に達すること。
* **遷移フロー**:
  1. `PHASE_BLACK_ENTER`: BGMフェードアウトと画面暗転。ブレイクゲージは1000からスタート。
  2. `PHASE_BLACK`: 特異点が出現。時間経過でブレイクゲージが減少（動的加速減衰）。タップでゲージを回復（延命）可能。
  3. `PHASE_BLACK_EXIT`: ブレイクゲージが0（ブラックホール極小化）になると移行。明転して通常フェイズへ復帰。

## 3. 数式・減衰モデルの定義
* **減衰ロジック**: ホワイトフェイズと同様の二次関数的な加速減衰。
  `(BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * (t / TIME_DIVISOR)^POWER)` （※ t はブラックフェイズ専用の経過時間タイマー `blackPhaseElapsedTime` に基づく）
* **寿命の可視化**: ブレイクゲージの残量（0〜1000）がそのままブラックホールの半径（1px 〜 100px）に直結し、視覚的な寿命のインジケーターとして機能する。
* **スコア計算モデル**: 特異点による宝石破壊時の獲得EXPはチェイン数による減衰なしの等倍（100%）。獲得スコアは演出上の計算式として `RATE x √(チェイン数-2) ^ 2` （実質的に `基本RATE * (チェイン数 - 2)` に等価）として算出され、無限チェインとして加算され続ける。
* **補充制御モデル**: 処理負荷の抑制および枯渇に向かわせるため、ブラックフェイズ中の宝石補充確率は `0.5`（`SPAWN_RATE.BLACK`）、補充判定インターバルは15フレームに1回（`SPAWN_INTERVAL_FRAMES.BLACK`）に制限される。

## 4. 操作ロジックと描画の仕組み
* **操作ガード**: `logic.js` の最上流で状態を検知し、パズルとしての宝石破壊やダメージ処理を完全にキャンセルする。
* **描画レイヤー**: UIの背面・宝石の前面（Layer 6等）に暗転と特異点を描画。さらにその前面（Layer 5等）にブレイクゲージと連動したフラクタルヒビ割れが描画される。

## 5. オーディオ・時間制御（ステイシス）の仕様
* 突入時にBGMがフェードアウトする。
* 物理エンジン自体は動作を継続する（`GameState.isPuzzlePaused = false`）ため、フェイズ中でも宝石の物理挙動は生きている。

## 6. 今後の実装予定（To-Do）
* 専用のホラーログ演出・システムテキストのグリッチ演出
* 特異点でのアーティファクト攻防システムの追加

## 7. 物理エンジン連動のフックポイント（拡張準備）
* **宝石の吸い込み**: `physics.js` の `beforeUpdate` イベント（または `PhaseManager.update` 内）から、`PHASE_BLACK` 時のみ全 `gem` ボディに対して画面中央へ向かう力 (`Body.applyForce`) を継続的に加えるアプローチが有効。

## 8. 他資料への転記予定リスト（作業完了時に実施）
後日、ブラックフェイズの実装が最終段階に入った際に、本資料から以下の基本ドキュメントへ内容を移植・統合する。
* **`PROJECT_FUNCTION_INDEX.md`**: `PhaseManager.js`, `logic.js` 等の関数一覧の更新。
* **`PROJECT_MATH_AND_BALANCE.md`**: ブラックフェイズ独自の動的減衰式、タップ回復量の仕様追記。
* **`PROJECT_EFFECT.md`**: ブラックフェイズ中のヒビ割れやブラックホールの描画仕様。
* **`PROJECT_GLOSSARY_AND_GAMEDESIGN.md`**: 特異点とブラックフェイズの正式なルール定義。
