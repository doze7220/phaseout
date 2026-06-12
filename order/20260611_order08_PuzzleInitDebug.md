# 初期フレームのTime Spike（DeltaTime異常増大）の修正

あなたは優秀なゲームエンジニアです。
`PROJECT_ARCHITECTURE.md`と`PROJECT_FUNCTION_INDEX.md`の資料を把握し、取り組んでください。
パズル開始（PlaySceneへの遷移）直後に宝石の落下がカクつく・ぎこちなくなる現象を修正するため、グローバルな描画ループにおける `deltaTime` の計算スパイクを防止してください。

## 1. SceneManager / MasterRenderer の DeltaTime リセット機構の実装
- 現在、`MasterRenderer` の `requestAnimationFrame` ループから `SceneManager.update(deltaTime)` へ経過時間が渡されていますが、`SceneManager.changeScene` や `pushScene` で重い初期化処理が走った直後のフレームで、巨大な `deltaTime` が流入するタイムスパイクが発生している可能性があります。
- `SceneManager` 内に `this.isSceneChanged = false` のようなフラグを用意し、シーン切り替えが行われた直後のフレームでは、`MasterRenderer` のループ側で計算された `deltaTime` を無視して、強制的に `16.6ms`（60fps相当）として扱うか、あるいは前回のタイムスタンプ（`lastTime`）を `performance.now()` 等で現在時刻にリセットする処理を組み込んでください。

## 2. PlayScene の固定タイムステップ（Accumulator）との整合性確認
- `PlayScene.update` に渡される `deltaTime` が、いかなる場合（バックグラウンド移行からの復帰や重いシーンロード直後など）であっても異常な数値にならないよう、シーン開始時の初期 `deltaTime` が極めて滑らかに Matter.js へ渡されることを保証してください。

## 3. ドキュメントの更新
- 作業完了後、`changelog.js`、`PROJECT_ARCHITECTURE.md` および `PROJECT_FUNCTION_INDEX.md` を更新し、リビジョンをカウントアップ。作業内容を各資料に反映してください。ただし調査の結果問題がなければ、反映は不要です。

完了要件:
タイトル画面からパズル画面へ遷移した直後、上から落下してくる大量の初期宝石が、1フレーム目から一切のコマ落ちやぎこちなさを見せず、極めて滑らかに物理落下すること。
