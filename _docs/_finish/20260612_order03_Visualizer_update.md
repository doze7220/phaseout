# パズル画面専用ビジュアライザの最適化（Strategyパターンの導入と設定分離）

あなたは優秀なゲームアーキテクトです。
パズル画面とタイトル画面で求められるビジュアライザの役割の違い（パズル中は背景演出として控えめ・低負荷であるべき）を考慮し、以下の改修を行ってください。

## 1. `config.js` の設定分離
`VISUALIZER_MATH_CONFIG.PRESETS` を改修し、タイトル画面用とパズル画面用で描画ステップ（間引き）を分けられるようにしてください。
```javascript
   PRESETS: {
        FULL: { FFT_SIZE: 8192, TITLE_STEP_X: 3, PUZZLE_STEP_X: 6 },
        LITE: { FFT_SIZE: 4096, TITLE_STEP_X: 6, PUZZLE_STEP_X: 8 },
        NONE: { FFT_SIZE: 2048, TITLE_STEP_X: 10, PUZZLE_STEP_X: 12 }
    }
```

## 2. 呼び出し側の対応
- js/render/title-animation.js: SoundManager.getProcessedVisualizerData を呼び出す際のステップ幅引数を currentPreset.TITLE_STEP_X に変更してください。
- js/render/Visualizer.js: データ取得時のステップ幅引数を currentPreset.PUZZLE_STEP_X に変更してください。

## 3. Visualizer.js の Strategyパターン化と振幅の半減
- Visualizer.js 内に分岐（if文）が肥大化するのを防ぐため、Strategyパターンを導入して描画ロジックを分離してください。
- 描画モード（WAVE, BLOCK等）ごとの描画関数を持つ辞書（オブジェクト） RenderStrategies を定義し、メインループからは対象の関数にデータを渡して呼び出すだけの構造にリファクタリングしてください。
- 【重要】パズル画面のWAVE描画について: 背景として主張しすぎないよう、波の「振幅幅」をこれまでの計算結果から**「半分（0.5倍）」**になるように描画ロジック内で係数を適用してください。

## 4. ドキュメントの同期・保護
- このチャットで行われた作業が、全て下記資料に反映されているかをチェックしてください。
- 資料と差異があった場合は、現在の実コード（.js群）を正としてドキュメントを更新してください。ただしこのチャット以外で作業を行った可能性があるため、必ず実装を確認すること。
- リビジョンはカウントアップせず、最新のリビジョンの内容として上書き・追記してください。
  - D:\ozlab\phaseout\PROJECT_ARCHITECTURE.md
  - D:\ozlab\phaseout\PROJECT_FUNCTION_INDEX.md
