# 実装指示書：ヒビ割れ演出への白グレア（環境適応型グロー）の追加

黒背景時におけるヒビ割れの視認性を向上させ、「空間の裂け目から光が漏れる」演出を表現するため、Canvasのドロップシャドウ機能を用いた白グレア（発光）を動的に追加せよ。

## 1. コンフィグ（CRACK_SETS）の拡張
`js/core/effectConfig.js` のテクスチャセット定義において、設定を以下のように更新・追加せよ。
*   `compositeOp` を `"multiply"` から `"source-over"` （通常合成）に変更する。（※乗算モードでは白い影が見えなくなるため）
*   `glowColor: "rgba(255, 255, 255, 0.6)"` （白グレアの色と透明度）を追加する。
*   `glowBlur: 15` （発光の拡散具合）を追加する。

## 2. 描画処理へのグロー（影）適用の追加
`js/render/ScreenEffectVignette.js` 等における、ヒビ割れ画像シーケンスの `ctx.drawImage` 実行直前のコンテキスト（`ctx`）に対し、以下の設定を適用せよ。
*   `ctx.shadowColor = set.glowColor;`
*   `ctx.shadowBlur = set.glowBlur;`
*   ※画像描画後（または `ctx.restore()` 時）に、必ず他の描画への汚染を防ぐため、`ctx.shadowColor = "transparent"` および `ctx.shadowBlur = 0` にリセットする（コンテキストの保護）。

