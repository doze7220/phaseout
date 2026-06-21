# 実装指示書：PHASE_WHITE_EXIT 終了演出シーケンスの実装

## 目的
ホワイトフェイズの終了（シフトゲージ0到達）に伴う「PHASE_WHITE_EXIT」の演出を実装する。
「突入」とは対極となる、「静止」→「トライバル逆再生」＆「ログの表示」→「通常世界への引き戻し（BGM再開）」というトランジションを `ScreenEffectTransition.js` を用いて実現する。

## 前提条件（アーキテクチャ厳守）
*   演出の進行度（`elapsed`）は、必ず `realDelta`（システム実時間）を加算して管理すること。
*   描画はすべて `ScreenEffectTransition.js` 上（第10層 GLOBAL_POST_EFFECT）で行うこと。
*   各演出フェーズの所要時間は、`config.js` の `EFFECT_MATH_CONFIG.PHASE_WHITE_EXIT` として定数化すること。
*   各時間はPHASE_WHITE_ENTERを参考にすること。

## 演出タイムラインと実装ステップ

### 1. ステイシスと無音化
*   **発火:** `PhaseManager` がシフトゲージ0を検知し、`PHASE_WHITE_EXIT` に移行した瞬間。
*   **状態:** `isPuzzlePaused = true` となり物理演算が停止。
*   **サウンド:** `SoundManager` を利用し、BGMを0.5秒のフェードで停止させて完全な静寂を作る。

### 2. トライバル逆再生（理の崩壊） ＆ ログ表示
*   **描画:** 突入時（ENTER）に展開した7つのトライバルの円を、今度は「定位置から画面中央（特異点）へ向かって、凄まじい速度で逆再生（縮小・収束）」させる。
*   **ログ表示:** トライバルの崩壊と連動し、画面中央に等幅フォント（monospace）で以下のシステムログをセンタリング描画する。行ごとに config.js で表示タイミング（ミリ秒）を制御できるようにすること。

    ```text
    PHASE STABILIZATION : FAILED
    REVERTING TO FRAGMENTED DIMENSION...
    
    [ PHASE ROLLBACK ]
    
    " SEVENTH PALETTE "
    ```

### 2.1 トライバル逆再生の詳細シーケンス
ステイシス演出で画面硬直後、以下の順でアニメーションさせる。トライバルの描画の仕組みはPHASE_WHITE_ENTERを参考にすること。
1. 画面外から白い円がワイプインする。
2. 画面中央でトライバル完成形を表示し、ログ表示を開始する。
3. トライバルが純白から「元の各虹色（7色）」へと逆変化（フェード）する。
4. ドーナツ状の円がライン状になる。
5. ラインが描画時のポイントを元に、左右から中央に向かって縮まっていく。
6. トライバルが中央で完全に消失する。

### 3. ホワイトフラッシュ（トランジション・アウト）
*   トライバルが消失した直後、画面中央から **透明な円形の穴（`globalCompositeOperation = 'destination-out'` を用いた `arc` 描画）** を爆発的な速度で広げる。
*   このワイプにより、上層に覆い被さっていた「白黒反転した異常空間（ステイシス演出）」をくり抜いて消し去り、下層の「通常の星空背景」と「元の色を取り戻した宝石たち」を露出させる。

### 4. 【再始動】通常パズル遷移開始とBGM再開
*   トランジションアウトが終了（ステイシス演出が完全に消え去った）した瞬間、`PhaseManager` を `PHASE_NORMAL` へ移行させる。
*   **状態:** 0.5秒かけて硬直を解く。硬直が解けた瞬間に `isPuzzlePaused = false` となりパズルが再始動。
*   **サウンド:** 先のバグ修正で実装した通り、`GameState.currentBgmState` を引数として `SoundManager.restartCurrentStageBgm()` を呼び出し、突入前（または現在の盤面状態）のBGMを0秒から力強く再開させる。

## 実行要件
以上のタイムラインを `PhaseManager.js` のタイマー管理と `ScreenEffectTransition.js` の描画ロジックを連携させて実装しなさい。コードは突入演出（ENTER）と同様にカプセル化を徹底すること。
まずは `config.js` に `EFFECT_MATH_CONFIG.PHASE_WHITE_EXIT` の定数（各フェーズのミリ秒とログの配列）を定義することから始めること。
