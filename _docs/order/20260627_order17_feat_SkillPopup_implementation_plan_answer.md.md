**修正指示：描画責務の分離（Facadeパターンの遵守）**
`ScreenEffectPopup.js` はあくまで外部へAPIを提供する「Facade（窓口）」クラスであり、内部に直接描画ロジックや配列を保持してはならない（インデックス資料の定義参照）。

1. **`SkillPopupRenderer.js` の新設**
   * `js/render/SkillPopupRenderer.js` を新規作成せよ。
   * 提案にある `skillPopups` 配列の管理、`update`（寿命管理）、および `draw`（マッピング逆算とテキスト発光描画）のすべてのロジックをこのクラス内にカプセル化して実装せよ。
2. **`ScreenEffectPopup.js` での委譲**
   * コンストラクタで `this.skillPopupRenderer = new SkillPopupRenderer()` を生成せよ。
   * `showSkillPopup`、`update`、`drawPopups` （または `draw`）の各メソッドにおいて、自身では直接処理を行わず、すべて `this.skillPopupRenderer` へ処理を委譲するように実装せよ。

