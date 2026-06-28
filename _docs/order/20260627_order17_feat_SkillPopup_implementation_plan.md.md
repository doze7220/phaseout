# スキル発動ポップアップUIの実装計画

指示書「20260627_order17_feat_SkillPopup.md」に基づく、キャラクターのスキル発動時のUIポップアップ演出実装プランです。

## 変更内容の概要

キャラクターのスキルゲージがMAXに到達し、自動発動した際に、フッターの対象キャラクターパネルの上部から「SKILL EXEC」「<<スキル名>>」が上方向へフェードしながら表示される視覚的フィードバックを追加します。

## Proposed Changes

### `js/core`

#### [MODIFY] [effects.js](file:///D:/ozlab/phaseout/js/render/effects.js)
* `export function showSkillPopup(skillName, colorId, slotIndex)` を新設します。
* 内部で `screenEffects.showSkillPopup(skillName, colorId, slotIndex)` を呼び出し、UI描画層へ処理を委譲します。

#### [MODIFY] [SkillManager.js](file:///D:/ozlab/phaseout/js/core/SkillManager.js)
* `import * as effects from '../render/effects.js';` の追加（もしくは必要な関数のみインポート）。
* `activateSkill(slotIndex)` 内で、ゲージをリセットした直後に `effects.showSkillPopup(slotData.skillName, slotData.colorId, slotIndex)` を呼び出す処理を追加します。

---

### `js/render`

#### [MODIFY] [ScreenEffectPopup.js](file:///D:/ozlab/phaseout/js/render/ScreenEffectPopup.js)
* コンストラクタで `this.skillPopups = []` を初期化します。
* `update(realDelta, gameDelta)` 内で、配列内の各ポップアップの寿命（elapsed）を更新し、寿命切れのものを破棄する処理を追加します。
* `showSkillPopup(skillName, colorId, slotIndex)` を追加し、新しいポップアップオブジェクトを配列にプッシュします。
* `drawPopups(ctx)` 内で、`this.skillPopups` を描画する処理を追加します。
  * **座標計算**: `slotMapping = [1, 0, 2]` を用いて `slotIndex` からパネルの表示位置（0=左、1=中央、2=右）を逆算します。
  * `X座標`: パネル幅（240） × 表示位置 + 120 (パネル中央)
  * `Y座標`: 基準Y（`APP_HEIGHT - FOOTER_HEIGHT - 50` 相当）から、経過時間に応じて上方向へ移動。
  * **描画内容**: 1行目に `SKILL EXEC`、2行目に `<<${skillName}>>` を描画。`THEME_COLORS` から取得した陣営色で発光（シャドウブラー）させます。

---

## 完了後のタスク

* パズル画面にて赤色を消し、ルビィのゲージをMAXにする。
* スキル自動発動時にフッター中央上部で「SKILL EXEC \n <<RUBY BULLET>>」の文字が赤く発光してポップアップすることを確認する。
* 動作確認後、`FEATURE_ADD_CHARCTOR.md` に今回の改修内容（ポップアップ追加の件）を追記する。

## User Review Required

実装内容に問題がないか、あるいは追加のご要望があるか確認をお願いします。
承認いただけましたら、実装作業に入ります。
