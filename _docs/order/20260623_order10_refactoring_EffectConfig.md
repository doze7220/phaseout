### 実装指示書： `effectConfig.js` 内の定数解体と、安全な置換移行（フェーズド・デプリケーション）

## 目的
`effectConfig.js` に移動した巨大オブジェクト `EFFECT_MATH_CONFIG` を、単一責任原則（SRP）に基づきエフェクトごとの独立した定数に分割・エクスポートする。その際、旧オブジェクトへの「ただ乗り（意図せぬ依存）」を検知するため、旧定数の構造は抜け殻として残す。

## 全体仕様（最終的な分割対象）
最終的に `EFFECT_MATH_CONFIG` は以下の独立したオブジェクトとして新設される。
- `PARTICLE_CONFIG` （破片・火花エフェクト）
- `LASER_EFFECT_CONFIG` （レーザー演出）
- `POPUP_EFFECT_CONFIG` （ポップアップUI演出）
- `SCREEN_SHAKE_CONFIG` （画面揺れ）
- `WHITE_PHASE_EFFECT_CONFIG` （ステイシス・ホワイト演出等）
※共通で参照すべき秒数などは `BASE_TRANSITION_MS` 等の単独定数として定義し、各オブジェクト内で参照させる。

更に PROJECT_EFFECT.md に準拠し、各エフェクトを時間軸で分類する。

// ========================================================
// 【1】パズル時間に属するエフェクト設定 (gameDelta依存)
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.1
export const PARTICLE_CONFIG = { ... };      // 火花・破片
export const LASER_EFFECT_CONFIG = { ... };  // 接続レーザー
export const POPUP_EFFECT_CONFIG = { ... };  // スコアポップアップ
export const SCREEN_SHAKE_CONFIG = { ... };  // スクリーンシェイク
export const TRIBAL_EFFECT_CONFIG = { ... }; // プリズムリンク / 新色解放演出

// ========================================================
// 【2】フェイズ時間に属するエフェクト設定
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.2
export const WHITE_PHASE_EFFECT_CONFIG = { ... }; // ホワイト突入・ステイシス演出

// ========================================================
// 【3】システム現実時間に属するエフェクト設定 (realDelta依存)
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.3
export const RIPPLE_CONFIG = { ... };        // タップ波紋
export const GAUGE_ANIM_CONFIG = { ... };    // LIFE / EXPゲージアニメーション
export const VISUALIZER_CONFIG = { ... };    // 背景ビジュアライザ


## ⚠️ 絶対厳守ルール（段階的作業と確認の義務）
すべてを一度に置換するとエラー原因の特定が困難になるため、**必ず1エフェクトごとに作業を中断し、実機でのチェックを挟むこと**。
今回のプロンプトでは、**【Phase 1: PARTICLE（火花・破片）】の分離のみ**を実行せよ。他のエフェクトには絶対に触れてはならない。

## 【Phase 1】実装手順（今回はこれのみを実行）
1. **PARTICLE定数の新設**
   `effectConfig.js` の上部にて `export const PARTICLE_CONFIG = { ... };` を新設し、設定値を移植する。
2. **依存元ファイルの置換**
   `ParticleManager.js`, `effects.js`, `renderer.js` 等を検索し、`PARTICLE` に関連する `import` とプロパティを `PARTICLE_CONFIG` へ一括置換する。
3. **過去の遺物の罠（ただ乗り検知）**
   元の `EFFECT_MATH_CONFIG` オブジェクトのガワは残し、**`PARTICLE` の中身だけをコメントアウト（または `undefined` に）**すること。
4. **作業のストップと報告**
   上記が完了したら作業を完全に中断し、「Phase 1が完了しました。実機での動作確認をお願いします」とユーザーに報告せよ。

