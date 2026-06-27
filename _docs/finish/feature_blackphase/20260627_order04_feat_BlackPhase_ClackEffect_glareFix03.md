# 実装指示書：白グレアの「事前焼き付け（Pre-baked）」キャッシュへの移行

ブラウザのGPUアクセラレーションによるフルスクリーンCanvasのシャドウ描画スキップバグを完全に回避し、同時に毎フレームの描画負荷を劇的に軽減するため、白グレア（ドロップシャドウ）の付与を「毎フレームの描画時」ではなく「キャッシュ生成時の転写プロセス」にてテクスチャに直接焼き付ける（Pre-baking）仕様へ変更せよ。

## 1. SpriteCacheManager へのシャドウ事前焼き付け実装
`SpriteCacheManager.js` 内のルミナンス変換後に行うダブルバッファリング（CanvasA -> CanvasBへの転写）処理において、CanvasBへ転写する際にシャドウを適用し、画像として完全に焼き付けよ。

```javascript
// 【転写処理の修正要件】
// 1. コンフィグ（CRACK_SETS）から対象の glowColor と glowBlur を取得する。
// 2. 転写先である CanvasB のコンテキスト（ctxB）に対し、以下を設定する。
//    ctxB.shadowColor = set.glowColor;
//    ctxB.shadowBlur = set.glowBlur;
// 3. 【発光のオーバードライブ】白グレアをより強烈に発光させるため、
//    ctxB.drawImage(CanvasA, 0, 0) を「3回」連続で実行し、光を重ねて焼き付ける。
// 4. 転写完了後、他への影響を防ぐため ctxB.shadowColor = "transparent"; ctxB.shadowBlur = 0; でリセットする。
// 5. このシャドウが焼き付けられた CanvasB を最終キャッシュとして保持する。
2. 毎フレーム描画からのリアルタイムシャドウ処理の削除
js/render/ScreenEffectVignette.js （または該当の描画処理）にて追加されていた、ヒビ描画直前の ctx.shadowColor および ctx.shadowBlur の動的設定・リセット処理を完全に削除せよ。
（既にキャッシュ画像にグレアが焼き込まれているため、通常の source-over で drawImage するだけで自動的に影付きとして描画される）