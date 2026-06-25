# ブラックフェイズ（特異点崩壊）アーキテクチャ・実装状況

## 1. 変更ファイルと対象関数一覧（インデックス）
* **`js/core/PhaseManager.js`**
  - `update()`: ブレイクゲージの時間減衰ロジック（`BLACK_DECAY_BASE` 等を用いた動的加速減衰）。
  - `enterBlackPhase()`: `PHASE_BLACK_ENTER` への移行処理。ブレイクゲージを1000（`GAUGE_MAX`）にセット。また、無限チェイン用の `blackHoleChainCount` を初期化。
  - `checkPhaseTransition()`: デバッグ等でゲージがMAXになった際の強制突入判定。
* **`js/core/logic.js`**
  - `pointerDownHandler()`: フェイズ中は連鎖・ブロック破壊を無効化し、ブレイクゲージのタップ回復と特異点パルス付与のみを実行。
  - `beforeUpdateHandler()`: ブラックフェイズ中、特異点へ向かう引力（アトラクター）と吸い込み判定（事象の地平線）を追加。
  - `finalizeDestruction()`: ブラックフェイズ中の無限チェイン（累積破壊数）計算と、獲得EXP減衰なしのスコア算出ロジックを追加。
* **`js/render/ScreenEffectVignette.js`**
  - `drawInGamePostEffects()`: 特異点（ブラックホール）の描画。ブレイクゲージ量に比例した半径の拡縮とパルス加算。
* **`js/core/config.js`**
  - `PHASE_SHIFT_MATH`: `BLACK_DECAY_BASE`, `BLACK_DECAY_ACCEL_COEFF`, `BLACK_TAP_RESTORE` 等の減衰・回復パラメータを新設。
  - `GameState`: `blackHoleVisualPulse` (タップ時の膨張量), `breakGauge` (寿命の基準), `blackHoleChainCount` (無限チェイン数) を管理。
* **`js/core/effectConfig.js`**
  - `BLACK_PHASE_EFFECT_CONFIG`: 特異点の最大/最小半径 (`BLACK_HOLE_RADIUS_MAX` 等) を定義。`BLACK_HOLE` 内に引力 (`ATTRACTOR_FORCE`) と吸い込み半径 (`EVENT_HORIZON_RADIUS`) を定義。

## 2. ブラックフェイズ概要とステート遷移
* **発動条件**: ホワイトフェイズ中に蓄積される「ブレイクゲージ」が1000（`GAUGE_MAX`）に達すること。
* **遷移フロー**:
  1. `PHASE_BLACK_ENTER`: BGMフェードアウトと画面暗転。ブレイクゲージは1000からスタート。
  2. `PHASE_BLACK`: 特異点が出現。時間経過でブレイクゲージが減少（動的加速減衰）。タップでゲージを回復（延命）可能。
  3. `PHASE_BLACK_EXIT`: ブレイクゲージが0（ブラックホール極小化）になると移行。明転して通常フェイズへ復帰。

## 3. 数式・減衰モデルの定義
* **減衰ロジック**: ホワイトフェイズと同様の二次関数的な加速減衰。
  `(BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * (t / TIME_DIVISOR)^POWER)`
* **寿命の可視化**: ブレイクゲージの残量（0〜1000）がそのままブラックホールの半径（1px 〜 100px）に直結し、視覚的な寿命のインジケーターとして機能する。

## 4. 操作ロジックと描画の仕組み
* **操作ガード**: `logic.js` の最上流で状態を検知し、パズルとしての宝石破壊やダメージ処理を完全にキャンセルする。
* **描画レイヤー**: UIの背面・宝石の前面（Layer 6等）に暗転と特異点を描画。さらにその前面（Layer 5等）にブレイクゲージと連動したフラクタルヒビ割れが描画される。

## 5. オーディオ・時間制御（ステイシス）の仕様
* 突入時にBGMがフェードアウトする。
* 物理エンジン自体は動作を継続する（`GameState.isPuzzlePaused = false`）ため、フェイズ中でも宝石の物理挙動は生きている。

## 6. 今後の実装予定（To-Do）
* 専用のホラーログ演出・システムテキストのグリッチ演出
* 特異点でのアーティファクト攻防システムの追加
* テクスチャ画像への差し替え、演出の大幅なリッチ化

## 7. 物理エンジン連動のフックポイント（拡張準備）
* **宝石の吸い込み**: `physics.js` の `beforeUpdate` イベント（または `PhaseManager.update` 内）から、`PHASE_BLACK` 時のみ全 `gem` ボディに対して画面中央へ向かう力 (`Body.applyForce`) を継続的に加えるアプローチが有効。

## 8. 他資料への転記予定リスト（作業完了時に実施）
後日、ブラックフェイズの実装が最終段階に入った際に、本資料から以下の基本ドキュメントへ内容を移植・統合する。
* **`PROJECT_FUNCTION_INDEX.md`**: `PhaseManager.js`, `logic.js` 等の関数一覧の更新。
* **`PROJECT_MATH_AND_BALANCE.md`**: ブラックフェイズ独自の動的減衰式、タップ回復量の仕様追記。
* **`PROJECT_EFFECT.md`**: ブラックフェイズ中のヒビ割れやブラックホールの描画仕様。
* **`PROJECT_GLOSSARY_AND_GAMEDESIGN.md`**: 特異点とブラックフェイズの正式なルール定義。
