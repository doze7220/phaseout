# ホワイトフェイズ中の演出強化 実装計画

## 1. スコープ一覧
- `SpriteCacheManager` を利用した、ホワイトフェイズ突入時・終了時の宝石キャッシュ再生成（白化オーバードライブ）と通常キャッシュへの切り替え処理。
- `GaugeManager` を利用した、ホワイトフェイズ中のLIFEゲージの白化および黒点滅による焦燥感表現。
- `renderer` を利用した、ホワイトフェイズ終盤（ゲージ残量60%以下）における盤面宝石のグリッチノイズ描画（描画負荷レベル設定と連動）。
- ホワイトフェイズ中のスコアポップアップ演出強化（虹色オーバードライブ）

ホワイトフェイズ中の「スコア3乗化インフレ」による異常な熱狂を表現するため、「滑らかな虹色（HSL）の色相変化」による後光（グレア）演出を実装します。

## 2. 変更対象ファイル一覧
- `js/core/config.js`
- `js/render/SpriteCacheManager.js`
- `js/core/PhaseManager.js`
- `js/render/GaugeManager.js`
- `js/render/renderer.js`
- `js/render/ScreenEffectPopup.js`

## 3. 実装手順
### ① 定数の定義 (`js/core/config.js`)
- `EFFECT_MATH_CONFIG` 内に以下の定数を追加・定義する。
  - `WHITE_PHASE_GLITCH_THRESHOLD`: `0.6` (残量60%以下で発火)
  - `WHITE_PHASE_GLOW`: `{ SCALE: 0.85, ALPHA: 0.5 }` (キャッシュ生成時の白化焼き付け用パラメータ)
  - `WHITE_PHASE_FLICKER_SPEED_BASE`: `0.0001`
  - `WHITE_PHASE_FLICKER_SPEED_MAX`: `0.003`
  - `WHITE_SCORE_GLOW`: `{ BLUR: 15, HUE_SPEED: 0.5 }`

### ② キャッシュの動的再構築 (`js/render/SpriteCacheManager.js` & `js/core/PhaseManager.js`)
- **`SpriteCacheManager.js`**:
  - `generateAllCaches(isWhitePhase = false)` のように引数を拡張する。
  - キャッシュ生成ループ内（`_drawRichGem` 等の描画完了直後）にて、`isWhitePhase === true` の場合のみ、生成したばかりの宝石の描画コンテキストに対して以下を適用する。
    - `globalCompositeOperation = 'lighter'`
    - `globalAlpha = WHITE_PHASE_GLOW.ALPHA`
    - 「同じ宝石」のスケールを `WHITE_PHASE_GLOW.SCALE` に縮小し、加算合成で焼き付ける処理を追加。
- **`PhaseManager.js`**:
  - `enterWhitePhase` (ホワイトフェイズ突入時) の処理内に、ステイシスの裏で `SpriteCacheManager.generateAllCaches(true)` を呼び出し、キャッシュを白化版へ書き換える処理を追加する。
  - `PHASE_WHITE_EXIT` (ホワイトフェイズ終了時) の処理内に、`SpriteCacheManager.generateAllCaches(false)` を呼び出し、元の通常宝石キャッシュへと戻す処理を追加する。

### ③ LIFEゲージの白化と「黒点滅」 (`js/render/GaugeManager.js`)
- 外周LIFEゲージ描画処理を改修する。
- `PhaseManager.isWhitePhase()` が true の場合、以下のロジックを適用する。
  1. **残量60%より多い場合**: 常に「純白 (`#ffffff`)」で描画する。
  2. **残量60%以下の場合**: 「純白 (`#ffffff`)」と「漆黒 (`#000000`)」で点滅させる。
  3. **点滅速度**: 残量 (`PhaseManager.getGaugeRatio()`) に連動させ、0%に近づくほど真っ黒になる頻度が増すように `Math.sin(gameTime * 速度)` 等で計算する。

### ④ 宝石のグリッチノイズ侵食 (`js/render/renderer.js`)
- `drawGem` などの宝石描画処理を改修する。
- 以下の条件をすべて満たす場合のみ、描画時のX座標やRGBチャンネルにズレ（グリッチ）を生じさせる。
  - `PhaseManager` の現在のフェイズが `PHASE_WHITE` であること。
  - シフトゲージ残量が `WHITE_PHASE_GLITCH_THRESHOLD` 以下であること。
- **【負荷制御】**: このグリッチ描画処理は `AppConfig.EFFECT_LEVEL === 'FULL'` の場合のみ実行する。`LITE` および `NONE` の場合はパフォーマンス保護のため描写をスキップし、通常描画を維持する。
- **【物理演算の保護】**: 座標オフセットは描画時 (`ctx.drawImage`) のみに行い、物理ボディ (`Body.position`) 自体は絶対に操作しない（アーキテクチャ規約遵守）。

### ⑤ スコアポップアップの虹色グレア (`js/render/ScreenEffectPopup.js`)
- `drawPopups` メソッド内、スコアポップアップおよび数式ポップアップを描画する `isDetailed || isFinalScore` ブロックにおいて、`PhaseManager.getCurrentPhaseName() === 'ホワイトステイシス中'` の場合に虹色グレアを適用する。
- スコアCanvas (`displayCanvas`) の描画前に `ctx.shadowColor = 'hsl(' + hue + ', 100%, 60%)'` と `ctx.shadowBlur`、および `ctx.globalCompositeOperation = 'lighter'` を設定する。
- 数式描画処理 (`isDetailed`) 内でも同様に、既存の黒縁シャドウ処理を分岐させ、ホワイトフェイズ中は虹色発光および加算合成が適用されるように調整する。

## 4. 依存関係
- **定数依存**: `SpriteCacheManager.js`, `renderer.js`, `ScreenEffectPopup.js` は `config.js` の `EFFECT_MATH_CONFIG` に依存する。
- **機能依存**: `PhaseManager.js` は、フェイズ遷移時のキャッシュ再構築のために `SpriteCacheManager.generateAllCaches` メソッドに依存する。
- **状態依存**: `GaugeManager.js`, `renderer.js`, `ScreenEffectPopup.js` は、`PhaseManager.js` の状態判定および時間管理値に依存する。

## 5. 不明点リスト
> [!WARNING]
> 入力された指示書に基づき、以下の不明点を抽出しました。実装にあたって確認が必要です。

1. **`GaugeManager.js` と `renderer.js` の「残量」の取得先**
   指示書内では「残量 (`PhaseManager.getGaugeRatio()`)」および「シフトゲージ残量」と表記されています。ホワイトフェイズ中の動的加速減衰の対象はシフトゲージであるため、ここでの「残量」は LIFE ではなく「シフトゲージ残量」を指しているという解釈で相違ないでしょうか。
2. **`EFFECT_MATH_CONFIG` の存在有無**
   `config.js` 内に `EFFECT_MATH_CONFIG` 定数を追加するよう指示がありますが、既存コード内に当該オブジェクトが存在しない場合、新規オブジェクトとしてグローバル定数群（または `phaseout_config` 内など）のどこに配置すべきか明示されていません。
3. **点滅速度計算等に用いる `gameTime` 変数の取得元**
   `GaugeManager` や `renderer` での点滅・グリッチ処理において `Math.sin(gameTime * 速度)` と記載されていますが、これらはアーキテクチャ資料「時間管理とアニメーションアーキテクチャ」に則り、最上位から流し渡される引数 `gameTime` をそのまま利用する想定で相違ないでしょうか。
