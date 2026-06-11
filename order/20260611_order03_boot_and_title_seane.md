# 起動シーケンス（BOOT / TITLE）の完全Scene化とDOM排除

あなたは優秀なゲームエンジニアです。
`PROJECT_ARCHITECTURE.md`と`PROJECT_FUNCTION_INDEX.md`の資料を把握し、取り組んでください。
『PHASE OUT: Cluster Stirring』において、現在DOMで制御されている起動画面（BOOT）とタイトル画面（TITLE）を、最新の `SceneManager` と `UIComponents.js` を用いた完全なCanvas Sceneへと移行します。

## 1. BootScene.js の新設
`js/scene/BootScene.js` を新規作成してください。
- `BaseScene` を継承すること。
- ブラウザの自動再生ポリシー（AutoPlay Policy）を解除するため、画面全体を覆う `UI.FullScreenTap` を配置してください。
- 画面中央に「TAP TO START」等のテキスト（Canvas描画）を表示すること。
- タップされたら `SoundManager.resumeContext()` を実行し、直後に `SceneManager.changeScene(new TitleScene())` を呼び出してタイトル画面へ遷移させてください。

## 2. TitleScene.js の新設
`js/scene/TitleScene.js` を新規作成してください。
- `BaseScene` を継承すること。
- `init()` 内で、既存の `title-animation.js` の `initTitleAnimation()` に相当する初期化を行い、背景アニメーションを準備してください。
- 画面上に以下のUIコンポーネント（UIComponents.js）を配置してください。
  1. `UI.TextButton`: 「START」ボタン。タップで `SceneManager.changeScene(new PlayScene())` へ遷移。
  2. `UI.ImageButton`: 「CONFIG」ボタン（歯車アイコン）。タップで `SceneManager.pushScene(new ConfigScene())` へ加算遷移（ConfigSceneは空のスタブクラスを仮作成して構いません）。
- `update()` と `draw()` の中で、`title-animation.js` のアニメーション更新・描画処理、および上記UIコンポーネントの `updateAndDraw()` を実行してください。

## 3. main.js と scene.js のクリーンアップ
- `main.js` のエントリポイント（初期化処理）を改修し、DOMの表示制御を全廃して、起動時に即座に `SceneManager.changeScene(new BootScene())` を呼び出すように変更してください。
- `index.html` から `#scene-boot` および `#scene-title` のDOM要素を削除（または非表示に）し、関連するCSSや `scene.js` 内の古いDOM遷移ロジックを取り除いてください。

## 4. ドキュメントの更新
作業完了後、`changelog.js`、`PROJECT_ARCHITECTURE.md` および `PROJECT_FUNCTION_INDEX.md` を更新し、`BootScene` と `TitleScene` の追加を反映してください。バージョンは適宜加算してください。

完了要件:
ゲーム起動時、完全Canvas駆動のBootSceneが表示され、タップでTitleSceneへ遷移。TitleSceneのStartボタンでPlaySceneへ移行できること。完了後、報告をお願いします。
