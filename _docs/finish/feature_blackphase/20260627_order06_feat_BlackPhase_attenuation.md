# 実装指示書：ブラックフェイズの寿命（動的加速減衰）ロジックの修正

テストプレイの結果、ブラックフェイズの寿命を管理するブレイクゲージの減衰ロジックにおいて、「時間経過による加速」が全く機能しておらず、さらに通常時の減衰処理と重複している致命的な不具合を確認した。以下の手順でアーキテクチャを修正せよ。

## 1. 減衰処理の重複排除（排他制御）
`js/core/PhaseManager.js` の `update` 関数内において、「通常時のブレイクゲージ自然減衰」が `PHASE_BLACK` 中も実行されてしまっている。
*   **修正:** 現在のフェイズが `PHASE_BLACK` である間は、この「通常時のブレイクゲージ自然減衰（`SHIFT_DECAY_MULT`等を用いた基礎減衰）」処理を完全にスキップ（returnまたはif文で隔離）させ、ブラックフェイズ専用の減衰処理のみが単独で適用されるようにせよ。

## 2. ブラックフェイズ専用の経過時間カウンターの導入
動的加速減衰の計算式における `t`（経過時間）が正しく算出されていない。
*   `js/core/PhaseManager.js` のクラスプロパティ（またはローカル変数として適切な状態管理場所）に、ブラックフェイズの経過時間を計測する専用カウンター（例: `this.blackPhaseElapsedTime = 0`）を追加せよ。
*   `enterBlackPhase()` のタイミングで、このカウンターを必ず `0` にリセットせよ。

## 3. 動的加速減衰の正しい適用と計算式の修正
*   `js/core/PhaseManager.js` の `update` 関数内の `PHASE_BLACK` 更新処理において、毎フレーム `this.blackPhaseElapsedTime += deltaTime` （または `gameDelta`）を加算せよ。
*   この経過時間（秒単位に変換した値 `t = this.blackPhaseElapsedTime / 1000`）を用いて、以下の式で毎フレームの減衰量を正しく計算せよ。
    `decayAmount = (BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * Math.pow(t / BLACK_DECAY_TIME_DIVISOR, BLACK_DECAY_POWER)) * SHIFT_DECAY_MULT * (deltaTime / 1000)`
*   計算した `decayAmount` を `GameState.breakGauge` から減算し、0以下になったら `PHASE_BLACK_EXIT` へ移行させる処理を実行すること。

