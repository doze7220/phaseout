# 実装指示書：ホワイトフェイズ中の演出強化（キャッシュ再構築と焦燥感の視覚化）

## 目的
ホワイトフェイズ中のパズル体験を視覚的に強化する。
1. `SpriteCacheManager` を利用した、突入時の「宝石キャッシュ再生成（白化オーバードライブ）」による無負荷の発光表現。
2. 動的加速減衰による時間切れの焦燥感を煽る、「盤面宝石のグリッチノイズ」および「LIFEゲージの白化＆黒点滅」。

## 変更対象ファイル
*   `js/core/config.js` (定数の追加)
*   `js/render/SpriteCacheManager.js` (キャッシュ再生成ロジックの拡張)
*   `js/core/PhaseManager.js` (フェイズ移行時のキャッシュ再生成トリガー)
*   `js/render/GaugeManager.js` (LIFEゲージ描画)
*   `js/render/renderer.js` (グリッチ描画)

## 実装手順

### 1. 定数の定義 (`config.js`)
*   `EFFECT_MATH_CONFIG` 内に以下の定数を定義する。
    *   `WHITE_PHASE_GLITCH_THRESHOLD`: `0.6` (残量60%以下で発火)
    *   `WHITE_PHASE_GLOW`: `{ SCALE: 0.85, ALPHA: 0.5 }` (キャッシュ生成時の白化焼き付け用パラメータ)

### 2. キャッシュの動的再構築 (`SpriteCacheManager.js` & `PhaseManager.js`)
*   **SpriteCacheManager:**
    *   `generateAllCaches(isWhitePhase = false)` と引数を拡張する。
    *   キャッシュ生成ループ内（`_drawRichGem`等の描画完了直後）で `isWhitePhase === true` の場合のみ、生成したばかりの宝石の上に `globalCompositeOperation = 'lighter'`、`globalAlpha = WHITE_PHASE_GLOW.ALPHA`、スケール `WHITE_PHASE_GLOW.SCALE` で「同じ宝石」を縮小して加算合成で焼き付ける処理を追加する（これにより輪郭線を残しつつ内側が白く発光する画像が完成する）。
*   **PhaseManager:**
    *   `enterWhitePhase` (ホワイトフェイズ突入時) に `SpriteCacheManager.generateAllCaches(true)` を呼び出し、ステイシスの裏でキャッシュを白化版へ書き換える。
    *   `PHASE_WHITE_EXIT` (ホワイトフェイズ終了時) に `SpriteCacheManager.generateAllCaches(false)` を呼び出し、元の通常宝石キャッシュへと戻す。

### 3. LIFEゲージの白化と「黒点滅」 (`GaugeManager.js`)
*   外周LIFEゲージ描画処理を改修。`PhaseManager.isWhitePhase()` 中は以下を適用。
    1.  **残量60%より多い場合**: 常に「純白 (`#ffffff`)」で描画。
    2.  **残量60%以下の場合**: 「純白」と「漆黒 (`#000000`)」で点滅させる。
    3.  点滅速度は残量 (`PhaseManager.getGaugeRatio()`) に連動させ、0%に近づくほど真っ黒になる頻度が増すよう `Math.sin(gameTime * 速度)` 等で計算する。

### 4. 宝石のグリッチノイズ侵食 (`renderer.js`)
*   `drawGem` などの宝石描画処理を改修する。
*   `PHASE_WHITE` 中、かつシフトゲージ残量が `WHITE_PHASE_GLITCH_THRESHOLD` 以下になった場合のみ、描画時のX座標やRGBチャンネルにズレ（グリッチ）を生じさせる。
*   **【重要：負荷制御】** このグリッチ描画処理は `AppConfig.EFFECT_LEVEL === 'FULL'` の場合のみ実行すること。`LITE` および `NONE` の場合はパフォーマンス保護のため描写をスキップし、通常描画を維持すること。
*   ※座標オフセットは描画(`ctx.drawImage`)の際に行うこと。物理ボディ(`Body.position`)自体は絶対に操作しない。
