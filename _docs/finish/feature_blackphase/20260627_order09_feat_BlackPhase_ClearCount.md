# 実装指示書：フェイズクリアカウントの修正と新設

フェイズのサバイバル機構およびリザルト評価に必要な「フェイズクリアカウント」の処理が漏れているため、PHASE_BLACK_EXIT の実装と併せて以下の修正・追加を行え。

## 1. GameState へのプロパティ追加 (config.js)
`GameState` オブジェクトに、1プレイ中のブラックフェイズ完了（通過）回数を記録する `blackPhaseCount: 0` を新設せよ（既存の `whitePhaseCount: 0` の並びに配置すること）。
また、`GameState.reset()` メソッド内でも `this.blackPhaseCount = 0;` として確実な初期化処理を行うこと。

## 2. クリアカウントの加算ロジック実装 (PhaseManager.js)
`PhaseManager.js` の `update` 内において、それぞれの退出演出（EXIT）が完了し、`PHASE_NORMAL` へ復帰する瞬間にカウントを加算する処理を実装せよ。
*   **ホワイトフェイズ:** `PHASE_WHITE_EXIT` の演出完了時（通常フェイズ復帰時）に `GameState.whitePhaseCount++;` を実行する処理が漏れているため、確実に追加すること。
*   **ブラックフェイズ:** 実装中の `PHASE_BLACK_EXIT` の演出完了時（通常フェイズ復帰時）に、`GameState.blackPhaseCount++;` を実行すること。
