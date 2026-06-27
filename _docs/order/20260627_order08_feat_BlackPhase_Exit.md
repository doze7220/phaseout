# 実装指示書：ブラックフェイズ復帰演出（PHASE_BLACK_EXIT）のベース実装

ブラックフェイズ終了時（ブレイクゲージ0到達時）の復帰演出（PHASE_BLACK_EXIT）を実装し、通常フェイズへの遷移ループを完成させよ。
アニメーションの詳細なブラッシュアップは後日行うため、まずは既存の `WHITE_PHASE_EXIT` のアーキテクチャをコピーして独立させ、以下の最低限の変更を加えて実装すること。

## 1. effectConfig.js の新規設定（Configの分離）
`BLACK_PHASE_EFFECT_CONFIG` 内に、復帰演出用のタイムライン設定 `PHASE_BLACK_EXIT` を新規作成せよ。
*   各時間設定（`STASIS_DELAY_MS` 等）やウェイト設定は、一旦 `WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE_EXIT` の値をそのままコピーしてよい。
*   ロールバックログの表示制御用として、以下の配列を設定すること（Y座標や時間は白のログ設定を参考にしてよい）。
    [ログ配列例]
    { weight: 0.15, offsetY: 24, text: "PHASE STABILIZATION : FAILED" }
    { weight: 0.25, offsetY: 48, text: "REVERTING TO FRAGMENTED DIMENSION..." }
    { weight: 0.40, offsetY: 96, text: "[ PHASE ROLLBACK ]" }
    { weight: 0.70, offsetY: 150, text: "\" SEVENTH PALETTE \"" }

## 2. 描画ロジックの分離とログのカスタマイズ (ScreenEffectTransition.js)
`drawPhaseWhiteExit` をコピーし、新規関数 `drawPhaseBlackExit` を作成せよ。`if`文による同一関数内での使い回しは禁止する。
*   アニメーション（トライバル逆再生やワイプアウト等）は一旦そのまま流用してよい。
*   ただし、システムログの描画部分のみ、上記で設定したブラックフェイズ用のロールバックログ（`LOG_TIMINGS`）を参照するように書き換えること。

## 3. フェイズ移行とカタルシストリガー (PhaseManager.js)
`PhaseManager.js` において、ブレイクゲージが0に到達した際、`PHASE_BLACK_EXIT` へ移行する処理を実装せよ。
*   移行直後、物理エンジンのステイシスを有効化し、BGMをフェードに応じて停止すること（`SoundManager.instantStopBGM()` 等を利用）。
*   同時に、実装済みの `flushBlackHolePool()` を呼び出し、一括獲得スコアと画面揺れを発火させること。ただしこちらについては実装と異なる可能性があるため、内容を吟味すること。
*   演出全体時間の経過後、ステイシスを解除し、元のBGMを最初から再生して通常パズルBGMへ復帰させること。その際の処理はWHITE_PHASE_EXITと同様に、NORMAL/FEAVERなど元の状態を維持すること。
