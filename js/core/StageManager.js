// StageManager.js
// ゲームの進行・環境構築（ステージごとの色解放）を管理するシングルトンクラス。
// config.js の GameState と StageConfig.js を参照し、色の解放・進行管理の責務を担う。

import { STAGE_DATA, DEFAULT_STAGE } from './StageConfig.js';
import { GameState, COLOR_CONFIG } from './config.js';

class StageManagerClass {
    constructor() {
        // 現在ロードされているステージデータ（initで設定）
        this._stageData = null;
    }

    /**
     * 色名（'RED'等）をHEXカラーコードへ変換するヘルパー。
     * COLOR_CONFIG の name フィールドで大文字比較を行う。
     * @param {string} colorName - 色名（例: 'RED'）
     * @returns {string|null} HEXコード、または見つからない場合は null
     */
    _colorNameToHex(colorName) {
        const found = COLOR_CONFIG.find(c => c.name.toUpperCase() === colorName.toUpperCase());
        return found ? found.color : null;
    }

    /**
     * 指定されたステージIDのデータを読み込む。
     * 存在しないIDの場合は DEFAULT にフォールバックする。
     * ※この時点では GameState.activeColors の設定は行わない。
     *   setupActiveColors() で確定させること。
     * @param {string} stageId - ステージID（例: 'STAGE_01'）
     */
    init(stageId) {
        if (STAGE_DATA[stageId]) {
            this._stageData = STAGE_DATA[stageId];
            console.log(`[StageManager] ステージ "${stageId}" を読み込みました。`);
        } else {
            this._stageData = DEFAULT_STAGE;
            console.warn(`[StageManager] ステージ "${stageId}" が見つからないため DEFAULT にフォールバックします。`);
        }
    }

    /**
     * GameState.activeColors を現在のステージの INITIAL_COLORS で初期化する。
     * また colorDestroyCounts / totalScorePerColor も同時に初期化する。
     * initPhysics() 内の GameState.reset() 直後に呼び出すこと。
     */
    setupActiveColors() {
        if (!this._stageData) {
            console.warn('[StageManager] setupActiveColors() が init() より前に呼ばれました。DEFAULTを使用します。');
            this._stageData = DEFAULT_STAGE;
        }

        // 色名リスト → HEXコード配列に変換
        const hexColors = this._stageData.INITIAL_COLORS
            .map(name => this._colorNameToHex(name))
            .filter(hex => hex !== null);

        // GameState.activeColors を初期色で設定
        GameState.activeColors = hexColors;

        // colorDestroyCounts / totalScorePerColor を現在のアクティブ色で初期化
        GameState.colorDestroyCounts = {};
        GameState.totalScorePerColor = {};
        for (const colorHex of GameState.activeColors) {
            GameState.colorDestroyCounts[colorHex] = 1;
            GameState.totalScorePerColor[colorHex] = 0n;
        }

        console.log(`[StageManager] activeColors を ${GameState.activeColors.length} 色で初期化しました: ${GameState.activeColors.join(', ')}`);
    }

    /**
     * レベルアップ時に呼び出し、色のアンロックを処理する。
     * MAX_ACTIVE_COLORS[newLevel] と現在の activeColors.length を比較し、
     * 枠が増えていれば UNLOCKABLE_COLORS から未アクティブの色を1つ追加する。
     * @param {number} newLevel - レベルアップ後の新しいレベル
     */
    onLevelUp(newLevel) {
        if (!this._stageData) return;

        const maxColorsArray = this._stageData.MAX_ACTIVE_COLORS;
        // 配列範囲外の場合は末尾の値を使用（8以降のレベルは末尾値をクランプ）
        const maxColors = newLevel < maxColorsArray.length
            ? maxColorsArray[newLevel]
            : maxColorsArray[maxColorsArray.length - 1];

        const currentCount = GameState.activeColors.length;

        if (currentCount < maxColors) {
            // UNLOCKABLE_COLORS の中から、まだアクティブでない色を配列順で選出
            const unlockable = this._stageData.UNLOCKABLE_COLORS;
            let newColorHex = null;

            for (const colorName of unlockable) {
                const hex = this._colorNameToHex(colorName);
                if (hex && !GameState.activeColors.includes(hex)) {
                    newColorHex = hex;
                    break;
                }
            }

            if (newColorHex) {
                GameState.activeColors.push(newColorHex);
                // 新色のカウンターエントリを追加
                GameState.colorDestroyCounts[newColorHex] = 1;
                GameState.totalScorePerColor[newColorHex] = 0n;
                console.log(`[StageManager] Lv${newLevel}到達: 新色 "${newColorHex}" をアンロックしました。現在 ${GameState.activeColors.length} 色。`);
            }
        }
    }

    /**
     * 現在のアクティブカラー配列（HEXコード）を返す。
     * @returns {string[]} アクティブカラーのHEXコード配列
     */
    getActiveColors() {
        return GameState.activeColors;
    }
}

// シングルトンとしてエクスポート
export const StageManager = new StageManagerClass();
