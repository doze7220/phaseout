# 実装指示書：ブラックフェイズのコアループ構築（フェード遷移＋特異点インタラクション）

## 目的
裏フィーバーモード「ブラックフェイズ」のコアループ（発動〜終了）を構築する。
過剰な演出は後回しとし、「ヘッダのヒビ割れによる前兆 → ブラックフェードアウトで突入 → 特異点（ブラックホール）のタップ延命・縮小 → ブラックフェードインで復帰」という、一連のプレイアブルなゲームループを完成させる。

## 変更対象ファイル
*   `js/core/config.js` (フェイズ定数およびGameStateへの状態追加)
*   `js/core/effectConfig.js` (ブラックフェイズ専用コンフィグの新設)
*   `js/core/PhaseManager.js` (ステートマシンと遷移タイマー処理)
*   `js/core/logic.js` (発動条件とタップ入力のフック)
*   `js/render/ScoreRenderer.js` (ヘッダーへのヒビ割れ描画)
*   `js/render/BackgroundManager.js` (状態更新、フェードトランジションおよび特異点描画)

## 注意事項（アーキテクチャ・ルール）
*   **マジックナンバーの絶対禁止**: ロジックや描画処理（`logic.js`, `ScoreRenderer.js`, `BackgroundManager.js` 等）内に、数値を直接ハードコード（マジックナンバー）することは一切禁止する。計算に用いるすべての固定値はコンフィグ定数から参照すること。
*   **コンフィグのコメント必須**: `config.js` および `effectConfig.js` に新規定数を追加する際は、必ずその数値が何を示すのか（ミリ秒、割合、速度など）仕様意図を説明するコメントをソースコード上に併記すること。

## 実装手順

### 1. 定数と状態の追加 (`config.js` & `effectConfig.js`)
*   `config.js`: `PhaseManager` 用のフェイズ定数に `PHASE_BLACK_ENTER`, `PHASE_BLACK`, `PHASE_BLACK_EXIT` を追加する。
*   `config.js`: `GameState` に特異点の脈動状態 `blackHolePulse: 0` を追加し、`reset()` 処理へも組み込む。
*   `effectConfig.js`: 新規定数として `BLACK_PHASE_EFFECT_CONFIG` をエクスポートし、以下の設定を追加する。
    `PHASE_BLACK: { ENTER_MS: 2000, DURATION_MS: 10000, EXIT_MS: 2000 }`
    `BLACK_HOLE: { BASE_RADIUS: 100, PULSE_ADD: 0.3, PULSE_MAX: 1.5, DECAY_RATE: 0.9 }`

### 2. ステートマシン構築と発動条件 (`PhaseManager.js` & `logic.js`)
*   `PhaseManager.js`: `enterBlackPhase()` を新設。状態を `PHASE_BLACK_ENTER` に移行し、`isPuzzlePaused = true` でパズルを停止（ステイシス）。タイマーをセットする。
    ※このメソッド移行時に、将来の演出用として `console.log("WARNING : POTENTIAL PHASE ANOMALY... [ PHASE BREAK ] BLACK RESURRECT")` を出力しておく。
*   `PhaseManager.js`: `update` メソッドにて、`ENTER` (2秒経過) → `BLACK` (パズル再開) → `EXIT` (パズル停止・2秒経過) → `PHASE_NORMAL` (復帰) の遷移をタイマーで制御する。
*   `logic.js`: ホワイトフェイズ中のリバースリンクにより、ブレイクゲージ (`breakGauge`) が最大値 (`GAUGE_MAX`) に達した場合、`PhaseManager.enterBlackPhase()` を呼び出す。

### 3. ヘッダーのヒビ割れ描画 (`ScoreRenderer.js`)
*   `ScoreRenderer.js`: `drawHeaderUI` 内でヘッダー背景を描画した直後、ホワイトフェイズ中の場合のみ、現在のブレイクゲージ割合 (`breakGauge / GAUGE_MAX`) に応じた「フラクタル線（ヒビ割れ）」を Canvas API (`moveTo`, `lineTo`) を用いて漆黒 (`#000000`) で描画する。乱数等を用いてギザギザの亀裂を表現すること。

### 4. ブラックフェイズ中のタップインタラクション (`logic.js`)
*   `logic.js`: タップ処理 (`pointerDownHandler`) 内にて、現在のフェイズが `PHASE_BLACK` の場合、通常の連鎖探索 (`startChain`) をキャンセルする。
*   代わりに `GameState.blackHolePulse += BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.PULSE_ADD` を実行し（`PULSE_MAX` でクランプ）、特異点を脈動させて延命アクションとする。

### 5. 状態更新とフェード・特異点描画 (`BackgroundManager.js`)
*   **脈動の減衰 (`update` メソッド)**: 毎フレーム、ポーズ中に関わらず `GameState.blackHolePulse *= BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.DECAY_RATE` を実行し、脈動を 0 へ減衰させる。
*   **フェードと特異点の描画 (`draw` メソッド)**:
    1.  `ctx.save()` を行い、以下のように `ctx.globalAlpha` を設定して画面全体（第1層）を漆黒 (`#000000`) で塗りつぶす。
        *   `PHASE_BLACK_ENTER`: `1 - (PhaseManager.stateTimer / ENTER_MS)` （黒へフェードアウト）
        *   `PHASE_BLACK`: `1.0` （完全に黒）
        *   `PHASE_BLACK_EXIT`: `(PhaseManager.stateTimer / EXIT_MS)` （黒から元の画面へフェードイン）
    2.  **ブラックホール描画 (`PHASE_BLACK` 中のみ)**:
        *   残り寿命割合 `lifeRatio = PhaseManager.stateTimer / DURATION_MS` を計算。
        *   半径 `radius = BASE_RADIUS * lifeRatio * (1 + GameState.blackHolePulse)` を計算。
        *   画面中央に黒色の円 (`arc`) を描き、`shadowColor = '#000000'`, `shadowBlur = 50` で周囲の重力（滲み）を表現する。
    3.  `ctx.restore()` でコンテキスト状態を必ず復元する。

### 6. 追記
1. PhaseManager.stateTimer の増減方向について
- AIの疑問: タイマーはカウントダウンか、カウントアップか？
- アンサー: 「stateTimer は 0 から開始されるカウントアップ（加算）方式として実装すること。」 これにより、指示書のフェード計算式 1 - (PhaseManager.stateTimer / ENTER_MS) が完璧に機能し、2秒かけて 1.0 から 0.0 へ向かって暗転していく美しいトランジションが実現します！

2. ブラックフェイズ本編中のパズル状態について
- AIの疑問: 「パズル再開」とあるが、タップでの連鎖はキャンセルする。宝石は物理挙動するのか？
- アンサー: 「PHASE_BLACK 中は物理エンジンの更新（重力による落下や衝突）は通常通り稼働させる。ただし、タップ時の startChain （通常の連鎖探索）のみをキャンセルし、特異点の脈動（延命）アクションのみを受け付ける無敵のフィーバー状態とする。」 これこそが「パズルロジックは止めるが、物理（世界）は動かし続ける」という、このゲーム最大のカタルシスです！

3. ブレイクゲージ (breakGauge / GAUGE_MAX) の定義場所について
- AIの疑問: breakGauge はどこにあるのか？
- アンサー: 「breakGauge は config.js の GameState 内に初期値 0 として追加・定義すること。また、GAUGE_MAX は既存のシフトゲージと同じ定数（1000）を参照するか、BLACK_PHASE_EFFECT_CONFIG 等に別途定義して参照すること。」

