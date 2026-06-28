# 実装指示書：スキルシステム基盤の構築

スキルシステムの土台となるデータ定義とマネージャーの結線を行う。
※重要：今回は「盤面への干渉（破壊や変換）」や「ポップアップ等のUI演出」は一切実装しない。ゲージがMAXになった際に自動発動し、ゲージが0にリセットされる「データフローの疎通確認（空撃ち）」のみを実装せよ。

## 1. SkillData.js の新設
*   **ファイル**: `js/core/SkillData.js` を新規作成せよ。
*   **内容**: スキルのマスターデータを定義する。
    *   ルビィのスキルとして `"skill_ruby_bullet"` を定義せよ。
    *   プロパティは現時点で最小限とし、`id: "skill_ruby_bullet"`, `name: "RUBY BULLET"`, `activationType: "AUTO"` のみを設定せよ。
*   **連携**: `js/core/CharacterData.js` のルビィのデータに、`skillId: "skill_ruby_bullet"` を追加せよ（既存の `skillName` は重複するため削除してよい）。

## 2. SkillManager.js の新設
*   **ファイル**: `js/core/SkillManager.js` を新規作成せよ。
*   **内容**: スキル発動の制御塔。
    *   `activateSkill(slotIndex)` メソッドを作成せよ。
    *   `CharacterPuzzleManager.getSlotData(slotIndex)` 等を用いてキャラクター情報を取得せよ。
    *   コンソールに発動ログを出力せよ。（例: `console.log("[SkillManager] オート発動:", slotData.skillId);`）
    *   対象スロットの `currentCharge` を 0 にリセットせよ（効果処理は今回は書かない）。

## 3. CharacterPuzzleManager.js へのオート発動結線
*   **対象**: `addCharge(colorHex, amount)` メソッド内。
*   **内容**:
    *   ファイル上部で `SkillManager` をインポートせよ。
    *   スロットごとのゲージ（`currentCharge`）を加算し、`maxCharge` でクランプした直後に判定を追加する。
    *   `currentCharge >= maxCharge` に到達した場合、即座に `SkillManager.activateSkill(slotIndex)` を呼び出せ。

## 4. 動作確認とドキュメント更新
*   パズルを実行し、赤色を消してルビィのゲージをMAXにする。
*   ゲージMAX到達時、コンソールに発動ログが出力され、フッターUIのゲージが自動的に0に戻ることを確認せよ。
