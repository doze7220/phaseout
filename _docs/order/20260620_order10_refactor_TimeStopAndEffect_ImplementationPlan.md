# 2つの時間停止フラグの導入とデバッグ機能の実装

ゲーム内の時間停止の概念を「パズル」と「フェイズ進行」に分離し、コンフィグや各種演出でのバグを防ぎつつ、デバッグ機能（ゲージ直接操作）を安全に組み込むための実装計画です。

## User Review Required

**※本プランはレビュー完了・合意済みです。Step 2.6チャットへの引き継ぎ用最終決定版となります。**

> [!IMPORTANT]
> 既存の `GameState.isStasis` の役割を細分化するため、広範囲のファイル（物理、エフェクト、フェイズ管理）に変更が入ります。
> 特にエフェクト類（パーティクルやレーザーなど）が「コンフィグ中やフェイズ移行演出中はピタリと止まる」ようになるため、これまでの挙動（裏でパーティクルだけは動いていた等）から変化します。

## Open Questions

特になし。ユーザー提案の概念的切り分けが完璧に要件を満たしているため、この設計方針に従って実装を進めてください。

## Proposed Changes

### 1. GameState (config.js)
時間管理フラグを明示的に定義します。
#### [MODIFY] js/core/config.js
- `GameState.isPuzzlePaused`: trueのとき、パズル（物理、タップ、LIFE/ゲージ減衰、パズル内エフェクト）を停止。
- `GameState.isSystemPaused`: trueのとき、フェイズタイマー等のシステム進行を停止。

### 2. PhaseManager (PhaseManager.js)
ゲージ減衰の停止とフェイズ進行の停止を分離します。
#### [MODIFY] js/core/PhaseManager.js
- `update(deltaTime)` 内の「ゲージ自然減衰」処理を `if (GameState.isPuzzlePaused) return;` などの条件でスキップ。
- `update(deltaTime)` 内の「フェイズ移行タイマー（2000ms等）」処理を `if (GameState.isSystemPaused) return;` でスキップ。

### 3. エフェクト・描画関連の停止制御
現在、描画ループ（`MasterRenderer`）から直接呼ばれているため、コンフィグ中も動き続けている各種エフェクトの「更新」をパズル停止に連動させます。
#### [MODIFY] js/entity/ParticleManager.js
#### [MODIFY] js/render/RippleManager.js
#### [MODIFY] js/render/LaserEffect.js
- `updateAndDraw(ctx)` メソッド内で、`GameState.isPuzzlePaused` が true の場合は座標や寿命の計算（update）をスキップし、現在の状態のまま `draw` のみを行うよう修正。

### 4. 物理エンジン・ロジック
#### [MODIFY] js/core/physics.js
- 物理の更新判定を `!GameState.isStasis` から `!GameState.isPuzzlePaused` に変更。
#### [MODIFY] js/core/logic.js
- LIFE減衰の判定条件を `isPuzzlePaused` に準拠させる。

### 5. ConfigScene (ConfigScene.js) とデバッグUI
コンフィグの開閉時のフラグ操作と、デバッグボタンを実装します。
#### [MODIFY] js/scene/ConfigScene.js
- **init**: `GameState.isPuzzlePaused = true`, `GameState.isSystemPaused = true` をセット。
- **デバッグボタン**: シフトゲージ・ブレイクゲージをそれぞれ `0, 500, 1000` に設定するボタンを描画・処理。
  - ボタン押下時は純粋に `PhaseManager.phaseGauge = 1000` などの数値変更のみを行い、専用の予約フラグなどは一切作らない。
- **destroy**: `isSystemPaused = false` にする。
  - コンフィグクローズ時（フラグ復帰後）に `PhaseManager.checkPhaseTransition()`（現在のゲージを評価しフェイズ移行を発火させるメソッド）を明示的に叩く。
  - その直後、PhaseManager の状態を確認し、移行演出（`PHASE_WHITE_ENTER` 等）に入ったなら `isPuzzlePaused = true` を維持、何も起きていなければ `false` にしてパズルを再開させる。

### 6. PROJECT_EFFECT.md の新規作成 (完了済み)
時間軸（パズル、フェイズ、システム現実時間）と各エフェクトの所属・依存関係を定義した絶対資料を作成。
※Step 2.5の段階で作成済み。今後のエフェクト追加時にも必ずこの資料を更新・参照すること。

## Verification Plan
1. **コンフィグ中の完全停止確認**
   コンフィグ画面を開いた際、パズルの動きだけでなく、パーティクルや波紋などのエフェクトも完全に静止することを確認。
2. **ゲージデバッグボタンの動作確認**
   コンフィグ内でシフトゲージを1000に設定してコンフィグを閉じた際、時間停止が解除されることなく（バグ発生せず）即座にホワイトフェイズ突入演出へ移行することを確認。
3. **減衰停止の確認**
   ステイシス演出中やコンフィグ中、ゲージやLIFEが減衰しないことを確認。
