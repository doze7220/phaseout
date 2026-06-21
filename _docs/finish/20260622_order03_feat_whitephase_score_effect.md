# 実装指示書：ホワイトフェイズ中のスコアポップアップ演出強化（虹色オーバードライブ）

## 目的
ホワイトフェイズ中の「スコア3乗化インフレ」による異常な熱狂を表現するため、「滑らかな虹色（HSL）の色相変化」による後光（グレア）演出を実装する。

## 変更対象ファイル
*   `js/core/config.js` (定数の追加)
*   `js/render/ScreenEffectPopup.js` (スコア描画処理へのエフェクト追加)

## 実装手順

### 1. 定数の定義 (`config.js`)
*   `EFFECT_MATH_CONFIG` 内に、ホワイトフェイズのスコア演出用定数として以下を定義する。
    *   `WHITE_SCORE_GLOW`: `{ BLUR: 15, HUE_SPEED: 0.5 }`
    *   ※滑らかな色相変化速度と、後光の強さを定義する。

### 2. スコアCanvasへの虹色グレア適用（`ScreenEffectPopup.js`）
*   `drawPopups` メソッド内などの、スコアポップアップを描画している処理を改修する。
*   `PhaseManager.isWhitePhase()` が `true` の場合、スコアCanvas（白文字）と、スコア計算式の乗算部分を描画する前後に以下の設定を適用する。
    1.  `ctx.save()` でコンテキストを保護。
    2.  ポップアップの経過時間 `elapsed` を利用して色相（Hue）を計算する。
        `const hue = Math.floor(popup.elapsed * EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360;`
    3.  `ctx.shadowColor = 'hsl(' + hue + ', 100%, 60%)';` とし、純彩色の虹色を設定。
    4.  `ctx.shadowBlur = EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.BLUR;` で発光幅を設定。
    5.  `ctx.globalCompositeOperation = 'lighter';` （加算合成）を設定し、発光を強調する。
    6.  通常通り、生成済みのスコアCanvasを `ctx.drawImage` で描画する。（これにより、純白の文字の背後から、滑らかに色を変える虹色のオーラが放たれる）
    7.  `ctx.restore()` でコンテキストを元に戻す。

## 前提条件・アーキテクチャ厳守
*   マジックナンバーは必ず `config.js` へ抽出すること。
*   点滅（フリッカー）表現は絶対に使用しないこと。必ず滑らかな色相変化とすること。
