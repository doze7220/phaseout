# 実装指示書：ヒビ割れ白グレアの「多段マルチパス（Multi-pass）発光」への最適化

細いヒビ割れラインに白グレアが乗らない問題（shadowBlurの過剰拡散によるアルファ値の減衰）を解決し、すべてのラインで均一かつ力強い発光を実現するため、キャッシュ事前焼き付け時の描画ロジックを「OSCILLOモードで用いた多段パス構造」へ改修せよ。

## 1. SpriteCacheManager への多段シャドウ実装
`SpriteCacheManager.js` 内のCanvasBへの転写・焼き付け処理において、同一の `shadowBlur` で3回ループしていた描画処理を破棄し、以下のように `shadowBlur` の値を段階的に変化（小〜大）させながら描画（drawImage）を重ねる方式へ変更せよ。

```javascript
// 【修正要件（転写プロセスの多段化イメージ）】
ctxB.shadowColor = set.glowColor;

// パス1：極細の鋭い光の芯（元のグレアサイズの 1/5・切り上げ）
ctxB.shadowBlur = Math.ceil(set.glowBlur / 5);
ctxB.drawImage(CanvasA, 0, 0);
ctxB.drawImage(CanvasA, 0, 0); // 細い線は光が飛びやすいため2回重ねて定着させる

// パス2：中間層のベース発光（元のグレアサイズの 1/2・切り上げ）
ctxB.shadowBlur = Math.ceil(set.glowBlur / 2);
ctxB.drawImage(CanvasA, 0, 0);

// パス3：太く拡散するオーラ（元々のグロウ設定値）
ctxB.shadowBlur = set.glowBlur; // (デフォルト15等)
ctxB.drawImage(CanvasA, 0, 0);
※上記のように、Blur値を小さくして「光の芯」を作ることで、ピクセル数の少ない細いヒビにも強烈な白グレアが定着するようになる。数値や回数は描画結果を見て微調整して構わない。
