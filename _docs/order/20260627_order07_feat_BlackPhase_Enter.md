# 実装指示書：ブラックフェイズ突入演出（PHASE_BLACK_ENTER）の完全実装

ホワイトフェイズの突入・解除演出のアーキテクチャ（タイムラインベースの描画）を踏襲し、「収縮と闇」をテーマにしたブラックフェイズ突入演出（ノアのハッキング・特異点誕生）を実装せよ。

## 1. コンフィグへのタイムライン定義（effectConfig.js）
`js/core/effectConfig.js` の `BLACK_PHASE_EFFECT_CONFIG` 内に、以下の突入タイムライン設定を追加せよ。
ウェイト（間）を調整できるよう、ホワイトフェイズを参考にした `WEIGHTS` を構築すること。

[追加する設定値]
PHASE_BLACK_ENTER: {
    STASIS_DELAY_MS: 1500,         // [3] 黒のステイシス・スプライト生成完了までのタメ
    FLICKER_DURATION_MS: 1000,     // [4] 画面の黒点滅とブラックアウト
    TRIBAL_TOTAL_MS: 6000,         // [2] 十字の楔と7つの輪の収縮アニメーション全体時間
    TRANSITION_OUT_FADE_MS: 1000,  // [5] ブラックフェーズ本編へのフェード
    STASIS_ENTER_FADE_MS: 500,
    TRIBAL_WEIGHTS: {
        WIPE_IN: 0.2,       // 3.1 7つの輪の収縮ワイプ
        WAIT_1: 0.1,        // 間
        DRAW_LINES: 0.25,   // 3.2 鏃(やじり)型の線引きアニメーション
        WAIT_2: 0.05,       // 間
        FILL_BLACK: 0.2,    // 3.3 鏃の黒塗り＆7つの輪の隙間塗りつぶし
        WAIT_3: 0.05,       // 間
        FINISH: 0.15        // 3.4 黒円の白フチ付与＆十字のフェードアウト
    }
}

## 2. 黒化スプライト生成（SpriteCacheManager.js）
`SpriteCacheManager.generateAllCaches` を拡張し、第2引数等で `isBlackPhase` フラグを受け取れるようにせよ。フラグが真の場合、宝石の描画処理（`_drawRichGem`等）において、宝石の輝度を大きく落とす、または黒色（rgba(0,0,0, 0.7)等）を `source-atop` で合成し、「黒ずんで生気を失った宝石」のキャッシュを生成すること。
この再生成は、PHASE_BLACK_ENTERのステイシス（初期タメ）期間の冒頭で実行する。

## 3. 突入シーケンスの描画（ScreenEffectTransition.js）
ホワイトフェイズのトランジションを管理している `ScreenEffectTransition.js`（または新規ファイル）にて、`currentPhase === PHASE_BLACK_ENTER` の時の描画処理を実装せよ。

*   **[Step 1-2] 点滅とフェード:**
    開始から `FLICKER_DURATION_MS` までは、ランダムなアルファ値で黒画面を明滅（フリッカー）させ、最終的に黒ベタ塗りにする。
*   **[Step 3] ログ表示:**
    `TRIBAL_TOTAL_MS` の期間中、画面中央付近にシステムログ（"BLACK RESURRECT" 等の警告）を描画する。フォント色は黒（#000000）、フチ（stroke）を白（#ffffff）とし、不気味な存在感を出すこと。
*   **[Step 3.1〜3.4] トライバルアニメーション:**
    `TRIBAL_WEIGHTS` の比率に従い、以下のCanvasアニメーションを進行させよ。
    *   **3.1:** 画面サイズから中央のBH初期サイズへ向かって、7つの同心円（線）が収縮していく。
    *   **3.2:** BHサイズで円が停止。同時に、中央から外側へ向かって十字の楔（鏃の形）のパス（`lineTo`）をアニメーションで引く。起点は先端・鏃尻の凹み部分の頂点とする。線の色は白。
    *   **3.3:** 引いた鏃のパス内を黒で塗りつぶす（`fill`）。同時に、中央の7つの円の隙間も黒で塗りつぶし、完全な一つの漆黒の円にする。
    *   **3.4:** 漆黒の円の周囲に白いフチ（stroke）を描く。同時に、描画した十字の楔（鏃）の透明度（globalAlpha）を下げてフェードアウトさせる。
*   **[Step 4] BGM再生:**
    突入完了時、SoundManager を通じてBGM `phase_break` の再生を開始し、`PHASE_BLACK` へ移行する。
