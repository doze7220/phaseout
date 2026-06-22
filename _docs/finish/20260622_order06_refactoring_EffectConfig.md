# 実装指示書：エフェクト・描画設定の分離と `effectConfig.js` の新設

## 目的
`config.js` の肥大化を防ぎ、テクニカルアーティスト（エフェクト担当）の管轄領域を明確に分離するため、エフェクトおよびグラフィックスに関する定数群を新設する `effectConfig.js` へ隔離する。

## 実装手順

### 1. `js/core/effectConfig.js` の新設
*   `js/core/effectConfig.js` を新規作成する。
*   現在 `js/core/config.js` 内に存在する以下の巨大オブジェクトをまるごと切り取り、`effectConfig.js` へ移動してエクスポート（`export const`）する。
    1.  `GRAPHICS_CONFIG` （宝石スタイル、刻印設定など）
    2.  `EFFECT_MATH_CONFIG` （パーティクル、画面揺れ、PRISM_LINKなどのエフェクト数式パラメータ全般）
*   ※ `config.js` 側に依存する定数（もしあれば）は適宜インポートして解決すること。

### 2. 依存先ファイルのインポート修正
*   上記2つの定数を `config.js` からインポートして使用しているすべてのファイル（`renderer.js`, `SpriteCacheManager.js`, `ScreenEffectPopup.js`, `ParticleManager.js`, `LaserEffect.js` 等）を検索する。
*   該当箇所のインポート元を `'../core/config.js'` 等から `'../core/effectConfig.js'` へと正しく書き換える。

### 3. 資料の更新
*   本リファクタリングが完了したら、`PROJECT_ARCHITECTURE.md` の「データ定義層」の表に `effectConfig.js` の項目を追記し、`config.js` の説明から該当箇所の記載を削除してバージョンを更新すること。

## 制約事項
*   これは純粋な「ファイルの分離・移動」と「インポートパスの修正」のみを行うリファクタリングタスクです。機能の変更や、既存のパラメータ値の変更は一切行わないでください。
