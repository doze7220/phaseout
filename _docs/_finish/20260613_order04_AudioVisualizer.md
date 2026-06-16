# オーディオビジュアライザの改修要件定義

あなたは優秀なゲームエンジニアです。
`PROJECT_ARCHITECTURE.md` と `PROJECT_FUNCTION_INDEX.md` の資料を把握し、取り組んでください。

パズルゲーム『PHASE OUT ∴ Cluster Stirring』において、オーディオビジュアライザの描画ロジックを改修し、「人間の体感と視覚表現の完全な一致」を実現します。

現在の実装は FFT データを線形分割し、生の振幅をそのまま適用しているため、エネルギーが集中する低音域ばかりが過剰に反応し、中高音域が平坦になるという欠陥があります。

現在のアーキテクチャルールを厳守し、以下の要件を満たすようにオーディオ解析および描画ロジックを改修してください。

---

## 【実装要件】

- ユーザーの体感とオーディオビジュアライザの表現を一致させるため、FFTサイズ・ビジュアライザ解像度を上げる。ただし処理負荷を考慮し、可変設定とする。
- ユーザーが UI から設定した軽量化オプション（AppConfig.EFFECT_LEVEL = FULL / LITE / NONE）に応じて、オーディオ解析解像度（FFTサイズ）と波形描画密度（WAVE_STEP_X）を **BGMを止めることなくリアルタイムかつシームレスに動的切り替えする仕組み** を実装する。
- 既存のアーキテクチャ（加算合成 lighter、軽量化オプションの基本ルール等）は絶対に破壊しないこと。

---

## 1. config.js の改修（動的プリセットの定義）

- VISUALIZER_MATH_CONFIG オブジェクト内に、固定の数値ではなく、エフェクトレベル（FULL / LITE / NONE）に応じた設定プリセット PRESETS を新規追加してください。
- WAVE_STEP_X は値が小さいほど高密度（高負荷）、大きいほど低密度（低負荷）となるため、以下の割り当てを使用してください。

```js
export const VISUALIZER_MATH_CONFIG = {
    // 既存の定数はそのまま維持
    PRESETS: {
        FULL: { FFT_SIZE: 8192, WAVE_STEP_X: 3 },
        LITE: { FFT_SIZE: 4096, WAVE_STEP_X: 6 },
        NONE: { FFT_SIZE: 2048, WAVE_STEP_X: 10 }
    }
};
```

---

## 2. SoundManager.js の改修（リアルタイム・リサイズ対応）

- config.js から VISUALIZER_MATH_CONFIG と AppConfig をインポートしてください。
- initContext() の初期設定時は、現在の AppConfig.EFFECT_LEVEL に応じた FFT_SIZE を適用してください。
- 波形の自然な動きのため、

```js
this.bgmAnalyser.smoothingTimeConstant = 0.85;
```

を設定してください。

### 【重要：シームレス切り替え】

getBgmFrequencyData() の冒頭で、

- 現在の this.bgmAnalyser.fftSize
- AppConfig.EFFECT_LEVEL に対応する FFT_SIZE

を毎フレーム比較してください。

不一致を検知した場合は、再生中の BGM を停止することなく、

```js
this.bgmAnalyser.fftSize = newFftSize;
this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount);
```

として動的にリサイズしてください。

---

## 3. title-animation.js の描画ロジック

- config.js から VISUALIZER_MATH_CONFIG と AppConfig をインポートしてください。
- 現在の AppConfig.EFFECT_LEVEL に応じた PRESETS の FFT_SIZE および WAVE_STEP_X を動的に取得して使用してください。
- canvas.width を TITLE_RANGES（7色）で完全に均等に7分割してください。
- title-animation.js は SoundManager.js が返す processedVisualizerData を利用して描画のみ行うこと。
- FFTビン境界の算出、周波数補正、圧縮、Attack / Release、Bass Pulse などの解析処理は行わないこと。
- 波形描画時は、現在の WAVE_STEP_X に応じて描画密度を調整し、必要に応じて線形補間（Lerp）を利用して滑らかなジグザグ波形を生成してください。
- エフェクトレベルが動的に切り替わっても、波形がカクつかず自然に遷移すること。

---

### 3-2. 聴感補正 EQ（Per-bin Equalization）

低音域に集中する物理エネルギーと、人間が知覚する音量感の差を補正するため、FFT配列の各ビン（周波数単位）に対して連続的な EQ 補正を適用してください。

補正は TITLE_RANGES 単位ではなく、FFT 全ビンに対して行います。

各ビンの周波数を

```text
freqHz = binIndex * sampleRate / fftSize
```

によって求め、

```text
gain = getFrequencyCompensation(freqHz)
correctedValue = rawValue * gain
```

として補正してください。

補正カーブは滑らかな連続関数とし、

- 20～80Hz：減衰
- 100～1000Hz：基準
- 2k～8kHz：やや増幅
- 10kHz以上：緩やかに減衰

となる、人間の聴感に近い特性を持たせてください。

A-weighting に近い特性を参考にした滑らかな補正カーブを推奨します。

補正係数は FFTサイズ変更時のみ事前計算テーブルとして生成し、毎フレームの対数演算や高コストな処理は避けてください。

---

### 3-3. 非対称なスムージング（Attack / Release）

前フレームの帯域ごとの振幅データを保持してください。

振幅上昇時（Attack）は即座に追従し、

```text
newValue > previousValue
```

の場合はそのまま採用してください。

振幅減衰時（Release）は、

```text
smoothedValue =
    previousValue * releaseFactor +
    currentValue * (1 - releaseFactor)
```

のような補間を行い、

```text
releaseFactor = 0.85 ～ 0.95
```

程度で滑らかに減衰させてください。

鋭い立ち上がりと滑らかな減衰を両立し、トゲトゲした動きを残しながらカクつきを抑制してください。

---

## 4. ダイナミックレンジ圧縮

EQ補正後の値（0.0～1.0）に対して、固定倍率によるスケーリングは使用せず、ソフトニー圧縮を適用してください。

例えば、

```text
compressedValue = Math.pow(value, 0.7)
```

のような非線形圧縮を行い、

- 微小な音を見えやすくする
- 過剰な低音による画面破綻を防ぐ
- 楽曲ジャンルによる偏りを減らす

ことを目的としてください。

閾値（Threshold）および固定倍率（Ratio）による7段階補正は使用しないでください。

---

## 5. Bass Pulse演出

20～60Hz帯域の平均値またはピーク値から bassEnergy を算出し、

```text
smoothedBass
```

として独立して平滑化してください。

各帯域の最終振幅に対して、

```text
finalAmplitude =
    compressedAmplitude *
    (1 + smoothedBass * pulseStrength)
```

のように加算し、

キックドラムや重低音が鳴った瞬間に全体がわずかに脈打つ演出を追加してください。

過剰な拡大は避け、全体の波形が自然に呼吸する程度の演出としてください。

---

## 6. TITLE_RANGES の定義

TITLE_RANGES は色分けと担当周波数帯域のみを定義し、音量補正パラメータは持たせないでください。

```js
const TITLE_RANGES = [
    { color:'#FF3B30', minHz:20, maxHz:60 },
    { color:'#FF9500', minHz:60, maxHz:250 },
    { color:'#FFCC00', minHz:250, maxHz:500 },
    { color:'#34C759', minHz:500, maxHz:2000 },
    { color:'#5AC8FA', minHz:2000, maxHz:4000 },
    { color:'#007AFF', minHz:4000, maxHz:6000 },
    { color:'#AF52DE', minHz:6000, maxHz:20000 }
];
```

TITLE_RANGES は描画色および周波数担当範囲を示す目的のみに使用し、ゲイン補正・閾値処理・倍率補正などの責務を持たせないでください。

---

## 7. ドキュメントの更新

作業完了後、

- changelog.js
- PROJECT_ARCHITECTURE.md
- PROJECT_FUNCTION_INDEX.md

を更新し、リビジョンをカウントアップして変更内容を反映してください。

---

## 8. 【重要：責務の分離】

周波数補正・圧縮・Attack / Release・Bass Pulse を含むすべての解析処理は、

```text
SoundManager.js
└ getProcessedVisualizerData()
```

に集約してください。

getProcessedVisualizerData() 内では、

1. FFT取得
2. FFTサイズ変更時のキャッシュ更新
3. Per-bin EQ補正
4. TITLE_RANGES ごとの帯域集約
5. ダイナミックレンジ圧縮
6. Attack / Release
7. Bass Pulse演出
8. 描画用データ生成

の順序で処理を行ってください。

Visualizer.js および title-animation.js は、

- 受け取ったデータを描画する
- WAVE と BLOCK の表現を行う

ことのみに責務を限定してください。

描画側で独自に FFT解析や補正処理を行わないでください。

---

## 【各ファイルへの実装指示・アーキテクチャ厳守事項】

### Visualizer.js および title-animation.js

#### 既存ロジックの保護

以下は絶対に破壊しないでください。

- AppConfig.EFFECT_LEVEL に依存する分岐（WAVE / BLOCK / BLOCK_NONE）
- ctx.save()
- ctx.restore()

などの既存コンテキスト保護構造。

#### パフォーマンス最適化

毎フレーム実行される draw や updateAndDraw のループ内で、

- 無駄な配列の再インスタンス化
- 重い対数演算

を極力避けてください。

FFTサイズ変更時のみ必要なキャッシュを再生成し、それ以外では再利用する設計を推奨します。

#### 【重要】

両ファイルで共通利用する解析処理は、

```text
SoundManager.js
└ getProcessedVisualizerData()
```

へ集約してください。

Visualizer.js や title-animation.js 側は、受け取ったデータを利用して、

- WAVE のパス描画
- BLOCK の矩形描画

を行うだけの構造へリファクタリングしてください。