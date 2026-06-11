# TitleSceneのUX/UI改修およびGEMスタイルのConfig移管

あなたは優秀なゲームエンジニアです。
Canvas完全移行に伴うUX向上およびバグ修正として、以下の3点の改修を一気に実行してください。

## 1. タイトルアニメーション（落下・爆散）の復活と結線修復
- 現在 `TitleScene.js` の背景で動かなくなってしまっている `title-animation.js` のアニメーションを完全に復活させてください。
- `TitleScene.js` の `init()`, `update(deltaTime)`, `draw(ctx, layerId)` の各メソッド内で、`initTitleAnimation()`, `updateTitleAnimation()`, `drawTitleAnimation()` などの必要な関数が正しく呼び出され、画面いっぱいに宝石が落下し、爆散する美しいパーティクル演出が描画されるように結線を修復してください。

## 2. TitleScene.js の全画面タップSTART化
- 現在 `TitleScene.js` に配置されている「START」テキストボタンを廃止してください。
- 代わりに `UI.FullScreenTap` をUIの最下層に配置し、画面のどこかをタップしたら `SceneManager.changeScene(new PlayScene())` へ遷移するようにしてください。
- 既存の「CONFIGボタン」はそのまま残し、`FullScreenTap` よりもZ-Index的に上（配列の末尾側）に登録してタップ判定が優先されるように構成してください。
- 画面中央付近に純粋なCanvasテキスト描画（fillText等）で「TAP TO START」を描画し、`deltaTime` とサイン波などを用いてアルファ値を滑らかに明滅（Blinking）させる演出を追加してください。

## 3. ConfigScene.js へのGEM STYLE（宝石スタイル）設定の追加
- `ConfigScene.js` のウィンドウ内に、「宝石スタイル設定 (FLAT / RICH)」を切り替えるためのUI（トグルやボタン等）を追加してください。配置座標は `config.js` の `LAYOUT_CONFIG` に準拠させて計算してください。
- コンフィグ内で FLAT / RICH が切り替えられた際、`config.js` の `GRAPHICS_CONFIG.GEM_STYLE` を更新してください。
- 更新した直後に、必ず `SpriteCacheManager.generateAllCaches()` を呼び出してください。これにより、変更した瞬間にパズル盤面やタイトルの落下宝石の見た目が即座に新しいスタイルで再描画されるようになります。

## 4. ドキュメントの更新
- 作業完了後、`changelog.js` のバージョンを `v0.11.8` に加算し、「タイトルアニメーションの復活」「TitleSceneの全画面タップSTART化」「GEMスタイル設定のコンフィグ移管」について記載してください。

完了要件:
タイトル画面の背景で宝石の落下・爆散アニメーションが正常に動作していること。CONFIGボタン以外の任意の場所をタップするとパズルが開始されること。また「TAP TO START」が中央で明滅していること。コンフィグ内で宝石の見た目(FLAT/RICH)を切り替えられ、パズル中であっても即座に盤面に反映されること。
