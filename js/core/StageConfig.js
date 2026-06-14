// StageConfig.js
// ステージごとの色解放データを定義するデータ専用モジュール。
// ロジックの実行は一切行わない（データ定義のみ）。

/**
 * フル解放状態（制限なし）のデフォルトステージ定義。
 * ダミーのLv0を含み、Lv1以降はずっと7色がアクティブとなる。
 */
export const DEFAULT_STAGE = {
    // インデックス0はダミー（Lv0）。Lv1以降は常に7色。
    MAX_ACTIVE_COLORS: [0, 7, 7, 7, 7, 7, 7, 7],
    INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE', 'GREEN', 'BLUE', 'ORANGE'],
    UNLOCKABLE_COLORS: []
};

/**
 * 各ステージのデータ定義。
 * - MAX_ACTIVE_COLORS: レベルごとの最大アクティブ色数（インデックス0はダミー）。
 * - INITIAL_COLORS: ゲーム開始時（Lv1）からアクティブな色名リスト。
 * - UNLOCKABLE_COLORS: レベルアップでアンロックされる色名リスト（配列順にアンロック）。
 */
export const STAGE_DATA = {
    DEFAULT: DEFAULT_STAGE,

    // 【ゲーム本編の最初のステージ】
    STAGE_01: {
        // Lv1〜4まで4色、Lv5から段階的に枠が広がるロードマップ仕様
        MAX_ACTIVE_COLORS: [0, 4, 4, 4, 4, 5, 6, 7],

        INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE'],
        UNLOCKABLE_COLORS: ['GREEN', 'BLUE', 'ORANGE']
    }
};
