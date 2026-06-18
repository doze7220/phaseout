# UI.TabGroupの実装およびConfigSceneの完全再構築

あなたは優秀なゲームエンジニアです。
`PROJECT_ARCHITECTURE.md`と`PROJECT_FUNCTION_INDEX.md`の資料を把握し、取り組んでください。
Canvas UIコンポーネント（UIComponents.js）を拡張してタブシステムを実装し、機能が充実してきたConfigSceneを「設定」「更新履歴」「著作権」「DEBUG」の4タブ構成に再構築してください。同時に、サウンド設定とビジュアライザの独立設定を実装します。

## 1. UIComponents.js への TabGroup 追加
- `BaseControl` を継承した新しいクラス `UI.TabGroup` を実装してください。
- コンストラクタでタブのラベル配列（`['設定', '更新履歴', '著作権', 'DEBUG']`）を受け取り、タップで `selectedIndex` を切り替えられるようにします。アクティブなタブはハイライト表示してください。

## 2. 音声ON/OFF と ビジュアライザ独立設定の実装
- `audioConfig.js` または `config.js` にマスターミュート設定（例: `AUDIO_ENABLED: true`）を追加し、`SoundManager.js` の再生ロジック（BGM, SE共通）に判定を挟んでON/OFFが即座に機能するようにしてください。
- `config.js` に `VISUALIZER_MODE`（デフォルト: `'WAVE'`）を追加し、`'WAVE'`, `'BLOCK'`, `'LITE'` の3段階を定義してください。
- `Visualizer.js` 内の描画モード分岐を、従来の `EFFECT_LEVEL` 依存から、新設した `VISUALIZER_MODE` に依存するように改修してください（WAVE: グリッチ波形, BLOCK: 脈動スリット, LITE: 脈動なし軽量スリット）。変更された瞬間に即座に背景へ反映されるようにしてください。

## 3. ConfigScene.js の再構築（4タブへの分割）
- `ConfigScene.js` 内に `UI.TabGroup` を配置し、選択中のタブに応じて描画対象を以下のように切り替えてください（非表示のタブのトグル等が誤ってタップ判定を吸わないよう厳密にガードすること）。
  - **[設定] タブ:** 既存の「エフェクトレベル」「GEMスタイル」等に加え、新規の「サウンド ON/OFF」トグルと「ビジュアライザ変更 (WAVE/BLOCK/LITE)」トグル/ボタンを追加してください。
  - **[更新履歴] タブ:** 既存の `changelog.js` の内容を表示する `UI.ScrollArea` を配置してください。
  - **[著作権] タブ:** BGM、SE、フォント等の権利表記用ダミーテキスト（BGM: [Author Name] 等）を格納した `UI.ScrollArea` を配置してください。
  - **[DEBUG] タブ:** 現在「設定」内に混ざっている「デバッグ表示ON/OFF（FPSや破壊数統計など）」のトグルスイッチを、このタブへ完全に移動させてください。本番リリース時にこのタブごと消去しやすいよう、コードブロックを明確に分離して記述してください。

## 4. ドキュメントの更新
- 作業完了後、`changelog.js`、`PROJECT_ARCHITECTURE.md` および `PROJECT_FUNCTION_INDEX.md` を更新し、リビジョンをカウントアップ。作業内容を各資料に反映してください。

完了要件:
コンフィグ画面上部に4つのタブが美しく描画され、タップで表示内容が瞬時に切り替わること。音のON/OFFが即座に反映され、ビジュアライザのモード変更が背景のアニメーションに正しく適用されること。デバッグ関連のUIがDEBUGタブにのみ存在していること。
