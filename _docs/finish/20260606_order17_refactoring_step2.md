あなたは優秀なゲームエンジニアです。
パズルゲーム『Phase Out: Cluster Stirring』のアーキテクチャ文書（PROJECT_ARCHITECTURE.md）の「8. 今後のリファクタリング・分離候補」に基づき、Step 2 として `ScreenEffects.js` のリファクタリングを実行してください。

【現状の課題】
`ScreenEffects.js` の中に、画面揺れ等の「DOM/Canvas演出（ScreenEffects本体）」と「LIFE/EXPゲージのSVGアニメーション・タイマー管理（GaugeManager）」が同居しており、責務が混在しています。今後のフェイズブレイク（時間停止など）実装に向けて、ゲージ管理を独立させる必要があります。

【実装要件】
1. `js/render/` ディレクトリ内に、新規ファイル `GaugeManager.js` を作成してください。
2. `ScreenEffects.js` の中から `GaugeManager` に関するクラス・関数群を新規ファイルへ完全に分離・移行してください。
   ※移行対象の主なメソッド（PROJECT_FUNCTION_INDEX準拠）:
   - `init`
   - `triggerDamage`
   - `triggerHeal`
   - `isDecayPaused`
   - `update`
   - `render`
   および、内部で使用している定数や状態変数（ゲージDOMの参照、タイマー変数など）。
3. 依存関係の整理を徹底してください。
   - `ScreenEffects.js` 側からは該当のコードを完全に削除してください。
   - 関数インデックスによると、`GaugeManager` の各メソッドは主に `logic.js` から呼び出されています。`logic.js` などの該当ファイル群の `import` パスを、新設した `GaugeManager.js` を向くように適切に修正してください。
   - `ScreenEffects.js` に残す演出系メソッド（`showChainPopup`, `triggerScreenShake`, `showFloatingNumber` 等）には影響を与えないでください。
   - アーキテクチャルールに則り、すべて ES Modules (`import/export`) で依存関係を解決してください。
4. リファクタリング後も、現在のゲームのLIFEゲージ（ダメージ時の赤ゲージ露出、回復時の緑ゲージ上昇、時間経過の減少）およびEXPゲージの進行が一切崩れず、従来通り動作することを保証してください。
