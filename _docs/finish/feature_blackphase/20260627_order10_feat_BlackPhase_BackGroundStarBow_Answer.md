提案内容とオープンクエスチョンを確認した。描画ロジックの設計は完璧である。

しかし、定数の追加先について `config.js` に追記する方針は**却下（Reject）**する。
アーキテクチャの定義（PROJECT_ARCHITECTURE.md）において、エフェクト設定は `effectConfig.js` で一元管理することが義務付けられている。現在 `STARRYSKY_CONFIG` が `config.js` に残存しているのは過去のリファクタリングにおける「分離漏れ（技術的負債）」である。

したがって、本実装において以下の**リファクタリング**を同時に実行せよ。

## 1. STARRYSKY_CONFIG の effectConfig.js への完全移行
*   `js/core/config.js` に存在している `STARRYSKY_CONFIG` を完全に削除する。
*   `js/core/effectConfig.js` 内に `STARRYSKY_CONFIG` を新設（移動）し、そこに今回の新しいパラメータ（`BLACK_HOLE_SUCTION_SPEED_BASE`, `BLACK_HOLE_SUCTION_ACCEL`, `STREAK_LENGTH_MULTIPLIER`）を追加すること。
*   `js/render/BackgroundManager.js` 等で `STARRYSKY_CONFIG` を参照している箇所について、import元を `config.js` から `effectConfig.js` へ正しく修正し、参照エラーを出さないようにすること。

上記のリファクタリングを加味した上で、提案された `BackgroundManager.js` のロジック改修（ワープ逆再生とストリーク描画）を実装せよ。
