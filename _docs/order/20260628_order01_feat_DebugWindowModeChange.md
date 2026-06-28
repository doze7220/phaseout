# 実装指示書：デバッグウィンドウのカテゴリ拡張とキャラクターステートの可視化

キャラクターおよびスキルの実装に伴い、デバッグ情報の表示領域が不足している。
視認性を確保するため、現在のデバッグオーバーレイの描画を「PUZZLE（既存）」と「CHARACTER（新設）」の2カテゴリに分割し、コンフィグ画面のDEBUGタブから切り替えられるよう実装せよ。

下記事項を守りつつ、実行してほしい。
また、実装にあたっては以下の【開発・運用ルール】を厳守すること。

### 【開発・運用ルール】
*   **マジックナンバーの禁止:** エフェクト、計算式などで係数・定数を使う場合は、かならずconfig.jsやeffectConfig.js（またはLayoutConfig.js等）で定義を行うこと。ハードコーディングは絶対に禁止とする。ただしSkillManager.jsだけは例外とし、具体的な指示がない限りはモジュール内でマジックナンバー使用も許す。
*   **コンフィグのコメント義務化:** コンフィグに定義を行う場合は、必ずコメントを残すこと。

---

## 1. 状態管理の拡張（DebugConfig.js & config.js）
*   **`js/core/DebugConfig.js`**:
    *   デバッグオーバーレイのカテゴリ定数として `DEBUG_OVERLAY_CATEGORIES = { PUZZLE: 'PUZZLE', CHARACTER: 'CHARACTER' }` を新設せよ。
*   **`js/core/config.js`**:
    *   `GameState.debug` の初期化プロパティに、`overlayCategory: 'PUZZLE'`（デフォルト値）を追加せよ。

## 2. ConfigSceneへのUI追加
*   **`js/scene/ConfigScene.js`**:
    *   DEBUGタブを開いた際の上部（既存のDEBUGボタン群の上など適切な位置）に、`TabGroup` または `ToggleSwitch` などの既存UIコンポーネントを用いて、オーバーレイカテゴリの切り替えUIを動的に生成せよ。
    *   タップ時に `GameState.debug.overlayCategory` を変更するように結線せよ。

## 3. 描画ロジックの分割と拡張（DebugManager.js）
*   **`js/render/DebugManager.js`**:
    *   現在の `draw` メソッド内にある巨大な描画処理を、`_drawPuzzleState(ctx, GameState)` として分離せよ（内容は既存のまま）。
    *   新たに `_drawCharacterState(ctx, GameState)` メソッドを新設し、以下の情報を描画せよ（文字サイズやレイアウトは適宜整えること）。
        *   **編成＆チャージ状態**: `CharacterPuzzleManager` または `GameState.party` から各スロット（1〜3）のキャラID（または名前）と、`currentCharge / maxCharge` を取得して描画。
        *   **スキル実行キュー**: `SkillManager` から `activeSkillQueues` を取得し、実行中のキュー数、残りターゲット数、進行フレームを描画。
        *   **システムフラグ**: `GameState.isPuzzlePaused`, 現在の `PhaseManager` の `timeScale` などを描画。
        *   **チェイン中（保護）宝石**: 現在チェイン中（消去待機中、またはレーザー照射中）の宝石の数をカウントして描画。
    *   `draw` メソッドの大元で `GameState.debug.overlayCategory` を判定し、呼ぶメソッドを切り替えるよう実装せよ。

## 4. 動作確認とドキュメント更新
*   パズルを実行し、コンフィグからDEBUGタブを開き、デバッグ表示のカテゴリが切り替えられることを確認せよ。
*   「CHARACTER」モード時に、編成状態やスキル発動時のキュー進行、ステイシスフラグがリアルタイムに可視化されることを確認せよ。
*   完了後、インデックス資料（`FEATURE_ADD_CHARCTOR.md` 等）の更新を行うこと。
