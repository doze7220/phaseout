# 実装計画・進行チェックリスト: EffectConfig 定数解体

本ドキュメントは `20260623_order10_refactoring_EffectConfig.md` の指示に基づく、`effectConfig.js` 内定数の完全解体に向けた段階的進行チェックリストである。
「ただ乗り」によるバグ混入を未然に防ぎ、単一責任原則（SRP）を徹底するため、必ず以下の **フェイズ（Phase）ごとに作業を区切り、都度動作確認を行うこと**。

※ 共通のルールとして、各フェイズが完了した時点で一旦作業をストップし、「Phase X が完了しました。実機確認をお願いします」とユーザーへ報告すること。

---

## 🕒 【1】パズル時間に属するエフェクト設定 (gameDelta依存)

### [x] Phase 1: PARTICLE_CONFIG （破片・火花エフェクト）
- [x] **定数の新設**: `effectConfig.js` に `PARTICLE_CONFIG` を新設し、`EFFECT_MATH_CONFIG.PARTICLE` の内容を移植。
- [x] **依存元の置換**: `ParticleManager.js` 等を検索し、関連するインポートと参照を置換。
- [x] **旧定数の無効化**: `EFFECT_MATH_CONFIG.PARTICLE` を `undefined` にして無効化。
- [x] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [x] Phase 2: LASER_EFFECT_CONFIG （レーザー演出）
- [x] **定数の新設**: `effectConfig.js` に `LASER_EFFECT_CONFIG` を新設し、レーザー関連（`LASER_SHRINK_TIMER`, `SHRINK_BASE` 等）を移植。
- [x] **依存元の置換**: `renderer.js` や `LaserEffect.js` 等の関連参照箇所を置換。
- [x] **旧定数の無効化**: 移植元のプロパティを無効化。
- [x] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [x] Phase 3: POPUP_EFFECT_CONFIG （ポップアップUI演出）
- [x] **定数の新設**: `effectConfig.js` に `POPUP_EFFECT_CONFIG` を新設し、ポップアップ・フローティング関連（`FLOAT_TEXT_DURATION_MS`, `FLOAT_TEXT_OFFSET` 等）を移植。
- [x] **依存元の置換**: `FloatingNumberRenderer.js` 等の関連参照箇所を置換。
- [x] **旧定数の無効化**: 移植元のプロパティを無効化。
- [x] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [x] Phase 4: SCREEN_SHAKE_CONFIG （画面揺れ）
- [x] **定数の新設**: `effectConfig.js` に `SCREEN_SHAKE_CONFIG` を新設し、画面揺れ関連（`SHAKE_DURATION_MS`）を移植。
- [x] **依存元の置換**: `ScreenEffects.js` 等の関連参照箇所を置換。
- [x] **旧定数の無効化**: 移植元のプロパティを無効化。
- [x] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [ ] Phase 5: TRIBAL_EFFECT_CONFIG （プリズムリンク / 新色解放演出）
- [ ] **定数の新設**: `effectConfig.js` に `TRIBAL_EFFECT_CONFIG` を新設し、`TRIBAL_UNLOCK` や `PRISM_LINK` 等を移植。
- [ ] **依存元の置換**: `ScreenEffectVignette.js`, `PrismLinkRenderer.js` 等の関連参照箇所を置換。
- [ ] **旧定数の無効化**: 移植元のプロパティを無効化。
- [ ] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

---

## 🌀 【2】フェイズ時間に属するエフェクト設定

### [ ] Phase 6: WHITE_PHASE_EFFECT_CONFIG （ステイシス・ホワイト演出等）
- [ ] **定数の新設**: `effectConfig.js` に `WHITE_PHASE_EFFECT_CONFIG` を新設し、`PHASE_WHITE`, `PHASE_WHITE_EXIT`, `WHITE_PHASE_GLITCH_THRESHOLD`, `WHITE_PHASE_GLOW`, `WHITE_SCORE_GLOW` 等を移植。
- [ ] **依存元の置換**: `ScreenEffectTransition.js`, `ChainScoreRenderer.js` 等の関連参照箇所を置換。
- [ ] **旧定数の無効化**: 移植元のプロパティを無効化。
- [ ] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

---

## ⚡ 【3】システム現実時間に属するエフェクト設定 (realDelta依存)

### [ ] Phase 7: RIPPLE_CONFIG （タップ波紋）
- [ ] **定数の新設**: `effectConfig.js` に `RIPPLE_CONFIG` を新設し、波紋関連（`RIPPLE_DURATION_MS`, `PRISM_FLUCTUATION` 等）を移植。
- [ ] **依存元の置換**: `RippleManager.js`, `BackgroundManager.js` 等の関連参照箇所を置換。
- [ ] **旧定数の無効化**: 移植元のプロパティを無効化。
- [ ] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [ ] Phase 8: GAUGE_ANIM_CONFIG （LIFE / EXPゲージアニメーション）
- [ ] **定数の新設**: `effectConfig.js` に `GAUGE_ANIM_CONFIG` を新設し、ゲージアニメーションやパルス関連（`PULSE_SPEED`, `PULSE_MULTI`, フリッカー速度設定等）を移植。
- [ ] **依存元の置換**: `GaugeManager.js`, `renderer.js` 等の関連参照箇所を置換。
- [ ] **旧定数の無効化**: 移植元のプロパティを無効化。
- [ ] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

### [ ] Phase 9: VISUALIZER_CONFIG （背景ビジュアライザ）
- [ ] **定数の新設**: `effectConfig.js` に `VISUALIZER_CONFIG` を新設。（※現在の `EFFECT_MATH_CONFIG` 内に該当プロパティが見当たらない場合や、他から移管する場合は新規定義を整理する）
- [ ] **依存元の置換**: `Visualizer.js` 等の関連参照箇所を置換（または新規適用）。
- [ ] **旧定数の無効化**: 移植元のプロパティを無効化（該当があれば）。
- [ ] **確認・報告**: 作業を中断し、ユーザーへ動作確認を依頼する。

---

## 🛠️ その他の残存設定の処理（最終フェイズ）

### [ ] Phase 10: RESULT_GLITCH_CONFIG 等の整理
- [ ] **定数の新設・整理**: `RESULT_GLITCH` など、1〜9に分類しきれなかった設定を `RESULT_EFFECT_CONFIG` 等として整理・新設。
- [ ] **依存元の置換**: `ResultRenderer.js` 等の関連箇所を置換。
- [ ] **完全なクリーンアップ**: 旧 `EFFECT_MATH_CONFIG` オブジェクトが完全に空（すべてのプロパティがundefined等）になったことを確認し、最終的に不要であれば定義自体を削除（または非推奨として残すかの判断を行う）。
- [ ] **最終確認**: 作業を完了し、全行程の終了をユーザーに報告する。

---

## ⚠️ 実装時のルール・不明点
*   **不明点1**: 上記の分類（例えば `SPARK_COUNT_MULTI` は Phase 1 の PARTICLE か、Phase 2 の LASER か）について、実装時に実際に参照されている箇所（`renderer.js` など）を確認し、最も適切なコンフィグへ振り分けること。
*   **不明点2**: `VISUALIZER_CONFIG` など、現状の `EFFECT_MATH_CONFIG` に明示的なプロパティが存在しない場合は、空のオブジェクトを定義するか、実装時に仕様を確認すること。
*   **参照制限**: `PROJECT_ARCHITECTURE.md` を唯一のアーキテクチャ資料とし、それ以外の過去チャット等は参照しないこと。
*   **【絶対ルール：コメントの付与】**：各定数を新設・移植する際は、必ずそのパラメータが何を制御するものか（例：パーティクルの発生数、レーザーの太さ等）、適切なコメント（JSDoc等）を付与すること。元の `EFFECT_MATH_CONFIG` にコメントが存在する場合はそれを維持し、存在しない場合は依存元ファイルの使われ方を解析して自律的に記述すること。
*   **次のAI（新規チャット）への指示**: 本ファイルはチェックリストとして機能する。現在未完了の先頭のフェイズ（最初は Phase 1）を実行し、そのフェイズが完了したらこのファイルの該当チェックボックスを `[x]` に書き換えて保存した上で、ユーザーに完了報告をすること。
