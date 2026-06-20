# PhaseShift 演出ブラッシュアップ (フェイズ1 & 2): 背景マネージャーの新設と描画責務の整理

## 目標
現在の散らかった背景・フェイズ演出の描画責務を整理し、今後の高度な背景演出（星空、予兆波紋、逆再生など）の土台となる純粋なマネージャーモジュール `BackgroundManager.js` を新設する。
同時に、既存の前面レイヤー（第6層等）で行われていたフェイズ演出のハードコードを削除し、第1層（BACKGROUND）へと権限を移譲・統合する。

## 実装ステップ

### 1. [NEW] `js/render/BackgroundManager.js` の新設
* 第1層（BACKGROUND）の最奥に描画される背景専用のマネージャーを新規作成してください。
* `updateAndDraw(ctx, GameState, PhaseManager)` のような描画メソッドを用意し、フェイズ状態（`PhaseManager.getCurrentPhaseName()` 等）に応じて背景色を制御するベース構造を構築します。
* 今後のフェイズ3～5に向けた「星空描画」「予兆波紋描画」「逆波紋アニメーション」などを組み込むためのメソッドの枠（スタブ）を内部に用意しておいてください（今は中身は空で構いません）。

### 2. [MODIFY] `js/render/ScreenEffects.js` 等の大掃除（既存実装の削除・移行）
* `ScreenEffects.js` の第6層（`drawInGamePostEffects`）等にハードコードされている「ホワイトフェイズ中の背景の白飛び・反転（lighter や difference による画面全体への影響など）」処理を **完全に削除** してください。
* 過去のバージョン（v0.26.4等）で実装された「フェイズ突入時のSonar Ripple（ソナー波紋）」や、前面レイヤーで強引に背景を塗りつぶしていた処理があれば、それらも削除してください。（※タップ波紋の RippleManager はシステム現実時間のエフェクトなのでそのまま残すこと）
* これらの「ホワイトフェイズ時の背景表現（反転や白の空間）」は、すべて新設した `BackgroundManager.js` 側で（第1層として）描画するようにロジックを移譲・再構築してください。

### 3. [MODIFY] `js/render/effects.js` (Facade) の更新
* `BackgroundManager` のインスタンスを生成し、初期化時に `clear` 等ができるようFacadeに組み込んでください。
* `setupEffectsRenderer` にて、第1層（`MasterRenderer.registerLayer(1, ...)`）の **一番最初** に `BackgroundManager.updateAndDraw` が呼ばれるようにコールバックを登録してください。
* 現在第1層を使っている `Visualizer.js` の描画よりも先に実行し、完全に「最背面」となるように徹底してください。

## 実行にあたっての厳守事項
・バージョンは vXX.YY.ZZ のうち、ZZ をカウントアップすること（今回は v0.26.9 となる想定）。
・この実装は「器の作成」と「責務の整理」が目的です。この段階で新しい演出（星空など）自体を作り込まず、まずは移行後の状態でバグなくゲームが進行し、ホワイトフェイズ中の背景反転等が「第1層」で正しく機能することを確認してください。
・作業終了時に `changelog.js`、並びに開発資料（`PROJECT_FUNCTION_INDEX.md` や `PROJECT_ARCHITECTURE.md` 等）に最新の変更を反映してください。
