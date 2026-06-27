# 実装計画：1 TAP MAX SCORE 特異点演出およびスコア剰余消失バグ修正

## 1. スコープ一覧
本タスクの対応スコープは以下の3点です。
1. **スコア按分時の剰余（BigInt切り捨て分）消失バグの修正**
   - 連鎖処理における総スコアの各色への按分時に発生する余剰スコアを算出し、連鎖の起点色（`startColorStr`）に一括加算するロジックの実装。
2. **1 TAP MAX SCORE 記録時の特異点（色）判定ロジックの拡張**
   - 1タップの最大スコア更新時に、フェイズ状態やプリズムリンクの深度（巻き込み色数）に応じて、特定の世界観色（`'BLACK'`, `'WHITE'`）または起点色を保持する処理の実装。
3. **リザルト画面における1 TAP MAX SCOREアイコンの特殊描画**
   - 記録された最大スコア色が `'WHITE'` または `'BLACK'` の場合、`ResultRenderer` の `this.elapsed` などを利用した虹色グレアアニメーションと専用色の単色円を描画する処理の追加。

## 2. 変更対象ファイル一覧
- `js/core/logic.js`
- `js/render/ResultRenderer.js`

## 3. 実装手順

### ① `js/core/logic.js` の改修
#### 1-1. `finalizeDestruction` への引数追加とスコア按分ロジック修正
- **対象箇所:** `finalizeDestruction` の定義および呼び出し部分、ならびにスコアを按分する `for` ループ付近。
- **修正内容:**
  1. `finalizeDestruction(chain, tapPos, maxDepth = 1, prismDepth = 0)` に第5引数 `startColorStr` を追加。
  2. 呼び出し元（`startChain`内）で `targetColorStr` を渡すように修正。ブラックホールの吸い込み等で指定がない場合は `chain[0].colorStr` にフォールバックする。
  3. 獲得総スコア（`points`）と対象の色数（`colorEntries.length`）から、均等割りスコア `perColorScore` と余剰スコアを算出。
     `const perColorScore = points / BigInt(colorEntries.length);`
     `const remainder = points % BigInt(colorEntries.length);`
  4. 算出した「余剰スコア（remainder）」を、起点色（`startColorStr`）の `totalScorePerColor` にすべて加算し、チリの消滅を防ぐ。

#### 1-2. `1 TAP MAX SCORE` 更新ロジックの改修
- **対象箇所:** `points > GameState.maxScorePerTap` となるスコア更新処理ブロック内
- **処理内容:**
  1. `GameState.maxScoreColor` を以下の優先条件で評価して記録する。
  2. **条件A:** `PhaseManager.getCurrentPhaseName() === PHASE_BLACK` の場合、`'BLACK'` を代入。
  3. **条件B:** `prismDepth >= 6` の場合、`'WHITE'` を代入。
  4. **条件C:** 上記いずれにも該当しない場合、`startColorStr` を代入。

### ② `js/render/ResultRenderer.js` の改修
#### 2-1. 1 TAP MAX SCOREのアイコン描画ロジック拡張
- **対象箇所:** `drawSummary` メソッド内の 1 TAP MAX SCORE アイコン描画部分
- **処理内容:**
  1. `import { WHITE_PHASE_EFFECT_CONFIG } from '../core/effectConfig.js';` を追加。
  2. 描画対象の `this.maxScoreColor` が `'BLACK'` または `'WHITE'` かを判定。
  3. 該当する場合、以下の特殊描画を実行。
     - `this.elapsed` を利用して `hue = (this.elapsed * WHITE_PHASE_EFFECT_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360` を算出。
     - コンテキストのグロー設定: `ctx.shadowColor = \`hsl(${hue}, 100%, 60%)\`;`, `ctx.shadowBlur = 15;`
     - `'WHITE'` なら純白（`#ffffff`）、`'BLACK'` なら漆黒（`#000000`）の円形描画を行う。
  4. 該当しない（通常のカラーID/HEX）場合は既存のアイコン描画処理（単色円＋影）へフォールバックさせる。
  5. 描画後、即座に `ctx.shadowBlur = 0;` を設定し、`ctx.restore()` 等を用いてコンテキスト状態を必ず元に戻す。

## 4. 依存関係
- **状態管理 (GameState):** 
  - `GameState.maxScoreColor`
  - `GameState.maxScorePerTap`
  - `GameState.totalScorePerColor`
- **モジュール・定数:** 
  - `PhaseManager` (`PHASE_BLACK` の参照)
  - `WHITE_PHASE_EFFECT_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED` （描画時の参照）

## 5. 解消された不明点と前提条件
- **`PHASE_BLACK` の存在:**
  ブラックフェイズは既に実装済みであり、`PhaseManager.getCurrentPhaseName() === PHASE_BLACK` で判定可能です。
- **`EFFECT_MATH_CONFIG`:**
  現在は非推奨となり、代わりに `WHITE_PHASE_EFFECT_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED` などを利用して虹色発光の描画を行います。
- **時間軸管理:**
  `gameTime` 引数ではなく、`ResultRenderer` が内部で持っている `this.elapsed` を利用してアニメーションを行います。
