# UIComponents.js の設立とUIクラス群の整理

あなたは優秀なゲームエンジニアです。 
パズルゲーム『PHASE OUT ∴ Cluster Stirring』において、Canvas用共通UIコンポーネントを作成します。
`PROJECT_ARCHITECTURE.md`と`PROJECT_FUNCTION_INDEX.md`の資料を把握し、取り組んでください。

1. ファイルの新設と統合:
   - `js/render/UIComponents.js` を新設し、グローバル（またはモジュール）な名前空間 `UI` を定義してください。
   - 先ほど作成した `ScrollableTextUI.js` の中身をこのファイルに移動し、`UI.ScrollArea` クラスとしてリネーム・統合してください（元のファイルは削除し、参照元も修正すること）。

2. 汎用コントロールクラスの作成（継承と役割の分離）:
   - 以下のUIコントロールクラスを `UIComponents.js` 内に実装してください。
   ① `UI.BaseControl`: (基礎クラス) 座標、サイズ、ホバー/タップ状態の管理、および `UIManager` 等へのヒット領域・コールバック登録のガワを持つ共通親クラス。
   ② `UI.TextButton`: `BaseControl`を継承し、矩形の背景、枠線、および中央にテキストを描画するボタンクラス。
   ③ `UI.ImageButton`: `BaseControl`を継承し、画像（AssetManagerから取得した画像オブジェクト）をスケールして描画するボタンクラス（コンフィグや閉じるボタン用）。
   ④ `UI.ToggleSwitch`: `BaseControl`を継承し、ON/OFFの状態（boolean）を保持し、タップで状態が切り替わるスイッチクラス（文字色や背景色でON/OFFを視覚的に表現する）。

3. 共通仕様:
   - すべてのコントロールは `(x, y, width, height, ...options)` で初期化できるようにすること。
   - `updateAndDraw(ctx)` または `draw(ctx)` メソッドを持ち、内部でヒットテストやホバー/タップ状態の視覚的フィードバック（明るさの変更など）を自己完結して描画できるようにすること。

4. 完了要件:
    - `UIComponents.js` に上記クラス群が定義され、プロジェクトにエラーなく組み込まれること（今回はまだ実際のUIの置き換えまでは行わず、クラスの定義・統合だけで構いません）。完了後、報告をお願いします。
    - 資料更新: 必要に応じて `changelog.js`、`PROJECT_ARCHITECTURE.md`、`PROJECT_FUNCTION_INDEX.md` の資料を更新すること。
