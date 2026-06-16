あなたは優秀なゲームエンジニアです。
先ほど作成した『PROJECT_MATH_AND_BALANCE.md』に基づいて、コード内に散らばっているマジックナンバー（直書きされた固定値）を排除し、一元管理できるようにリファクタリングを行います。

【実行手順】
1. 『PROJECT_MATH_AND_BALANCE.md』に記載されているすべての計算式と固定値を確認してください。
2. `config.js` の中に、新たに計算式・パラメータ管理用の定数オブジェクトを定義してください。
   （例：`CORE_MATH_CONFIG`、`EFFECT_MATH_CONFIG`、`SOUND_MATH_CONFIG` など、カテゴリごとに構造化して記述すること）
3. 抽出された各種ファイル（`logic.js`, `physics.js`, `renderer.js`, `effects.js`, `ScreenEffects.js`, `LaserEffect.js`, `Visualizer.js`, `SoundManager.js` 等）を修正し、数式内に直書きされているマジックナンバーを、`config.js` で定義した定数オブジェクトからの参照に置き換えてください。
   ※ 例: `1.0 + (ChainCount * 0.05)` → `1.0 + (ChainCount * SOUND_MATH_CONFIG.PITCH_STEP)` のように書き換える。
4. `config.js` に定数を追加したことに合わせ、『PROJECT_MATH_AND_BALANCE.md』の該当箇所の「関連変数」の記述も最新のもの（定数名）に更新してください。

作業が完了したら、どのような定数オブジェクトを `config.js` に追加したかのサマリーと、書き換えたファイルの一覧を報告してください。
