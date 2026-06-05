あなたは優秀なゲームエンジニアです。
パズルゲーム『Phase Out: Cluster String』において、プロジェクトのディレクトリ構造を整理するための「ファイル移動（引っ越し）」および「import / 読み込みパスの修正」を行います。
`PROJECT_ARCHITECTURE.md`のルールに従い、以下の指示を正確に実行してください。

【厳守事項】
・本ステップの目的は「ファイルの移動とパスの解決」のみです。
・JSファイル内のロジック変更、関数名の変更、CSSの中身のリファクタリング等は**絶対に一切行わない**でください。
・すべての移動が完了した後、ゲームが白画面にならず正常に起動すること（パス解決エラーが出ないこと）を最優先としてください。

【ディレクトリ構成と移動マップ】
現在のプロジェクトルートにある以下のファイルを、新しくフォルダを作成してそれぞれ移動させてください。

1. CSSファイルの移動
・`/css` フォルダを作成。
・`style.css` を `/css/style.css` に移動。

2. JSファイルの移動（3つのサブディレクトリに分割）
・`/js/core` フォルダを作成し、以下を移動。
  - `config.js`
  - `main.js`
  - `logic.js`
  - `physics.js`
  - `score.js`

・`/js/render` フォルダを作成し、以下を移動。
  - `renderer.js`
  - `effects.js`
  - `ScreenEffects.js`
  - `scene.js`
  - `title-animation.js`

・`/js/entity` フォルダを作成し、以下を移動。
  - `ParticleManager.js`
  - `LaserEffect.js`

【パスの修正要件】
1. `index.html` の修正
・`<link rel="stylesheet" href="style.css">` を `./css/style.css` に修正。
・`<script type="module" src="main.js"></script>` を `./js/core/main.js` に修正。

2. 各JSファイル内の `import` パスの修正
・ファイルが階層化されたことに伴い、全JSファイルの冒頭にある `import` 文の相対パスを正確に修正してください。
・例: `main.js` から `renderer.js` を読み込む場合、`import ... from '../render/renderer.js'` となります。
・例: `effects.js` から `ParticleManager.js` を読み込む場合、`import ... from '../entity/ParticleManager.js'` となります。

実行後、すべての依存関係が正しく解決されているか（404エラーが出ないか）を確認してください。
