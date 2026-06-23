# 【目的】
ゲーム起動直後に一瞬パズル画面（ヘッダ等）が描画されてしまう現象を修正し、シームレスで美しい起動シーケンスを確立する。

## 【修正対象ファイルと実装内容】

### 1. `style.css` (または `index.html`) の修正
- `<canvas>` 要素の初期背景色を「白（`#ffffff`）」に設定し、JavaScriptロード前から画面が白くマクスされるようにする。

### 2. `main.js` の初期化フローの修正
- `MasterRenderer.init()` 等でCanvasの `ctx` を取得した直後に、ただちに画面全体を白(`ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);`)で塗りつぶす処理を1行追加し、1フレーム目のフライング描画を完全に隠蔽する。
- SceneManagerに初期シーンを渡す処理において、フェード遷移のフラグを `false` に設定する。
  修正前（推測）: `SceneManager.changeScene(new BootScene(), true)` またはデフォルト呼び出し
  修正後: `SceneManager.changeScene(new BootScene(), false)`

### 3. (確認事項) `BootScene.js` の遷移仕様
- BootScene から TitleScene への遷移時は、v0.14.1 の仕様通り、白から黒へのコントラストを活かすため「フェードスキップ（useFade = false）」で即時遷移するよう設定されていることを維持・確認すること。
