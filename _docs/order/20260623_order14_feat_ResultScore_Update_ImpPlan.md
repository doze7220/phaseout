# 実装計画：1 TAP MAX SCORE 特異点演出およびスコア剰余消失バグ修正

## 1. スコープ一覧
本タスクの対応スコープは以下の3点です。
1. **スコア按分時の剰余（BigInt切り捨て分）消失バグの修正**
   - 連鎖処理における総スコアの各色への按分時に発生する余剰スコアを算出し、連鎖起点色に一括加算するロジックの実装。
2. **1 TAP MAX SCORE 記録時の特異点（色）判定ロジックの拡張**
   - 1タップの最大スコア更新時に、フェイズ状態やプリズムリンクの深度（巻き込み色数）に応じて、特定の世界観色（`'BLACK'`, `'WHITE'`）または起点色IDを保持する処理の実装。
3. **リザルト画面における1 TAP MAX SCOREアイコンの特殊描画**
   - 記録された最大スコア色が `'WHITE'` または `'BLACK'` の場合、`gameTime` を用いた虹色グレアアニメーションと専用色の単色円を描画する処理の追加。

## 2. 変更対象ファイル一覧
- `js/core/logic.js`
- `js/render/ResultRenderer.js`

## 3. 実装手順

### ① `js/core/logic.js` の改修
#### 1-1. `finalizeDestruction` 内のスコア按分ロジック修正
- **対象箇所:** スコアを按分するループ処理付近
- **処理内容:**
  1. 獲得総スコア（BigInt）と対象の色数（BigIntにキャスト）から、均等割りスコア `perColorScore` を算出（既存）。
  2. `余剰スコア（剰余） = 総スコア - (perColorScore * 色数)` をBigIntとして算出。
  3. 各色に `perColorScore` を加算する処理は維持しつつ、ループ外などで `startGemColorId` に対応する `totalScorePerColor` に対して、算出した「余剰スコア」を加算する。
- **制約・注意点:** `Number` と `BigInt` の計算混在による例外発生を防ぐため、必ずキャストを行ってから演算する。

#### 1-2. `1 TAP MAX SCORE` 更新ロジックの改修
- **対象箇所:** `currentTapScore > GameState.maxScorePerTap` となるスコア更新処理ブロック内
- **処理内容:**
  1. `GameState.maxScorePerTap` を更新する際、同時に `GameState.maxScoreColor` を以下の優先条件で評価して記録する。
  2. **条件A:** `PhaseManager.currentPhase === PHASE_BLACK` の場合、`'BLACK'` を代入。
  3. **条件B:** `prismDepth >= 6` の場合、`'WHITE'` を代入。
  4. **条件C:** 上記いずれにも該当しない場合、`startGemColorId` を代入。
- **制約・注意点:** 更新判定に必要な `prismDepth` や現在のフェイズ状態の取得が正しく行えるスコープ・引数で処理すること。

### ② `js/render/ResultRenderer.js` の改修
#### 2-1. 1 TAP MAX SCOREのアイコン描画ロジック拡張
- **対象箇所:** リザルト画面で 1 TAP MAX SCORE のアイコン（色）を描画している `render` 等の処理部分
- **処理内容:**
  1. 描画対象の `GameState.maxScoreColor` が `'BLACK'` または `'WHITE'` かを判定。
  2. 該当する場合、以下の特殊描画を実行。
     - `gameTime` を利用して `hue = (gameTime * EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360` を算出。
     - コンテキストのグロー設定: `ctx.shadowColor = hsl(${hue}, 100%, 60%);`, `ctx.shadowBlur = 15;`
     - `'WHITE'` なら純白（`#ffffff`）、`'BLACK'` なら漆黒（`#000000`）の円形描画を行う。
  3. 該当しない（通常のカラーID）場合は既存のアイコン描画処理へフォールバックさせる。
  4. 描画後、即座に `ctx.shadowBlur = 0;` を設定し、`ctx.restore()` 等を用いてコンテキスト状態を必ず元に戻す。
- **制約・注意点:** 
  - アーキテクチャの規約通り、ロジックと描画を分離し、Renderer内で変数の状態（ゲームの進行状態など）を変更しないこと。
  - `gameTime` の引数伝播パスが存在するか確認し、その値を使用して動的描画を行う。

## 4. 依存関係
- **状態管理 (GameState):** 
  - `GameState.maxScoreColor` （新規拡張プロパティとしての利用を前提）
  - `GameState.maxScorePerTap`
  - `GameState.totalScorePerColor`
- **モジュール・定数:** 
  - `PhaseManager` (`PHASE_BLACK` の参照)
  - `EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED` （描画時の参照）
- **時間軸管理:**
  - `ResultRenderer` が呼び出される際の `gameTime`（全体位相同期時間）引数への依存。

## 5. 不明点リスト
入力情報および指定されたアーキテクチャ資料の範囲内で、以下の点が不足・矛盾しています。

1. **`PHASE_BLACK` の存在に関する矛盾:** 
   アーキテクチャ資料（4.2.フェイズ管理）には「ブラックフェイズについては現在の実装では未定義・未実装とする」との記載があります。一方で、指示書では「現在のフェイズがブラックフェイズ（`PHASE_BLACK`）であれば」という分岐条件が要求されています。現状の `PhaseManager` や定数に `PHASE_BLACK` が定義されていない場合、エラーとなります。（定義追加が必要かどうかは仕様外のため不明）
2. **`EFFECT_MATH_CONFIG` の定義場所:** 
   指示書のグレア設定で参照されている `EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED` について、現在のアーキテクチャ資料上では `effectConfig.js` などに定義が存在することが示唆されますが、変更対象ファイルに含まれていないため、この定数が既に存在しているか、あるいは未定義（追加が必要）であるかが不明です。
3. **`prismDepth` のスコープと取得方法:**
   `logic.js` 内の最大スコア更新処理において、`prismDepth` という変数を参照して条件判定を行いますが、この変数が該当関数のスコープ内に保持されているか、または引数・オブジェクト経由で取得可能な状態になっているかが不明です。
