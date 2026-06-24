# PROJECT EFFECT: 演出と時間軸の依存関係
最終更新: 2026-06-24 (v0.26.41 時点)

本ドキュメントは、ゲーム内の各種視覚的エフェクト（演出）が「どの時間軸」に依存して動くべきか、また「どの描画レイヤー」で処理されているかを定義する絶対資料です。
新しい演出を追加する際、あるいはデバッグ機能等でゲームの時間を停止させる際は、必ずこの資料を参照し、意図した時間軸と連動するように実装してください。

## 1. 時間軸の定義（三系統管理）
ゲーム内の演出は、以下の三系統の時間（引数として渡される `delta` や `gameTime`）を用いて更新されます。`performance.now()` や `Date.now()` 等の絶対時間の直接参照は禁止されています。

*   **パズル時間 / 演出進行 (`gameDelta`)**
    *   `timeScale` に影響を受ける時間差分。ゲームの進行速度やスロー演出と完全に連動する。
    *   1回限りの演出（ポップアップ、レーザー、パーティクル等）は、この `gameDelta` を `elapsed` に加算して進行する。
    *   `GameState.isPuzzlePaused` 等によるポーズ（ステイシス）中は `0` となり停止する。
*   **システム現実時間 (`realDelta`)**
    *   `timeScale` に影響されない、現実の経過時間差分。
    *   FPSメーター、UIアニメーション、波紋エフェクトなど、ゲームの進行速度に関わらず常に一定速度で動かす処理に用いられる。
*   **全体位相同期 (`gameTime`)**
    *   累積ゲーム時間。背景アニメーション（星空、パルス発光等）や周期運動（`Math.sin`等）の位相同期に用いられる。

---

## 2. 実装済みエフェクト一覧（現時点での調査分）

※本リストは暫定版であり、Step 2.6 以降の開発で随時更新・追記してください。

### 2.1 パズル時間に属するエフェクト
これらは `GameState.isPuzzlePaused === true` のとき、座標や寿命の更新（update）を停止し、描画（draw）のみを継続させる必要があります。またエフェクトではないので一覧には記載しないが、物理演算（Matter.js）や宝石の動きも、このパズル時間に含まれる。

| エフェクト名 | 目的（1行説明） | 描画レイヤー | 発火トリガー | 参照パラメータ / クラス |
| :--- | :--- | :--- | :--- | :--- |
| **火花・破片** | 宝石破壊時の物理的な飛散演出 | `FOREGROUND_EFFECTS` (4層) | `spawnParticles`, `spawnSparks` 関数 | `ParticleManager` |
| **接続レーザー** | 宝石間のリンク状態の視覚化 | `LASER` (2層) | `GameState.GEMS` 内の接続状態 | `LaserEffect` |
| **フローティング数値** | ダメージ、LIFE回復、EXP獲得などのテキスト表示 | `POPUP_TEXT` (8層) | `showFloatingNumber` 関数 | `FloatingNumberRenderer` |
| **スコアポップアップ** | 獲得スコア等の画面上テキスト | `POPUP_TEXT` (8層) | `showScorePopup` 関数等 | `ChainScoreRenderer` |
| **スクリーンシェイク** | ダメージや大連鎖時の画面揺らし | Pre-Render (全体) | `GameState.screenShake > 0` | `ScreenEffects.applyShake` |
| **ピンチエフェクト** | LIFE低下時の画面暗転・赤の脈動 | `IN_GAME_POST_EFFECT` (6層) | `GameState.life < MaxLife * 0.15` | `ScreenEffectVignette.togglePinchEffect`等 |
| **新色解放演出** | 新色が追加された際のトライバル演出 | `POPUP_TEXT` (8層) | レベルアップ(新色アンロック)時 | `ScreenEffectVignette.showTribalUnlockEffect` |
| **レベルアップポップアップ** | レベルアップ時のポップアップ | `POPUP_TEXT` (8層) | レベルアップ時 | `LevelUpRenderer.showLevelUpPopup` |
| **基点パーティクル** | タップした宝石のパーティクル演出 | `FOREGROUND_EFFECTS` (4層) | タップ連鎖開始時 | `ParticleManager` |
| **レーザー着弾** | レーザーが宝石に到着している最中の沈み込み等 | `LASER` (3層) | レーザーアニメーション更新時 | `LaserEffect.updateAndDraw` |
| **プリズムリンク演出** | プリズムリンクが発生した際のスタンプ・フラッシュ・消失演出 | `POPUP_TEXT` (8層) | プリズムリンク成立（ステップ進行）時 | `PrismLinkRenderer.triggerPrismLinkStep` |
| **P-Link昇華演出** | フルリンク達成時、全アイコンが合体しアステライア紋章とシステムログがポップアップする演出。独立した配列（sublimationEffects）によるFire-and-Forget方式で管理され、連続発生時も競合しない。 | `POPUP_TEXT` (8層) | プリズムリンク成立（Depth>=6）消去時 | `PrismLinkRenderer.draw` |
| **PrismFluctuation** | フルリンク達成時の物理的な余波エフェクト（エミッター方式） | `BACKGROUND` (1層) | プリズムリンク成立（Depth>=6）時 | `BackgroundManager` |
| **Whiteout Pressure**| シフトゲージ50%超によるフェイズシフト予兆の背景白化 | `BACKGROUND` (1層) | `phase === PHASE_NORMAL` 時 | `PhaseManager.getGaugeRatio()` |
| **LIFE / EXPゲージアニメ**| ライフ・経験値増減時の滑らかなゲージ伸縮アニメーション | `UI_BASE` (7層) | ダメージ、回復、経験値取得時 | `GaugeManager` |
| **星空背景** | 通常時を含む最奥のパーティクル背景 | `BACKGROUND` (1層) | 常に描画（Phaseによる制御） | `BackgroundManager` |


### 2.2 フェイズ時間に属するエフェクト
これらはパズルが停止していても、フェイズ進行が生きている限りは動作し続ける必要があります（例：ホワイトフェイズ突入時の時間停止演出そのもの）。

| エフェクト名 | 目的（1行説明） | 描画レイヤー | 発火トリガー | 参照パラメータ / クラス |
| :--- | :--- | :--- | :--- | :--- |
| **ホワイト背景反転** | ホワイトフェイズ中の専用背景 | `BACKGROUND` (1層) | フェイズ状態に応じた切り替え | `BackgroundManager` |
| **ホワイト突入演出** | トライバル展開・大膨張イン・透明ワイプアウトおよびシステムログ(X軸グリッチ)による全体トランジション | `GLOBAL_POST_EFFECT` (10層) | `currentPhase === PHASE_WHITE_ENTER` | `ScreenEffectTransition.drawGlobalPostEffects` 等 |
| **ホワイト解除演出** | トライバル逆再生・システムログ・円形ワイプアウトによる色と星空背景の復元トランジション | `GLOBAL_POST_EFFECT` (10層) | `currentPhase === PHASE_WHITE_EXIT` | `ScreenEffectTransition.drawGlobalPostEffects` 等 |
| **ホワイトオーバードライブ** | ホワイトフェイズ中の宝石スプライト白化と、ゲージ残量低下に伴う強烈なグリッチ・スライス描画 | `GEMS` (3層) | `currentPhase === PHASE_WHITE` | `SpriteCacheManager`, `renderer.js` |
| **シフトゲージ明滅** | ホワイトフェイズ中のシフトゲージ（LIFE領域）の白化と残量低下に伴う加速点滅 | `UI_BASE` (7層) | `currentPhase === PHASE_WHITE` | `GaugeManager.draw` |
| **虹色オーバードライブポップアップ** | ホワイトフェイズ中のスコアおよび数式ポップアップ。巨大な虹色グラデーション（後光）を背面に敷き、通常合成の重ね塗りで黒フチを保護しつつ強烈な発光を表現。3乗の文字はコンフィグ指定色（赤など）で強調。 | `UI_POPUPS` (11層) | `currentPhase === PHASE_WHITE` | `ChainScoreRenderer.draw` |
| **ステイシスマスクワイプ** | フェイズ突入時のブラックアウトや、終了時（脱出時）の画面中央からの波紋状ワイプ | `STASIS_FILTER` (13層) | `isStasis === true` または遷移中 | `StasisEffect.js`, `PhaseManager` |

### 2.3 システム現実時間に属するエフェクト
これらはコンフィグ中やフェイズ演出中などの「すべてのゲーム内時間が停止している」場面でも動き続ける必要があります。

| エフェクト名 | 目的（1行説明） | 描画レイヤー | 発火トリガー | 参照パラメータ / クラス |
| :--- | :--- | :--- | :--- | :--- |
| **FPS / デバッグ表示**| システムパフォーマンスの確認用 | `DEBUG_OVERLAY` (12層) | 常に描画（非表示切替可） | 内部フレームカウンタ等 |
| **タップ波紋** | タップ時や消去時の空間の歪み | `SYSTEM_TOP` (11層) | 画面タップ / `gemTapEffect` イベント | `RippleManager` |
| **フッターモニター演出**| フッター領域の「NO SIGNAL」表示、走査線、グリッチ等 | `UI_BASE` (7層) | 常に描画（EFFECT_LEVELによる負荷制御あり） | `FooterUIManager` |
| **ヘッダ背景ビジュアライザ**| 経験値取得等に応じたオシロスコープ(OSCILLO)、グリッチ、ブロック等の波形演出 | `UI_BASE` (7層) | 常時（BGM周波数解析） | `HeaderVisualizer` |
| **リザルト演出** | ゲームオーバー時のグリッチとスコア集計アニメーション | 独自Canvas管理 | リザルトシーン突入時 | `ResultRenderer` |
| **タイトル画面演出** | タイトル画面の宝石落下と破砕アニメーション | `SYSTEM_TOP` (11層)等 | タイトルシーン表示中 | `title-animation.js` |

---

## 3. 未調査・今後の実装予定項目
*   ホワイトフェイズ中の「リバースリンク演出（トライバルアイコンの逆順表示）」
*   ブラックフェイズ実装時の各種エフェクト
*   （その他、今後追加される演出）
