# 実装指示書: フェイズ4.1 Whiteout Pressure（フェイズシフト予兆の背景白化）

## 目標
`BackgroundManager.js` を拡張し、シフトゲージの蓄積をより明確にプレイヤーへ伝えるための「背景白化（UIとしての予兆）」演出を追加する。
ゲージが50%を超えると背景の最奥から徐々に純白が滲み出し、100%に近づくにつれて発生中の波紋（PrismFluctuation）が白背景に溶け込んでいく「熱的死のプレッシャー」を表現する。

## 実装ステップ

### 1. [MODIFY] `js/render/BackgroundManager.js` の描画ロジック追加
`updateAndDraw` メソッド（またはそれに準ずるメイン描画ループ）内において、描画順序を以下の「3層構造」になるように「白化フィルター」の描画処理を挿入してください。

**【厳守すべき描画順序】**
1. 星空の描画（`drawStarrySky`等、既存の最奥処理）
2. **【新規追加】白化フィルターの描画（Whiteout Pressure）**
3. 波紋の描画（`drawPrismFluctuations`等、既存の手前処理）

**【白化フィルターの計算と描画ロジック】**
*   `PhaseManager.getGaugeRatio()` で現在のゲージ割合（`gaugeRatio`: 0.0 〜 1.0）を取得する。
*   `gaugeRatio` が `0.5` を超えている場合のみ、以下のアルファ値（透明度）を計算する。
    `let whiteAlpha = Math.max(0, (gaugeRatio - 0.5) * 2);`
*   計算した `whiteAlpha` を用いて、Canvas全体を純白で塗りつぶす。
    `ctx.fillStyle = \`rgba(255, 255, 255, ${whiteAlpha})\`;`
    `ctx.fillRect(0, 0, Canvas幅, Canvas高さ);`

## 実行にあたっての厳守事項
* バージョンは vXX.YY.ZZ のうち、ZZ をカウントアップすること。
*   既存の PrismFluctuation（波紋）の脱色ロジックや、星空の描画ロジックには一切触れないこと。単にその間に「塗りつぶし」のレイヤーを追加するのみとする。
*   作業終了時に `changelog.js` 等に最新の変更を反映すること。