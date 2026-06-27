### 1. PhaseManager.js の全体タイマー計算の修正
提案では全体タイマーから `FLICKER_DURATION_MS` が抜け落ちている。
全体の演出時間は必ず `STASIS_DELAY_MS + FLICKER_DURATION_MS + TRIBAL_TOTAL_MS + TRANSITION_OUT_FADE_MS` の合計値として計算し、タイムラインがズレないように厳密に管理せよ。

### 2. ScreenEffectTransition.js における「システムログ」の完全描画
Step 3 のログ表示を "BLACK RESURRECT" の1行だけで済ませてはならない。以下の6行のテキスト配列を用意し、等幅フォント（monospace）を用いて画面中央へ複数行にわたって描画すること（行間も適切に空けること）。

[追加する設定値]
LOG_POS_Y: 490,
LOG_TOTAL_MS: 6000,
LOG_TIMINGS: [
    { weight: 0.10, offsetY: 0, text: "SPATIAL POSSIBILITY FRAGMENTS : AVERAGING COMPLETE" },
    { weight: 0.20, offsetY: 24, text: "DETECTING SINGULARITY PRECURSOR..." },
    { weight: 0.35, offsetY: 48, text: "INITIATING PHASE SHIFT..." },
    { weight: 0.50, offsetY: 72, text: "WARNING : POTENTIAL PHASE ANOMALY IN FORWARD SPACETIME." },
    { weight: 0.70, offsetY: 120, text: "[ PHASE BREAK ]" },
    { weight: 0.85, offsetY: 168, text: "\" BLACK RESURRECT \"" }
]

`ScreenEffectTransition.js` の描画処理では、この `LOG_TIMINGS` 設定配列を参照し、`LOG_TOTAL_MS` の経過ウェイトに応じて、等幅フォント（monospace、黒文字・白フチ）で各行を段階的に描画するデータ駆動アーキテクチャとすること。

