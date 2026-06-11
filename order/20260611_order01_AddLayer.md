# 【フェーズA】MasterRendererの12層構造化とエフェクト層の完全移行

あなたは優秀なゲームエンジニアです。
『PHASE OUT: Cluster Stirring』において、描画パイプラインの堅牢化と、ポストエフェクトのZ-Index整理を行います。`PROJECT_ARCHITECTURE.md`の資料を参照しながら進めてください。

## 【タスク1】MasterRendererの12層レイヤー定義
1. `js/render/MasterRenderer.js`（または関連するレンダーループ管理ファイル）のレイヤー定数を、以下の12層構造にアップデートしてください。
   - 1: BACKGROUND (背景、グリッド)
   - 2: BEHIND_GEMS (宝石背面のレーザー等)
   - 3: GEMS (宝石本体)
   - 4: FOREGROUND_EFFECTS (破片、火花)
   - 5: FRONT_EFFECTS (ヒットフラッシュ等)
   - 6: IN_GAME_POST_EFFECT (★新規: UIに被らない盤面専用ポストエフェクト)
   - 7: UI_BASE (基本UI)
   - 8: POPUP_TEXT (ポップアップテキスト)
   - 9: MODAL_UI (モーダルウィンドウ)
   - 10: GLOBAL_POST_EFFECT (★更新: 画面全体を覆うポストエフェクト)
   - 11: SYSTEM_TOP (最前面UI、波紋など)
   - 12: DEBUG_OVERLAY (★新規: FPSメーター、デバッグ情報など)

## 【タスク2】エフェクトのクリーンアップとレイヤー6への移動
1. `js/render/ScreenEffects.js` 等に実装されている「ステイシス（白黒化）」および「ピンチ（赤ヴィネット）」の演出について、DOM操作やCSSクラス付与のための余計なフラグ管理（`classList.add`等）が残っていれば完全に除去してください。
2. これらのエフェクトのCanvas描画処理（`ctx.filter` や `ctx.createRadialGradient` による補間描画）を、タスク1で新設した **第6層（IN_GAME_POST_EFFECT）** の描画フック内で実行されるように移動・紐付けを行ってください。これにより、UI（第7層以上）には一切エフェクトがかからない状態を確立します。

## 【タスク3】デバッグ表示のレイヤー12への移動
1. 現在画面に表示されているFPSメーターや、WAVE/BLOCKモードの「破壊数デバッグ表示」（`Visualizer.js`内等）の描画レイヤーを、新設した **第12層（DEBUG_OVERLAY）** へ移動してください。

## 【タスク4】ドキュメントの更新
- 作業完了後、`changelog.js` および `PROJECT_ARCHITECTURE.md` の「Canvas描画順序 (Z-Index)」の項目を今回の12層構造に更新してください。バージョンは適宜加算してください。

完了要件:
エラーなくゲームが起動し、ステイシスやピンチ演出がUIの下（パズル盤面のみ）に正しくCanvas描画されること。完了後、報告をお願いします。
