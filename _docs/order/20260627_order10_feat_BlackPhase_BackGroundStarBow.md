# 実装指示書：ブラックフェイズ中の背景星空の吸い込み（ワープ逆再生）演出の実装

ブラックフェイズ（PHASE_BLACK_ENTER, PHASE_BLACK）中において、第1層の背景星空（BackgroundManager.js）が特異点に吸い込まれる「光を飲み込むワープ表現」を実装せよ。

## 1. effectConfig.js への定数追加
星空の設定オブジェクト（`STARRYSKY_CONFIG` または該当する定数群）内に、ブラックフェイズ専用の以下のパラメータを追加せよ。
*   `BLACK_HOLE_SUCTION_SPEED_BASE`: 吸い込みの基本速度（通常の星の移動速度よりかなり速めに設定すること）。
*   `BLACK_HOLE_SUCTION_ACCEL`: 中心に近づくほど加速する係数。
*   `STREAK_LENGTH_MULTIPLIER`: 光の筋（残像）の長さ係数。

## 2. 星の更新ロジックの改修 (BackgroundManager.js / update)
`update` メソッド内での星の座標（距離）更新ロジックを以下のように改修せよ。
*   `PhaseManager.getCurrentPhase()` が `PHASE_BLACK_ENTER` または `PHASE_BLACK` の場合、星の進行方向（ベクトル）を逆転させ、中心へ向かってマイナス加算する。
*   速度は中心に近づくほど速くなるよう重力加速度的な計算を入れ、さらに `GameState.blackHoleVisualPulse` （特異点の脈動）の値を速度に乗算して、タップ時に星がギュンと吸い込まれる手触りを作ること。
*   星の距離が中心付近（ブラックホールの半径内など）に到達して吸い込まれきった場合、`_initStar` を呼び出して再生成する。この際、初期距離を「画面外周（非常に遠く）」に設定し、外から中への無限吸い込みループを形成すること。

## 3. 「光の筋」のワープ描画ロジック (BackgroundManager.js / drawStarrySky)
星を描画する際、ブラックフェイズ中は単なる円（`arc`）として描くのではなく、ワープのような「光を飲み込む筋」として描画せよ。
*   星オブジェクト内に「1フレーム前の距離（旧座標）」を保持させる。
*   描画時は、旧座標から現在の座標に向かって `beginPath() -> moveTo() -> lineTo() -> stroke()` で線を引く。
*   速度が速い星ほど長い線（ストリーク）となり、光が引き伸ばされているように見せること（線の太さや透明度も適切に設定すること）。
*   EFFECT_LEVEL が 'FULL' 以上の場合は、`shadowBlur` と `shadowColor` を用いて光の筋が眩しく発光しているような処理を加えること。
