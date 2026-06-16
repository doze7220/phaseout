# Pリンク実装計画の追加修正指示：経験値（EXP）計算の加重平均化

## Goal
提示された実装計画書 `20260615_order02_feat_prism_link_complete_implementation_plan.md` における、経済層（`logic.js` の `finalizeDestruction`）の経験値計算ロジックについて、「代表色（最大個数）を基準とする」アプローチを破棄し、新たに**「連鎖に巻き込んだ全色の個数割合に基づく加重平均」**へと修正を提案する。

## 修正内容詳細

### 1. `logic.js` (`finalizeDestruction`) の EXP算出ロジック変更
混色連鎖（Pリンク）発生時の獲得経験値（EXP）の算出方法を、以下のステップを踏む。

1. **基本経験値の算出**: 従来通り、連鎖の総数（`chainLength`）を用いて基本値を計算する。
   `baseExp = Math.round(chainLength * (CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY / (chainLength + CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY)))`
2. **加重平均による最終効率の算出**: 連鎖に含まれる各色（`colorCounts`）ごとに、個別のEXP効率を計算し、それを連鎖内の個数割合で加重平均する。
   - `各色の効率 = minDestroyCount / GameState.colorDestroyCounts[color]`
   - `加重平均効率 (weightedEfficiency) = Σ ( 各色の効率 * (その色の連鎖内個数 / chainLength) )`
3. **最終獲得EXPの決定**: 基本経験値に加重平均効率を掛け、従来通り切り上げ（`Math.ceil`）て最終獲得EXPとする。
   `finalExp = Math.ceil(baseExp * weightedEfficiency)`

### 2. 期待される挙動
この修正により、連鎖に巻き込んだすべての色の状態（効率）が、その個数割合に応じて1ドットの理不尽もなく公平に最終経験値へ反映されるようになります。プレイヤーが「効率の落ちた色」を「効率の高い別色」とプリズムリンクでかき混ぜる（中和する）という戦略的プレイングが成立すると推測できる。

## 実行指示
上記の内容で実装計画の「EXPの色別減衰」の項目を脳内でアップデートし、妥当性があるかどうかを判断すること。問題がないようであれば先の作業計画書に反映を行う。
