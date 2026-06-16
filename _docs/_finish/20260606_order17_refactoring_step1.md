 ブラッシュアップ版：Step 1 用 AI-IDEプロンプト
あなたは優秀なゲームエンジニアです。
パズルゲーム『Phase Out: Cluster Stirring』のアーキテクチャ文書（PROJECT_ARCHITECTURE.md）の「8. 今後のリファクタリング・分離候補」に基づき、Step 1 として `renderer.js` のリファクタリングを実行してください。

【現状の課題】
`renderer.js` が700行を超過し、「純粋な宝石の盤面描画」と「UI・スコア用のスプライト素材生成・テキスト描画」の責務が混在してしまっています。

【実装要件】
1. `js/render/` ディレクトリ内に、新規ファイル `ScoreRenderer.js` を作成してください。
2. `renderer.js` の中から以下の機能を新規ファイルへ完全に分離・移行してください。
   - スコアやフローティングテキストの事前生成（Canvasキャッシュ）処理（`initScoreSpriteCache` 等）
   - 文字列や単位（万・億など）の Canvas スプライト結合・描画ロジック（`getScoreSprite`, `drawScoreToCanvas`, `drawTextToCanvas` 等）
3. 依存関係の整理を徹底してください。
   - `renderer.js` 側からは該当のコードを削除してください。
   - `main.js` や `ScreenEffects.js` など、これらの関数を呼び出している他のファイル群の `import` パスを `ScoreRenderer.js` を向くように適切に修正してください。
   - アーキテクチャルールに則り、`index.html` には `<script>` タグを追加せず、すべて ES Modules (`import/export`) の依存関係グラフで解決してください。
4. リファクタリング後も、現在のゲームの画面表示（スコア表示やテキスト表示）が一切崩れず、従来通り動作することを保証してください。
