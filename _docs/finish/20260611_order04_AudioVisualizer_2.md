# オーディオビジュアライザ改修 実装指示書（EQカーブ・動的ノイズゲート適用版）

あなたは優秀なゲームエンジニアであり、プロのオーディオビジュアルエンジニアです。
パズルゲーム『PHASE OUT ∴ Cluster Stirring』のオーディオビジュアライザ描画ロジックを改修します。
生FFTデータに対して「A特性（聴感補正）のようなEQカーブ」と「動的なノイズゲート（Threshold）」を適用することで、人間の体感と完全に一致する最高品質の波形描画を実現してください。

## 1. `js/core/config.js` の修正
* `VISUALIZER_MATH_CONFIG` オブジェクトに描画解像度プリセット `PRESETS` を追加してください。
  * `FULL`: `{ FFT_SIZE: 8192, WAVE_STEP_X: 3 }`
  * `LITE`: `{ FFT_SIZE: 4096, WAVE_STEP_X: 6 }`
  * `NONE`: `{ FFT_SIZE: 2048, WAVE_STEP_X: 10 }`

## 2. `js/render/SoundManager.js` の改修（コアロジック）
* **シームレスな解像度切り替え**: `getBgmFrequencyData` 内で、`AppConfig.EFFECT_LEVEL` に応じた現在のプリセットの `FFT_SIZE` と `this.bgmAnalyser.fftSize` を毎フレーム比較し、不一致の場合はBGM再生を止めずに `fftSize` とバッファを動的に再生成してください。
* **【新規】`getProcessedVisualizerData(ranges, width, stepX)` 関数の追加**: 
  * オーディオの解析・補正・スムージングを全てこの関数で一元管理します。
  * **【最重要】全ビンに対するEQ補正とThresholdの適用**: 
    FFTの生データ配列をループ処理する際、周波数の高さ（`normalizedFreq = i / fftData.length`）に応じて、以下の滑らかな補正カーブを「すべてのビン」に適用してください。
    1. **EQカーブ（振幅補正）**: 低音域は暴れすぎないように圧縮し、エネルギーの弱い高音域になるほど増幅させるカーブ（例: `eqMultiplier = 0.4 + (1.1 * Math.pow(normalizedFreq, 0.5))`）を乗算。
    2. **動的Threshold（ノイズゲート）**: 持続するベース音などの低音ノイズは高く切り捨て、高音域の細い音は拾いやすくするカーブ（例: `currentThreshold = 0.6 - (0.5 * normalizedFreq)`）を適用し、それ以下の値は0にする。
  * 補正後のデータから、引数 `ranges`（7帯域）に該当する区間を抽出し、描画幅 `width` に対して `stepX` ごとに線形補間（Lerp）を用いて振幅データを作成してください。
  * 抽出したデータに対して、Attack（鋭い立ち上がり）と Release（0.85〜0.95の緩やかな減衰）の**非対称スムージング**を適用し、描画側がそのまま使えるデータ（0.0〜1.0等）を返却してください。

## 3. `js/render/title-animation.js` の修正（描画側）
* 7色の帯域定義（`TITLE_RANGES`）を作成してください（色は `config.js` のスペクトル順を参照）。※各帯域固有の ratio や threshold は SoundManager 側でカーブ補正されるため、ここでは周波数帯域（minHz, maxHz）の指定のみで構いません。
* `SoundManager.getProcessedVisualizerData` を呼び出して整形済みデータを受け取り、`width` を7等分して各色が繋がるように滑らかな波形を描画してください。既存の加算合成等のレイヤー構造は維持します。

## 4. `js/render/Visualizer.js` のリファクタリング
* 現在 `Visualizer.js` 内部で行っている「生FFTの独自解析処理」を完全に削除し、上記 `SoundManager` の新関数からデータを受け取る純粋なView層にリファクタリングしてください。既存のゲームプレイ中の演出（WAVE/BLOCK）機能は保護すること。

## 5. ドキュメントの完全同期（v0.12.6）
この改修が完了後、以下のドキュメントを `v0.12.6` として更新してください。
* `changelog.txt`: オーディオビジュアライザの本格的なEQカーブ補正およびシームレスな解像度切り替え機能の追加を記述。
* `PROJECT_ARCHITECTURE.md`: 先頭バージョンを更新。
* `PROJECT_FUNCTION_INDEX.md`: 先頭バージョンを更新し、`SoundManager.js` の項に `getProcessedVisualizerData` 等の新規関数とその責務（EQカーブ補正など）を追記。
