# ブラックフェイズ中の背景星空吸い込み（ワープ逆再生）演出の実装

ブラックフェイズ（`PHASE_BLACK_ENTER`, `PHASE_BLACK`）における、背景星空（第1層）が特異点に吸い込まれる「ワープ逆再生」演出の実装計画です。

## User Review Required

> [!IMPORTANT]
> 定数の追加先について確認です。
> 指示書では「`effectConfig.js` への定数追加（`STARRYSKY_CONFIG` または該当する定数群内に）」とありましたが、現在の実装では `STARRYSKY_CONFIG` は `js/core/config.js` に存在しています。
> そのため、本計画では `js/core/config.js` 内の `STARRYSKY_CONFIG` に対してパラメータを追加する方針としますが、よろしいでしょうか？

## Proposed Changes

### js/core/config.js

`STARRYSKY_CONFIG` に以下のパラメータを追加します。
* `BLACK_HOLE_SUCTION_SPEED_BASE`: 吸い込みの基本速度（通常より高めの値、例えば `5.0` など）
* `BLACK_HOLE_SUCTION_ACCEL`: 中心に近づくほど加速する係数（例えば `2.0` など）
* `STREAK_LENGTH_MULTIPLIER`: 光の筋の長さ強調係数（例えば `3.0` など）

### js/render/BackgroundManager.js

#### `update` メソッドの改修
* `PhaseManager.getCurrentPhaseName()` が `PHASE_BLACK_ENTER` または `PHASE_BLACK` か判定します。
* 毎フレーム、星（`star`）オブジェクトに `star.prevDistance = star.distance` として1フレーム前の距離を保存させます。
* ブラックフェイズ中なら、星の距離（`star.distance`）を中心へ向かってマイナス加算します。
  * この際の速度は `STARRYSKY_CONFIG.BLACK_HOLE_SUCTION_SPEED_BASE` に、中心距離の逆数ベースの加速係数（`BLACK_HOLE_SUCTION_ACCEL`による）を掛け合わせます。
  * `GameState.blackHoleVisualPulse` （タップ時の脈動値）を用いて速度を瞬間的に増幅（ギュンと吸い込まれる演出）させます。
* 星が中心（ブラックホール半径内等）に吸い込まれきった場合は、`this._initStar` を呼んで再生成し、初期距離を画面外周（`maxDist`）に上書きして無限吸い込みループを構築します。
* 通常フェイズの場合は既存の「外側へ向かう」ロジックを維持します。

#### `drawStarrySky` メソッドの改修
* ブラックフェイズ中の場合、星の描画を `arc` (円) から、`moveTo` / `lineTo` を用いた「光の筋（ストリーク）」の描画へ切り替えます。
* 線は `star.prevDistance` （および `STREAK_LENGTH_MULTIPLIER` による長短補正をかけた座標）から、現在の `star.distance` の座標に向かって引きます。
* 線の太さは `star.size` ベースで調整し、`AppConfig.EFFECT_LEVEL` が 'FULL' 以上（または 'LITE' でも許容範囲内であれば）の場合は、`shadowBlur` と `shadowColor` を付与して眩しく発光させます。
* 通常フェイズ時は既存の `arc` による円の描画を維持します。

## Verification Plan

### Manual Verification
* ゲームを起動し、ホワイトフェイズを経由してブラックフェイズ（ブレイクゲージMAX）に突入させる。
* ブラックフェイズ突入演出（暗転）中およびフェイズ本編において、背景の星が中心に向かって吸い込まれることを確認する。
* タップ（特異点の脈動）時に、吸い込み速度が瞬間的に加速すること（ギュンと吸い込まれる手触り）を確認する。
* 吸い込まれた星が再び画面外周から出現し、無限ループが破綻しないことを確認する。
* 星の描画が点（円）ではなく、光の筋（ストリーク）となっており、発光処理（FULL時）が正しく適用されていることを確認する。
