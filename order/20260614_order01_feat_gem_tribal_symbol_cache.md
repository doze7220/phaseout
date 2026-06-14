# 宝石視認性改善：トライバル刻印システム（画像合成版）の実装

すでに `assets/img/symbol/symbol_1.png` 〜 `symbol_7.png` の7枚のアセット（512x512, 黒ベタ透過, 余白0px）が用意されています。これをスプライトキャッシュ生成時（FLAT / RICH 両スタイル）に各宝石の中央へスタンプ（合成）するシステムを実装してください。

## 1. アセットのプリロード
`SpriteCacheManager.js` の `preloadAssets` に、上記のシンボル画像7枚の読み込み処理を追加してください（キー名は `symbol_1` 〜 `symbol_7` など）。

## 2. config.js の改修
`COLOR_CONFIG` の各陣営のオブジェクトに以下のプロパティを追加してください。
- `symbolKey`: 読み込んだ画像のキー名（例: `'symbol_1'`）。陣営ごとに1〜7を割り当て。
- `symbolColor`: 暗い宝石（Red, Blue, Purple）には `'rgba(255, 255, 255, 0.85)'` などの白い発光色を、明るい宝石（Yellow, Orange, Green, Cyan）には `'rgba(0, 0, 0, 0.6)'` などの黒い影色を指定。

## 3. 刻印スタンプ処理の共通関数化
`renderer.js`（または `SpriteCacheManager.js`）に、刻印合成専用のヘルパー関数（例: `applySymbolStamp(ctx, radius, colorConfig)`）を新規作成し、以下の合成処理を実装してください。
1. オフスクリーンキャンバス（または一時的なコンテキスト）を用意し、対象のシンボル画像を描画する。
2. `ctx.globalCompositeOperation = 'source-in'` を適用し、`colorConfig` の `symbolColor` で長方形を `fillRect` して、シンボルの黒い部分を目的の色に塗り替える。
3. 塗り替えたシンボルを、宝石本体のキャンバスの中央へ `drawImage` で合成する。
   ※画像は余白0pxの512x512なので、宝石の半径（radius）の `60% 〜 70%` 程度のスケールになるよう、width/heightを計算して中央に配置してください。

## 4. FLAT / RICH 両キャッシュへの刻印適用
`initCanvasCache` の処理内において、FLAT用のベース図形が描画されたキャッシュ、および `drawRichGem` で描画されたRICHキャッシュの両方に対して、作成した共通関数 `applySymbolStamp` を呼び出して刻印を焼き付けてください。
※FLATスタイルにおいては、グラデーションやハイライトがないシンプルな背景となるため、ベース色を塗った直後、または最後にスタンプするなど描画順序に気をつけてください。

これにより、ユーザーがコンフィグで「FLAT」「RICH」のどちらのスタイルを選択していても、毎フレームの描画負荷を一切上げることなく、すべての宝石に陣営ごとの美しいトライバル刻印が焼き付けられたキャッシュを完成させてください。
