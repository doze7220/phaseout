// CharacterPuzzleManager.js
// インゲーム（パズル）限定で編成キャラクターの現在のスキルゲージを管理する

import { CharacterData } from './CharacterData.js';

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
                // 静的データと動的なパズル用ステート（現在ゲージ等）をマージして保持
                this.slots.push({
                    ...staticData,
                    currentCharge: 0
                });
            } else {
                this.slots.push(null);
            }
        }
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
     * スキルゲージ加算ロジック（プレースホルダー）
     * @param {string} color - 消去された宝石の色
     * @param {number} amount - 加算量
     */
    addCharge(color, amount) {
        // TODO: 色に応じたキャラクターを検索し、ゲージを加算するロジックを実装
        // 今後のアップデートで拡充予定
    },

    /**
     * パズル終了時のリセット処理
     */
    reset() {
        this.slots = [];
    }
};
