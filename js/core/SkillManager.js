// SkillManager.js
// スキル発動の制御塔として機能する

import { CharacterPuzzleManager } from './CharacterPuzzleManager.js';

export const SkillManager = {
    /**
     * 指定されたスロットのキャラクターのスキルを発動する
     * @param {number} slotIndex - 発動するキャラクターのスロット番号 (0, 1, 2)
     */
    activateSkill(slotIndex) {
        const slotData = CharacterPuzzleManager.getSlotData(slotIndex);
        if (!slotData) return;

        console.log(`[SkillManager] オート発動: ${slotData.skillId}`);
        
        // TODO: 効果処理は今後のアップデートで追加予定
        
        // ゲージをリセットする
        slotData.currentCharge = 0;
    }
};
