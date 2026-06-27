# 実装指示書：ヒビ割れアセットの自動透過処理（ルミナンス・キー）と白グレアの適用

画像アセットの再制作負担をゼロにしつつ、黒背景時におけるヒビ割れの白グレア演出を実現するため、`SpriteCacheManager`にて画像ロード時に「白背景を自動で透過（アルファ）に変換する」事前処理を実装せよ。

## 1. SpriteCacheManager への自動透過処理（ピクセル操作）の追加
`SpriteCacheManager.js`（またはアセットロード完了後のキャッシュ構築処理）にて、ヒビ割れ画像（`CRACK_SETS`の画像）をキャッシュ用Canvasへ変換する際、以下の「輝度アルファ反転」ロジックを適用せよ。

```javascript
// 【変換ロジック要件（getImageData使用）】
// 1. 画像をオフスクリーンCanvasに描画し、getImageDataでピクセル配列(RGBA)を取得。
// 2. 全ピクセルをループし、輝度（brightness）を算出: const brightness = (R + G + B) / 3;
// 3. 新しいアルファ値(A)を `255 - brightness` に設定（白は完全透明、黒は不透明になる）。
// 4. 新しいRGB値はすべて `0` （純粋な黒）に上書きし、ヒビの色を統一する。
// 5. putImageData でCanvasへ戻し、これを最終的なキャッシュとして保持する。
2. コンフィグと描画処理の更新（グレア適用）
js/core/effectConfig.js のクラックテクスチャセットにおいて、設定を以下のように更新せよ。
compositeOp を "multiply" から "source-over" （通常合成）に変更。
glowColor: "rgba(255, 255, 255, 0.6)" （白グレアの色）を追加。
glowBlur: 15 （発光の拡散具合）を追加。
js/render/ScreenEffectVignette.js の描画処理にて、ヒビを描画する ctx.drawImage の直前に以下の設定を適用せよ。
ctx.shadowColor = set.glowColor;
ctx.shadowBlur = set.glowBlur;
※描画後は必ず shadowColor = "transparent", shadowBlur = 0 にリセットすること。
