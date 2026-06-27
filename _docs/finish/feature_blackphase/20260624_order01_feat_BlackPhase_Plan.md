Viewed 20260624_order01_feat_BlackPhase.md:1-53
Viewed PROJECT_ARCHITECTURE.md:1-489

指示内容およびアーキテクチャ資料に基づき、実装計画を作成しました。
本フェーズでは実装は一切行わず、計画の提示のみとします。

### スコープ一覧
* **ブラックフェイズ移行フローの構築**: ホワイトフェイズからの条件達成によるフェイズ移行（突入・継続・退出）のステート管理。
* **定数・状態管理の拡張**: ブラックフェイズ専用のタイマー、脈動状態、グラフィック・ロジック用の定数追加。
* **ホワイトフェイズ中の予兆演出**: ヘッダーUI背景に対するブレイクゲージ依存のヒビ割れ描画（Canvas APIによる）。
* **ブラックフェイズ中の特異点（ブラックホール）演出と操作**: 背景のフェードアウト/イン、特異点の描画、およびタップ操作による脈動（延命）ロジックの構築。

### 変更対象ファイル一覧
* `js/core/config.js`
* `js/core/effectConfig.js`
* `js/core/PhaseManager.js`
* `js/core/logic.js`
* `js/render/ScoreRenderer.js`
* `js/render/BackgroundManager.js`

### 実装手順

#### ① 定数と状態の追加 (`config.js`, `effectConfig.js`)
* `config.js`
  * フェイズ定数に `PHASE_BLACK_ENTER`, `PHASE_BLACK`, `PHASE_BLACK_EXIT` を追加。
  * `GameState` に `blackHolePulse: 0` を追加し、`reset()` 処理に初期化を組み込む。
  * （追加時のコメント明記ルールを適用）
* `effectConfig.js`
  * `BLACK_PHASE_EFFECT_CONFIG` をエクスポートし、以下のプロパティを追加。
    * `PHASE_BLACK`: `{ ENTER_MS: 2000, DURATION_MS: 10000, EXIT_MS: 2000 }`
    * `BLACK_HOLE`: `{ BASE_RADIUS: 100, PULSE_ADD: 0.3, PULSE_MAX: 1.5, DECAY_RATE: 0.9 }`
  * 各数値の仕様意図（ミリ秒、割合など）を示すコメントを付与。

#### ② ステートマシン構築と発動条件 (`PhaseManager.js`, `logic.js`)
* `logic.js`
  * ホワイトフェイズ中のリバースリンク判定処理内にて、`breakGauge` が `GAUGE_MAX` に達したかを判定。
  * 条件達成時、`PhaseManager.enterBlackPhase()` を呼び出す。
* `PhaseManager.js`
  * 新規メソッド `enterBlackPhase()` を実装。
    * フェイズを `PHASE_BLACK_ENTER` に設定。
    * `isPuzzlePaused = true` とし、物理演算を停止（ステイシス）。
    * 遷移タイマーをセット。
    * コンソールログ出力: `console.log("WARNING : POTENTIAL PHASE ANOMALY... [ PHASE BREAK ] BLACK RESURRECT")`
  * `update` メソッド内にブラックフェイズのタイマー遷移処理を追加。
    * `PHASE_BLACK_ENTER` 終了後 → `PHASE_BLACK` へ移行（`isPuzzlePaused` を解除しパズル再開）。
    * `PHASE_BLACK` 終了後 → `PHASE_BLACK_EXIT` へ移行（`isPuzzlePaused = true` でパズル停止）。
    * `PHASE_BLACK_EXIT` 終了後 → `PHASE_NORMAL` へ復帰。

#### ③ ヘッダーのヒビ割れ描画 (`ScoreRenderer.js`)
* `ScoreRenderer.js`
  * `drawHeaderUI` 内のヘッダー背景描画直後に処理を追加。
  * 現在のフェイズがホワイトフェイズの場合のみ実行。
  * `breakGauge / GAUGE_MAX` の割合に応じた乱数ベースのギザギザな線（ヒビ割れ）を `moveTo`, `lineTo` で描画。色は `#000000`。

#### ④ ブラックフェイズ中のタップインタラクション (`logic.js`)
* `logic.js`
  * `pointerDownHandler` の先頭付近でフェイズを判定。
  * `PHASE_BLACK` の場合、通常の連鎖探索 (`startChain`) をキャンセル。
  * 代わりに `GameState.blackHolePulse` に `BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.PULSE_ADD` を加算。
  * 加算後の値を `PULSE_MAX` でクランプ（上限固定）する。

#### ⑤ 状態更新とフェード・特異点描画 (`BackgroundManager.js`)
* `BackgroundManager.js` (`update` メソッド)
  * 毎フレーム `GameState.blackHolePulse *= BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.DECAY_RATE` を実行して脈動を減衰。ポーズ中（`isPuzzlePaused`）でも動作させる。
* `BackgroundManager.js` (`draw` メソッド)
  * `ctx.save()` を実行。
  * 全体背景のフェード描画（第1層 BACKGROUND）：
    * 色は `#000000`。
    * `ctx.globalAlpha` をフェイズに応じて設定。
      * `PHASE_BLACK_ENTER`: `1 - (PhaseManager.stateTimer / ENTER_MS)`
      * `PHASE_BLACK`: `1.0`
      * `PHASE_BLACK_EXIT`: `(PhaseManager.stateTimer / EXIT_MS)`
  * 特異点（ブラックホール）の描画（`PHASE_BLACK` 時のみ）：
    * `lifeRatio = PhaseManager.stateTimer / DURATION_MS` を算出。
    * `radius = BASE_RADIUS * lifeRatio * (1 + GameState.blackHolePulse)` を算出。
    * 画面中央に `arc` で黒色の円を描画。
    * `shadowColor = '#000000'`, `shadowBlur = 50` を指定。
  * `ctx.restore()` を実行してコンテキストを復元。

### 依存関係
* **PhaseManager.js -> GameState (config.js)**: 状態フラグ (`isPuzzlePaused`) の操作。
* **logic.js -> PhaseManager.js**: ブレイクゲージMAX時のフェイズ移行トリガー呼び出し。
* **logic.js -> config.js / effectConfig.js**: 脈動値の加算とクランプ処理のための定数・状態参照。
* **ScoreRenderer.js -> logic.js (または GameState)**: ブレイクゲージ (`breakGauge`) の値の参照。
* **BackgroundManager.js -> config.js / effectConfig.js / PhaseManager.js**: フェード用タイマーおよび脈動用定数・状態の参照。
* **アーキテクチャ依存**: `BackgroundManager.js` の描画は第1層（BACKGROUND）、`ScoreRenderer.js` の描画は第7層（UI_BASE）として処理され、`MasterRenderer.js` のパイプラインに厳格に従う。

### 不明点リスト
* **`PhaseManager.stateTimer` の増減方向**:
  フェードアルファ値の計算式（`1 - (stateTimer / ENTER_MS)` など）が指示書に記載されていますが、既存の `stateTimer` がカウントダウン（減算）方式か、カウントアップ（加算）方式かによって、想定されるフェードイン・アウトの挙動が逆転する可能性があります。
* **ブラックフェイズ本編中のパズル状態**:
  指示書では `PHASE_BLACK` 移行時に「パズル再開」とありますが、同時にタップインタラクションで「通常の連鎖探索 (`startChain`) をキャンセルする」とあります。パズル再開時に宝石が落下等の物理挙動をするのか、タップ以外の干渉が可能なのかについて仕様の詳細確認が必要です。
* **ブレイクゲージ (`breakGauge` / `GAUGE_MAX`) の定義場所**:
  指示書に `breakGauge` および `GAUGE_MAX` と記載がありますが、既存の `GameState` や `config.js` にすでに定義されているか、あるいは新規に定義する必要があるか（定数名・所属箇所）について明示されていません。アーキテクチャ資料では「ホワイトフェイズ中のプリズムリンクで蓄積するブレイクゲージ」との言及は存在します。
