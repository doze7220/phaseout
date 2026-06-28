// CharacterPuzzleManager.js
// インゲーム（パズル）限定で編成キャラクターの現在のスキルゲージを管理する

import { CharacterData } from './CharacterData.js';
import { COLOR_CONFIG } from './config.js';
import { SkillData } from './SkillData.js';
import { SkillManager } from './SkillManager.js';

export const CharacterPuzzleManager = {
    slots: [], // 現在のパーティ編成枠ごとの状態を保持する配列

    /**
     * パズル開始時の初期化
     * @param {Array<string>} partyIds - GameState.party などから渡される編成ID配列
     */
    init(partyIds) {
        this.reset();
        for (let i = 0; i < partyIds.length; i++) {
            const charId = partyIds[i];
            const staticData = CharacterData[charId];
            if (staticData) {
                // UIの後方互換維持のため、skillNameを動的にマージする
                const skillName = staticData.skillId && SkillData[staticData.skillId] ? SkillData[staticData.skillId].name : staticData.skillName;
                // 静的データと動的なパズル用ステート（現在ゲージ等）をマージして保持
                this.slots.push({
                    ...staticData,
                    skillName: skillName,
                    currentCharge: 0
                });
            } else {
                this.slots.push(null);
            }
        }
        console.log("[CharPzMng] 初期化完了. Slots:", this.slots);
    },

    /**
     * UI描画用のスロットデータ取得
     * @param {number} slotIndex - 取得したい枠（0〜2など）
     * @returns {Object|null} キャラクターのゲージ情報オブジェクト
     */
    getSlotData(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.slots.length) {
            return this.slots[slotIndex];
        }
        return null;
    },

    /**
     * スキルゲージ加算ロジック
     * @param {string} colorHex - 消去された宝石の色（HEXコード）
     * @param {number} amount - 加算量
     */
    addCharge(colorHex, amount) {
        // HEXコードから COLOR_CONFIG の名前(Red等)を取得して大文字で統一
        const colorConfig = COLOR_CONFIG.find(c => c.color === colorHex);
        const colorName = colorConfig ? colorConfig.name.toUpperCase() : null;

        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            // slot.colorId ("RED", "Red" など) を大文字にして比較
            if (slot !== null && colorName && slot.colorId.toUpperCase() === colorName) {
                slot.currentCharge += amount;
                if (slot.currentCharge >= slot.maxCharge) {
                    slot.currentCharge = slot.maxCharge;
                    SkillManager.activateSkill(i);
                }
            }
        }
    },

    /**
     * パズル終了時のリセット処理
     */
    reset() {
        this.slots = [];
    }
};
