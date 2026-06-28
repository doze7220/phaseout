# 実装指示書：スキル発動ポップアップUIの追加

スキル発動時の視覚的フィードバック（ポップアップ）を第8層（POPUP_TEXT）に実装する。

## 1. effects.js へのFacade追加
*   **ファイル**: `js/core/effects.js`
*   **内容**: スキルポップアップ発動の委譲関数を追加せよ。
    *   `export function showSkillPopup(skillName, colorId, slotIndex)` を新設。
    *   内部で `ScreenEffects` 系（`ScreenEffectPopup` または `FloatingNumberRenderer` の拡張）へ処理を委譲せよ。

## 2. ScreenEffectPopup.js 周辺へのポップアップ描画追加
*   **内容**: 指定されたキャラクターパネルの少し上に、スキル発動テキストを上へフェード移動しながら描画（数秒で消滅）する処理を実装せよ。
*   **座標計算の注意**:
    *   フッターの描画位置は `slotMapping = [1, 2]`（左から2人目、1人目、3人目）である。
    *   渡された `slotIndex` から逆引きしてパネルの表示位置（0=左、1=中央、2=右）を求め、各パネルの中央X座標を算出せよ。
    *   Y座標は「フッターUIの上端から少し上（-50px程度）」を起点とせよ。
*   **描画テキスト**:
    *   1行目: `SKILL EXEC`
    *   2行目: `<<${skillName}>>` （例: `<<RUBY BULLET>>`）
    *   テキストの色は引数で渡された `colorId`（陣営色）をベースに発光（シャドウブラー）させること。

## 3. SkillManager.js からの発動結線
*   **対象**: `js/core/SkillManager.js` の `activateSkill(slotIndex)`
*   **内容**:
    *   ファイル上部で `effects.js` をインポートせよ。
    *   ゲージを0にリセットした直後に、`effects.showSkillPopup(skillData.name, slotData.colorId, slotIndex);` を呼び出せ。

## 4. 動作確認
*   パズルを実行し、赤色を消してルビィのゲージをMAXにする。
*   自動発動時、フッター中央（ルビィのパネルの真上）に `SKILL EXEC \n <<RUBY BULLET>>` という文字が赤く発光しながらポップアップし、消えていくことを確認せよ。
*   完了後、インデックス資料（`FEATURE_ADD_CHARCTOR.md`）の更新を行うこと。