# RICHスタイルの宝石描画を画像アセット（ティント着色）へ刷新

物理エンジン（Matter.js）の当たり判定は一切変更せず、描画の見た目（RICHスタイル時）のみを、あらかじめ用意された画像アセットへ差し替えます。

## 1. アセットのプリロード
`SpriteCacheManager.js` の `preloadAssets` に、以下の宝石ベース画像（グレースケール）の読み込み処理を追加してください。
- `assets/img/gem/gem_circle.png`
- `assets/img/gem/gem_square.png`
- `assets/img/gem/gem_triangle.png`
- `assets/img/gem/gem_rectangle.png`

## 2. drawRichGem の全面刷新
`renderer.js`（または `SpriteCacheManager.js`）にある既存の `drawRichGem` 関数の内容（CanvasのグラデーションやlineToによる手描き処理）をすべて削除し、以下のロジックで再構築してください。

1. 形状（`shape`）に応じた対象の画像アセットを取得する。
2. Canvasの中央に合わせて、対象の画像を `drawImage` で描画する。
   （画像のスケールは引数の `radius` に合わせて適宜調整してください）
3. `ctx.globalCompositeOperation = 'multiply'` を設定する。
4. 引数の `color`（陣営の色）を指定し、宝石の描画領域全体を `fillRect` で塗りつぶしてティント着色（乗算合成）を行う。
5. `ctx.globalCompositeOperation = 'source-over'` に戻す。

※この直後に、先ほど実装した「トライバル刻印（`applySymbolStamp`）」が正しく重なるように、順序や状態の復元（`ctx.restore()`等）に注意してください。
