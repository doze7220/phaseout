## 【目的】
スコア按分時の剰余（BigInt切り捨て分）消失バグの修正と、リザルト画面の「1 TAP MAX SCORE」にPリンク（白）と無限チェイン（黒）の特異点演出を実装する。

## 【修正対象ファイルと実装内容】

### 1. `logic.js` の修正
**① `finalizeDestruction` 内のスコア按分ロジックの改修**
BigIntの割り算によって発生する切り捨ての余り（剰余）が消滅している問題を修正する。
- 獲得した総スコアを按分対象の色の数で割った値（`perColorScore`）を各色に加算する。
- 総スコアから `perColorScore * 色数` を引いた「余剰スコア（剰余）」を算出する。
- 算出された余剰スコアを、連鎖の起点となった色（`startGemColorId`）の `totalScorePerColor` にすべて加算し、チリの消滅を完全に防ぐ。

**② `1 TAP MAX SCORE` の更新ロジック改修**
`currentTapScore &gt; GameState.maxScorePerTap` 時の記録更新処理を拡張し、世界観に合わせたアイコン色の判定（`GameState.maxScoreColor`）を導入する。
- **条件A:** 現在のフェイズがブラックフェイズ（`PHASE_BLACK`）であれば、`GameState.maxScoreColor = 'BLACK'` を記録する（無限チェインの特異点）。
- **条件B:** `prismDepth &gt;= 6` （全色巻き込みのフルPリンク）であれば、`GameState.maxScoreColor = 'WHITE'` を記録する（ステラの理による全色融和）。
- **条件C:** 上記以外（通常の単色チェイン）であれば、起点色のID（`startGemColorId`）を記録する。

### 2. `ResultRenderer.js` の修正
**① 1 TAP MAX SCORE のアイコン描画ロジックの拡張**
`GameState.maxScoreColor` が `'BLACK'` または `'WHITE'` の場合、特別な単色アイコン描画と、リアルタイムに変化する「虹色グレア」の演出を追加する。
- リザルト画面は `isPuzzlePaused = true` により物理演算が停止しているが、引数として渡される `gameTime` （全体位相同期時間）は進行している。この `gameTime` を利用してアニメーションさせる。
- グレアの設定：
  `const hue = (gameTime * EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360;`
  `ctx.shadowColor = hsl(${hue}, 100%, 60%);`
  `ctx.shadowBlur = 15;`
- その後、色が `'WHITE'` なら純白（`#ffffff`）、`'BLACK'` なら漆黒（`#000000`）の円を描画する。
- 通常のカラーIDの場合は、これまで通りのアイコン描画を行う。
- 描画後は必ず `ctx.shadowBlur = 0;` および `ctx.restore()` 等でコンテキストを保護し、他の描画に影響を与えないこと。

## 【制約事項】
- `PROJECT_ARCHITECTURE.md` に従い、描画ループ内（`ResultRenderer`）での状態変更は絶対に行わず、ロジックと描画の分離を厳守すること。
- BigIntの計算においては型の不一致（NumberとBigIntの混在）エラーに注意して剰余を算出すること。
