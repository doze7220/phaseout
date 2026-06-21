# 実装指示書：ホワイトフェイズ発生回数に応じたシフトエネルギー減衰システム

## 目的
プレイヤーの無限ループ（熱的死）を防ぐため、1プレイ中のホワイトフェイズ突入回数に応じて、フェイズシフトゲージの獲得量を動的に減衰（0.8の累乗）させる仕組みを実装する。

## 変更対象ファイル
*   `js/core/config.js` (定数および状態の追加)
*   `js/core/PhaseManager.js` (カウントアップおよび減算処理)
*   `js/core/logic.js` (計算ロジック。現在の実装箇所に準ずる)

## 実装手順

### 1. 定数と状態の追加 (`config.js`)
*   `PHASE_SHIFT_MATH` （またはそれに準ずる定数オブジェクト）内に、獲得量減衰率の定数 `GAUGE_ACQUISITION_DECAY_RATE: 0.8` を追加する。
*   `GameState` オブジェクトのプロパティに `whitePhaseCount: 0` を追加し、現在のホワイトフェイズ突入回数を記録する。
*   `GameState.reset()` 関数内に `this.whitePhaseCount = 0;` を追加し、リトライ時に確実にリセットされるようにする。

### 2. ホワイトフェイズ回数のカウントアップ (`PhaseManager.js`)
*   `enterWhitePhase()` メソッド内（ホワイトフェイズへ突入する処理）に、`GameState.whitePhaseCount++;` を追加し、突入のたびにカウントをインクリメントする。

### 3. シフトエネルギー獲得量の減衰計算 (`logic.js` 側、または `PhaseManager.js` の `addPhaseGauge` 側)
*   フルリンク達成時にゲージ加算量（基本獲得量）を算出してフェイズゲージに加算する処理（`PhaseManager.addPhaseGauge(total, prismDepth)` 等）を改修する。
*   計算された基本獲得量に対し、以下の減衰式を適用する。
    `最終獲得量 = 基本獲得量 * Math.pow(PHASE_SHIFT_MATH.GAUGE_ACQUISITION_DECAY_RATE, GameState.whitePhaseCount)`
*   ※ 現在のアーキテクチャ上、加算量の算出を `logic.js` で行っているか、`PhaseManager.js` 内で行っているかに合わせ、最も自然で適切な場所（Single Source of Truth を汚さない場所）で乗算を行うこと。

## 前提条件・アーキテクチャ厳守
*   マジックナンバー（`0.8`）は必ず `config.js` へ抽出し、コード内に直書きしないこと。
*   `GameState` に追加したプロパティは、リザルト画面からのリトライ時等に意図せず引き継がれないよう、`reset()` での初期化を絶対に忘れないこと。
