// DebugConfig.js
// デバッグ用設定値およびデバッグスタート時のプリセットを定義するモジュール

// 第12層（DEBUG_OVERLAY）デバッグ機能を一括で切り替えるためのフラグ
export const ENABLE_DEBUG_OVERLAY = true;

// ConfigScene.js のボタンに適用する設定値リスト
// 「ボタンの表記名（label）」と「実際の数値（value）」を分離したオブジェクトの配列として定義する。
export const DEBUG_VALUES = {
    // BFS探索範囲倍率
    BFS: [1, 3, 5],

    // スコア倍率 (BigInt型)
    SCORE: [
        { label: 'x1', value: 1n },
        { label: 'x1億', value: 100000000n },
        { label: 'x1極', value: 1000000000000000000000000000000000000000000000000n }
    ],

    // LIFE減少倍率
    LIFE_DECAY: [0, 0.5, 1],

    // 獲得EXP倍率
    EXP: [1, 10, 50],

    // ゲームスピード (Matter.js 物理タイムスケール)
    SPEED: [0.2, 0.5, 1.0],

    // 物理ワイヤーフレーム表示設定
    WIREFRAME: [
        { label: 'OFF', value: false },
        { label: 'ON', value: true }
    ],

    // シフト減衰倍率
    SHIFT_DECAY: [
        { label: 'x0', value: 0 },
        { label: 'x1', value: 1 },
        { label: 'x5', value: 5 }
    ],

    // シフトゲージ値
    SHIFT_GAUGE: [
        { label: '0', value: 0 },
        { label: '100', value: 100 },
        { label: 'MAX', value: 1000 }
    ],

    // リバースゲージ値
    REVERSE_GAUGE: [
        { label: '0', value: 0 },
        { label: '100', value: 100 },
        { label: 'MAX', value: 1000 }
    ]
};

// タイトルからデバッグスタートした際のデバッグ設定の初期値
export const DEBUG_START_INITIAL_VALUES = {
    debugMode: true,         // デバッグウィンドウ表示ON
    bfsMultiplier: 3,        // BFS探索範囲倍率
    scoreMultiplier: 1n,     // スコア倍率
    lifeDecayMultiplier: 0,  // LIFE減少倍率
    expMultiplier: 50,       // 獲得EXP倍率
    timeScale: 1,          // ゲームスピード
    showWireframe: false,    // 物理ワイヤーフレーム表示
    shiftDecayMult: 1       // シフト減衰倍率
};
