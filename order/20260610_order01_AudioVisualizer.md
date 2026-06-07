# オーディオビジュアライザの改修要件定義

あなたは優秀なゲームエンジニアです。 パズルゲーム『PHASE OUT ∴ Cluster Stirring』において、オーディオビジュアライザの描画ロジックを改修し、「人間の体感と視覚表現の完全な一致」を実現します。
現在の実装はFFTデータを線形分割し生の振幅をそのまま適用しているため、エネルギーが集中する低音域ばかりが過剰に反応し、中高音域が平坦になるという欠陥があります。 現在のアーキテクチャルールを厳守し、以下の要件を満たすようにオーディオ解析および描画ロジックを改修してください。

##### 【実装要件】
・ユーザーの体感とオーディオビジュアライザの表現を一致させるため、FFTサイズ・ビジュアライザ解像度を上げる。ただし処理負荷を考慮し、可変設定とする。
・ユーザーがUIから設定した軽量化オプション（AppConfig.EFFECT_LEVEL = FULL / LITE / NONE）に応じて、オーディオ解析解像度（FFTサイズ）と波形描画密度（WAVE_STEP_X）を **BGMを止めることなくリアルタイムかつシームレスに動的切り替えする仕組み** を実装します。
既存のアーキテクチャ（加算合成 lighter、軽量化オプションの基本ルール等）は絶対に破壊しないでください。 以下の要件を厳守して各ファイルを改修してください。

##### 1. config.js の改修（動的プリセットの定義）
*  VISUALIZER_MATH_CONFIG オブジェクト内に、固定の数値ではなく、エフェクトレベル（FULL / LITE / NONE）に応じた設定プリセット PRESETS を新規追加してください。
*  数値の特性上、WAVE_STEP_X は値が小さいほど高密度（高負荷）、大きいほど低密度（低負荷）になります。端末スペックに合わせて以下の割り当てにしてください。

export const VISUALIZER_MATH_CONFIG = {
    // 既存の定数はそのまま維持
    PRESETS: {
        FULL: { FFT_SIZE: 8192, WAVE_STEP_X: 3 },  // PC向け：超高解像度・超高密度
        LITE: { FFT_SIZE: 4096, WAVE_STEP_X: 6 },  // スマホ標準：適度な解像度・描画間引き
        NONE: { FFT_SIZE: 2048, WAVE_STEP_X: 10 }  // 超軽量：低解像度・超低負荷
    }
};

##### 2. SoundManager.js の改修（リアルタイム・リサイズ対応）
*  config.js から VISUALIZER_MATH_CONFIG と AppConfig をインポートしてください。
*  initContext メソッド内での初期設定時は、現在の AppConfig.EFFECT_LEVEL に応じたプリセットの FFT_SIZE を適用し、合わせて波形のスムーズな動きのために this.bgmAnalyser.smoothingTimeConstant = 0.85; を設定してください。
*   **【重要：シームレス切り替えロジック】**  getBgmFrequencyData() メソッドの冒頭で、現在の this.bgmAnalyser.fftSize と、現在の AppConfig.EFFECT_LEVEL に対応するプリセットの FFT_SIZE が一致しているかを毎フレームチェックしてください。 もし不一致（UI等で変更された）を検知した場合、 **再生中の音を止めることなく**  this.bgmAnalyser.fftSize を新しい値に書き換え、同時に this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount); を再生成してバッファサイズを動的にリサイズしてください。

##### 3. title-animation.js の帯域等分割と動的 Lerp（線形補間）
*  config.js から VISUALIZER_MATH_CONFIG と AppConfig をインポートしてください。
*  描画処理において、現在の AppConfig.EFFECT_LEVEL に応じた PRESETS の FFT_SIZE および WAVE_STEP_X を動的に取得して使用してください。
*  画面の横幅（canvas.width）を、後述する TITLE_RANGES（7色）で **完全に均等に7分割** して描画してください（1色あたり canvas.width / 7 の描画幅を担当）。
*  サンプリングレート（44100Hz）と、動的に変わる FFT_SIZE をベースに、各色が担当する minHz と maxHz から、対応するFFT配列（freqData）の開始インデックスと終了インデックスを正確に算出してください。
*  各色の描画領域において、現在のプリセットの WAVE_STEP_X の間隔でジグザグの波形をプロットする際、実際のFFTビン数と描画ポイント数のズレを解消するため、**線形補間（Lerp）**を用いて配列から値を抽出してください。これにより、レベルが動的に切り替わってもカクつかず滑らかな波形が維持されます。

###### 3-2. 聴感補正（ゲインの傾斜調整）
*   **低音域の抑制と高音域の増幅:**  低音域の過剰な物理エネルギーによる画面の破綻を防ぎ、高音域の微細な変化を視覚化するため、高周波数帯域になるほど取得データに乗算する係数（ゲイン）を高くする補正処理を組み込んでください。

###### 3-3. 非対称なスムージング（Attack / Release）
*   **動的なイージング:**  前フレームの帯域ごとの振幅データを保持・追従する仕組みを実装します。
*   **Attack / Release の分離:**  音の立ち上がり（現在の振幅 > 前フレームの振幅）には鋭く即座に反応し、音の減衰（現在の振幅 < 前フレームの振幅）時は指定した減衰係数（例: 0.85 〜 0.95）で緩やかに数値が落ちるように処理してください。これにより、トゲトゲしさを保ちつつカクつかない滑らかな波形になります。

##### 4. 各種フィルター（ノイズゲートと圧縮）の適用
抽出・補間した値（0.0〜1.0に正規化した val）に対して、TITLE_RANGES のプロパティを利用した補正をかけてから描画座標（offsetY）を算出してください。
*   **しきい値（Threshold）:**  val が range.threshold 以下の場合は 0 として扱う（ノイズゲート）。
*   **ゲイン / 圧縮（Ratio）:**  しきい値を超えた値に対して、range.ratio を掛けてスケールを調整する。

##### 5. 低音（Bass）による全体パルス演出の追加
*  毎フレーム、赤帯域（20Hz〜60Hz）のピーク値または平均値を取得し、イージング（平滑化）をかけた smoothedBass 変数（0.0〜1.0）をファイルスコープで計算してください。
*  各帯域の振幅（maxAmp）を計算する際、この smoothedBass を加味してください。キックドラム等の強い低音が鳴った瞬間に、すべての帯域の波形が連動して「少し大きく脈打つ」ような迫力ある演出を追加してください。

##### 6. TITLE_RANGES の定義
実装にあたり、以下の配列を title-animation.js 内に定義して活用してください。（※実際の配列定義は適宜追加してください）

const TITLE_RANGES = [
    { color: '#FF3B30', minHz: 20, maxHz: 60, threshold: 0.2, ratio: 1 / 4 }, // 赤
    { color: '#FF9500', minHz: 60, maxHz: 250, threshold: 0.3, ratio: 1 / 3 }, // 橙
    { color: '#FFCC00', minHz: 250, maxHz: 500, threshold: 0.5, ratio: 1 / 2 }, // 黄
    { color: '#34C759', minHz: 500, maxHz: 2000, threshold: 0.8, ratio: 1 / 1.5 },// 緑
    { color: '#5AC8FA', minHz: 2000, maxHz: 4000, threshold: 0.9, ratio: 1 / 1.2 },// 水色
    { color: '#007AFF', minHz: 4000, maxHz: 6000, threshold: 1.0, ratio: 1.0 }, // 青
    { color: '#AF52DE', minHz: 6000, maxHz: 20000, threshold: 1.0, ratio: 1.0 }// 紫
];

##### 【各ファイルへの実装指示・アーキテクチャ厳守事項】
*   **Visualizer.js**  および  **title-animation.js** :
    *   **既存ロジックの保護:**  既存の AppConfig.EFFECT_LEVEL に依存する分岐（WAVE / BLOCK / BLOCK_NONE）や、ctx.save() と ctx.restore() のコンテキスト保護構造は **絶対に破壊しない** でください。
    *   **パフォーマンス最適化:**  毎フレーム実行される draw や updateAndDraw のループ内で、無駄な配列の再インスタンス化や重い対数計算を極力避けてください。帯域のインデックス境界（どのビンからどのビンまでを束ねるか）は、FFTサイズが変更されない限り固定であるため、 **事前計算（初期化時またはリサイズ時）してキャッシュする** 設計を強く推奨します。
    *   **【重要：責務の分離】** 両ファイルで共通の解析が必要になるため、オーディオデータから視覚用データ配列（補正・スムージング済み）を生成する専用の関数（例: `getProcessedVisualizerData()` など）を **`SoundManager.js` 内に構築し**、`Visualizer.js` や `title-animation.js` 側はただそのデータを受け取って描画（WAVEのパス描画やBLOCKの矩形描画）するだけの形にリファクタリングしてください [1, 2]。
