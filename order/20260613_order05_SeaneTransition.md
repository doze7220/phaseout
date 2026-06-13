# SceneManagerへの共通トランジション（BI/BO）機構の組み込み

あなたは優秀なゲームエンジニアです。
各シーンファイルへのコードのベタ書きを防ぎ、将来的な演出拡張を容易にするため、`SceneManager.js` に共通のフェードトランジション機構を実装してください。

## 1. SceneManager.js の拡張（状態管理と入力ブロック）
- `SceneManager` にトランジション状態を管理するプロパティ（例: `isTransitioning`, `transitionAlpha`, `transitionState` (FADE_OUT / FADE_IN) 等）を追加してください。
- トランジションが実行中（`isTransitioning === true`）の間は、`handleInput` においてあらゆるタップ入力を無効化（ブロックして `return true`）し、遷移中の誤作動を防いでください。

## 2. changeScene メソッドの非同期トランジション化
- 既存の `changeScene(newScene)` を改修し、即座にシーンを切り替えるのではなく、以下のシーケンスで実行するようにしてください。
  1. **FADE_OUT（Black Out）:** 現在のシーンを維持したまま、一定時間（例: 300ms）かけて `transitionAlpha` を 0 から 1 へ増加させる。
  2. **シーン切り替え:** アルファ値が 1 に達した瞬間、現在のシーンを `destroy` し、`newScene` をスタックへ積んで `init` を実行する。
  3. **FADE_IN（Black In）:** 新しいシーンを描画しながら、一定時間（例: 300ms）かけて `transitionAlpha` を 1 から 0 へ減少させ、完了後に `isTransitioning` を解除する。

## 3. 第10層（GLOBAL_POST_EFFECT）での共通描画
- `SceneManager.js` の `draw` メソッドの最後、または `MasterRenderer` の第10層のフックにおいて、トランジション実行中の場合は `ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`` で Canvas 全体を塗りつぶす処理を実行してください。

## 4. 各シーンの既存コードのクリーンアップ（もしあれば）
- 過去の実装（DOM時代等）で、`ResultScene` や `TitleScene` などの個別のファイル内にタイマーやCSSを使った暗転・フェードイン処理がベタ書きされている場合は、それらを削除し、この新しい `SceneManager` の共通トランジションに委譲させてください。

## 5. ドキュメントの同期・保護
- このチャットで行われた作業が、全て下記資料に反映されているかをチェックしてください。
- 資料と差異があった場合は、現在の実コード（.js群）を正としてドキュメントを更新してください。ただしこのチャット以外で作業を行った可能性があるため、必ず実装を確認すること。
- リビジョンはカウントアップせず、最新のリビジョンの内容として上書き・追記してください。
  - D:\ozlab\phaseout\PROJECT_ARCHITECTURE.md
  - D:\ozlab\phaseout\PROJECT_FUNCTION_INDEX.md
  
完了要件:
タイトルからパズルへ、パズルからリザルトへ遷移する際、必ず画面が黒くフェードアウトし、新しいシーンへとフェードインすること。また、トランジション中は一切のタップ操作を受け付けないこと。
