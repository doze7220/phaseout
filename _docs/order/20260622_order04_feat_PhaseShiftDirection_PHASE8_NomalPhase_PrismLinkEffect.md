# 実装指示書：フルプリズムリンク達成時のアステライア昇華演出

## 目的
フルプリズムリンク（7色完遂）のスコア確定時、通常の「グリッチ消去」ではなく、7色のトライバルアイコンが中央で合体し、アステライアの紋章へと昇華・拡大消失する一連のカタルシス演出（およびシステムログ表示）を実装する。

## 変更対象ファイル
*   `js/core/config.js` (アニメーション用定数の追加)
*   `js/render/ScreenEffectPopup.js` (P-Link UIの消去・描画ロジックの分岐)

## 実装手順

### 1. 定数の定義 (`config.js`)
*   `EFFECT_MATH_CONFIG` 内の `PRISM_LINK` 関連オブジェクト等に、フルリンク完了時のアニメーションタイムライン定数を定義する。
    *   `MERGE_DURATION_MS`: 7つのアイコンが中央へ移動・合体するまでの時間（例: 400ms）
    *   `STAY_DURATION_MS`: アステライアのトライバルとログが表示されて停止している時間（例: 600ms）
    *   `EXPAND_DURATION_MS`: 瞬時に拡大し、透明になって消失する時間（例: 200ms）

### 2. 消去ロジックの特例分岐 (`ScreenEffectPopup.js`)
*   `hideChainPopup` 等から呼ばれる、P-Link UI（トライバルカウントダウン）の消去開始トリガー部分を改修する。
*   対象のP-Linkポップアップが **「フルリンク（Depth 7以上）」** であった場合、通常のグリッチ消去フラグではなく、専用の `isFullLinkMerging = true` フラグを立て、アニメーション用タイマー（`mergeElapsed`）を 0 にリセットして消去フェーズを開始する。

### 3. アステライア昇華・描画パイプライン (`ScreenEffectPopup.js`)
*   `drawPopups` 内のP-Link UI描画処理にて、`isFullLinkMerging === true` の場合、`mergeElapsed` の経過時間に応じて以下の3ステップのアニメーションをCanvasへ描画する。

#### 【Phase 1: 合体 (0 ～ MERGE_DURATION_MS)】
*   イージング関数（例: `easeInCubic` や `Math.sin`）を用いて、7つのアイコンそれぞれのX/Y座標を、本来の並び位置から「画面中央（UIの基点座標）」へ向かってスライド移動させる。
*   この移動中、前回の指示書で定義した「純白化 ＆ 虹色グレア (`source-in` + `shadowColor`)」を適用しながら移動させるとさらに良い。

#### 【Phase 2: 昇華とログ表示 (MERGE_DURATION_MS ～ +STAY_DURATION_MS)】
*   アイコンが完全に中央で重なった瞬間、描画する画像を **「アステライアのトライバル（白の理）」** に切り替える（※画像アセットがない場合は、純白の特殊な幾何学Canvas図形や、既存トライバルの白化複合体で代用・表現する）。
*   同時に、アステライアの紋章の直下（または中央揃え）に、以下のシステムログを等幅フォント(`monospace`)で描画する。
    `EQUILIBRIUM: SEVENTH PALETTE "THE LAWS"`
    `AXIOM RECOMPILE : COMMAND QUEUED.`

#### 【Phase 3: 拡大・消失 (+EXPAND_DURATION_MS)】
*   `mergeElapsed` が最終フェーズに入った瞬間、アステライアの紋章とログの `ctx.scale` を爆発的に拡大（例: 1.0 → 3.0）させつつ、`ctx.globalAlpha` を 1.0 → 0.0 へと減衰させる。
*   アニメーションが完了した時点で、該当のPopupオブジェクトを配列から破棄する。

## 前提条件・アーキテクチャ厳守
*   DOM操作は一切禁止。すべて `ScreenEffectPopup.js` 内のCanvas API（`ctx.drawImage`, `ctx.fillText`, `ctx.scale`, `ctx.globalAlpha` 等）で完結させること。
*   描画コンテキストは必ず `ctx.save()` と `ctx.restore()` で保護すること。
