# 計画書のアップデート指示：最新のブラックフェイズ（プール仕様）への適合

提出された実装計画書（1 TAP MAX SCORE 特異点演出およびスコア剰余消失バグ修正）について、演出の方向性は素晴らしいが、最新のブラックフェイズの「スコア一括獲得仕様」との間にアーキテクチャの齟齬がある。以下の修正を計画書に反映し、実装せよ。

## 1. 1 TAP MAX SCORE の 'BLACK' 記録位置の変更
ブラックフェイズ中のスコアは `finalizeDestruction` ではなく `blackHolePooledScore` に蓄積され、`flushBlackHolePool()` で一括獲得される仕様（FEATURE_BLACK_PHASE.md 参照）である。
*   **修正:** `finalizeDestruction` 内での 'BLACK' の判定（条件A）を削除すること。
*   **追加:** 代わりに `logic.js` の `flushBlackHolePool()` 内において、`blackHolePooledScore > GameState.maxScorePerTap` となった場合、`GameState.maxScorePerTap = blackHolePooledScore;` とし、同時に `GameState.maxScoreColor = 'BLACK';` を記録する処理を追加せよ。

## 2. スコア按分の剰余（remainder）の「起点不在時」のフォールバック
`flushBlackHolePool()` でのプールスコア一括按分時にも剰余の消失を防ぐ必要があるが、この場合は「タップ起点色（startColorStr）」が存在しない。
*   **修正:** `logic.js` 側で按分を行う際、`startColorStr` が指定されていない（undefined 等）場合は、按分対象となった色の配列（`colorEntries`）の先頭の色（`colorEntries`）に対して剰余を全加算するフォールバック処理を必ず実装すること。

## 3. 'WHITE' の判定条件（prismDepth >= 6）の維持
`finalizeDestruction` 内での 'WHITE'（条件B）および通常色（条件C）の記録ロジックは計画書のままで問題ない。ただし、ホワイトフェイズ中の3乗スコア等も正しく `startColorStr` と共に引き継がれるよう、引数の受け渡しを徹底すること。

上記3点を加味した上で、残りの ResultRenderer.js の虹色グレア等の特殊描画ロジックを計画通り実装せよ。
