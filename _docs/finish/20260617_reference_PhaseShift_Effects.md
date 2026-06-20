# PHASE OUT - PhaseShift Effects Technical Reference

この資料は、今後の「ホワイトフェイズ（フェイズシフト）関連の演出ブラッシュアップ作業」を円滑に開始・進行するための技術リファレンスです。
現状実装されている演出の構造とパラメータ、将来的に演出を追加する際のエントリーポイントを整理しています。

---

## 1. 関連モジュール一覧
- **`js/render/ScreenEffects.js`**: 画面全体にかかるポストエフェクト（フラッシュ、波紋、ヴィネット等）の描画ロジック本体。
- **`js/render/effects.js`**: エフェクトのファサード（委譲窓口）。他モジュールから直接 `ScreenEffects` を触らせないためのインターフェース。
- **`js/core/PhaseManager.js`**: フェイズ状態とゲージ量を管理するステートマシン。演出のトリガーを引く起点。
- **`js/render/SoundManager.js`**: オーディオ管理（専用BGMの再生や、ステイシス時の音声フィルタ）。

---

## 2. 実装済みの演出構造と改修ヒント

### 2.1. Sonar Ripple（波紋エフェクト）
フェイズゲージの蓄積量に連動して、画面上部から鼓動のように広がる波紋。
- **場所**: `ScreenEffects.js` の `updateAndDraw` (第10層 `GLOBAL_POST_EFFECT`)
- **トリガー条件**: `PhaseManager.phaseGauge > 0`
- **仕様**:
  - `PhaseManager.phaseGauge` の割合 (`gaugeRatio`) に応じて脈動の頻度 (`pulseSpeed = 1000 - gaugeRatio * 700`)、最大半径 (`maxRadius`)、透明度 (`baseAlpha`) が毎フレーム動的に変化。
  - 画面上部中央を中心とした円(`arc`)を `lighter` (加算合成) で描画。
- **改修時のヒント**:
  - 現在はループ内で単一の円を描画するシンプルな計算方式（数式ベースのアニメーション）です。
  - もし「タップ位置から広がる複数の波紋」や「ランダムな位置に発生するパーティクル」と連動させたい場合は、オブジェクトリストとして管理するアプローチ（`this.ripples = []`等）への拡張が推奨されます。

### 2.2. White Flash（白発光フラッシュ演出）
フェイズ移行時に画面全体を一瞬真っ白にする強烈なフラッシュ。
- **場所**: `ScreenEffects.js` の `triggerWhiteFlash()` および `updateAndDraw`
- **トリガー条件**: `PhaseManager.enterWhitePhase()` 発火時
- **仕様**:
  - `whiteFlashState` をアクティブにし、指定時間 (`duration: 1000ms`) かけて画面全体を白(`fillRect`)で塗りつぶし、その後徐々に透明(lerp)になります。
- **改修時のヒント**:
  - 単純なアルファフェードだけでなく、フラッシュ時に画面全体の残像（モーションブラー）を残したり、一瞬だけ色反転（invertフィルター）をかけることで、より「次元が切り替わった感」を演出できます。

### 2.3. Stasis Effect（ステイシスヴィネット）
突入から2秒間（`PHASE_WHITE_ENTER`）の完全時間停止時に、異空間であることを示す白い枠のボケ。
- **場所**: `ScreenEffects.js` の `toggleStasisEffect(isStasis)` および `updateAndDraw`
- **トリガー条件**: `PhaseManager` が `PHASE_WHITE_ENTER` に移行した時
- **仕様**:
  - 画面中央から外側へ向かう円形グラデーション（`createRadialGradient`）を描画し、`stasisAlpha` のlerp（線形補間）により滑らかにフェードイン・フェードアウトします。
- **改修時のヒント**:
  - 白いグラデーションを青や紫に変更したり、ノイズテクスチャ（TV砂嵐のような走査線）を加えると、より「世界が停止した異次元感」が増します。

### 2.4. Audio Stasis Filter（ステイシス音声フィルタ）
時間停止時にBGMが水中にいるようにこもって聞こえる演出。
- **場所**: `SoundManager.js` の `setStasisFilter(isStasis)`
- **トリガー条件**: `PhaseManager` が `PHASE_WHITE_ENTER` に移行した時
- **仕様**:
  - BGMマスターラインの `BiquadFilterNode` (`lowpass`) のカットオフ周波数を変更。通常 `20000Hz` からステイシス中は `400Hz` に落とします。

### 2.5. 専用BGMのクロスフェード (`phase_shift`)
フィーバーモード（ホワイトフェイズ）専用のBGM再生。
- **場所**: `SoundManager.js` の `startPhaseShiftBgmFromZero()`
- **トリガー条件**: `PhaseManager` が `PHASE_WHITE_ENTER` から2秒後、`PHASE_WHITE` に本格移行した時
- **仕様**:
  - 既存のBGMをフェードアウトさせ、専用の `phase_shift` トラックを0秒地点からフェードイン再生させます。

---

## 3. 今後の演出追加時のエントリーポイント (Extension Points)

ブラッシュアップ時に新たな演出を組み込む場合は、以下の箇所にフック（呼び出し）を追加するとスムーズです。

- **A. ゲージ上昇時（フルリンク達成の瞬間）のカットイン等**
  - `PhaseManager.js` の `addPhaseGauge()` 内。
  - `if (this.phaseGauge >= PHASE_SHIFT_MATH.GAUGE_MAX)` の**手前**に処理を追加することで、「ゲージがギュンと伸びた瞬間の背景発光やシェイク」などを実装できます。
- **B. フィーバー（ホワイトフェイズ）中の常時演出**
  - `ScreenEffects.js` の `updateAndDraw` ループ内に、以下のようなガードブロックを追加します。
    ```javascript
    if (PhaseManager.currentPhase === 'ホワイトステイシス中') {
        // 例: 宝石の落下軌跡をレインボーにする、背景に流星のようなパーティクルを降らせる、画面全体の色調を少し飛ばす等
    }
    ```
- **C. ステージ背景のBGMビジュアライザとの連動**
  - `Visualizer.js` の描画ループ内でフェイズ判定を行い、波形の色を白や虹色に変更したり、振幅スケールを強制的に増幅させると、背景全体がフェイズシフトに呼応する表現が可能です。
