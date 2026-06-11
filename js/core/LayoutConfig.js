// LayoutConfig.js

const APP_WIDTH = 720;
const APP_HEIGHT = 1280;
const FOOTER_HEIGHT = 100;
const PUZZLE_HEIGHT = 1120; // パズル領域の高さを固定
const HEADER_HEIGHT = APP_HEIGHT - FOOTER_HEIGHT - PUZZLE_HEIGHT; // ボトムアップで逆算

export const LAYOUT_CONFIG = {
    // 基準となる画面の論理解像度やマージン
    BASE: {
        WIDTH: APP_WIDTH,
        HEIGHT: APP_HEIGHT,
        FOOTER_HEIGHT: FOOTER_HEIGHT,
        PUZZLE_HEIGHT: PUZZLE_HEIGHT,
        HEADER_HEIGHT: HEADER_HEIGHT,
        INITIAL_GEM_COUNT: 200
    },
    // タイトル画面や汎用ボタンの標準設定
    BUTTON: {
        WIDTH: 240,            // 標準ボタンの幅
        HEIGHT: 60,            // 標準ボタンの高さ
        RADIUS: 10,            // 角丸の半径
        FONT: '20px sans-serif', // テキストボタンのフォント
        CONFIG_SIZE: 50,       // コンフィグボタンのサイズ (タイトル画面)
        CONFIG_TOP: 20,        // コンフィグボタンのY座標 (上からのマージン)
        CONFIG_RIGHT: 70       // コンフィグボタンのX座標 (右からのマージン)
    },
    // UI.Window等のモーダル画面設定
    MODAL: {
        WIDTH: 600,            // モーダルの基準幅
        HEIGHT: 900,           // モーダルの基準高さ
        TITLE_HEIGHT: 40,      // タイトルバーの高さ
        CLOSE_BTN_SIZE: 60,    // 閉じるボタン(X)のサイズ
        CLOSE_BTN_TOP: 10,     // 閉じるボタンのウィンドウ上端からのマージン
        CLOSE_BTN_RIGHT: 20,   // 閉じるボタンのウィンドウ右端からのマージン
        FONT_TITLE: '24px sans-serif' // タイトルのフォント
    },
    // ConfigScene内の要素配置設定
    CONFIG_SCENE: {
        PADDING_LEFT: 45,        // テキストの左マージン
        DEBUG_TOGGLE_RIGHT: 120, // デバッグトグルのウィンドウ右端からのマージン
        DEBUG_TOGGLE_Y: 130,     // デバッグトグルのY座標 (ウィンドウ内相対)
        DEBUG_TOGGLE_WIDTH: 80,  // デバッグトグルの幅
        DEBUG_TOGGLE_HEIGHT: 40, // デバッグトグルの高さ
        DEBUG_TEXT_Y: 150,       // デバッグテキストのY座標 (ウィンドウ内相対)
        EFFECT_TEXT_Y: 250,      // エフェクト設定テキストのY座標 (ウィンドウ内相対)
        EFFECT_BTN_WIDTH: 120,   // エフェクト設定ボタンの幅
        EFFECT_BTN_HEIGHT: 50,   // エフェクト設定ボタンの高さ
        EFFECT_BTN_LEFT: 40,     // エフェクト設定ボタンの左マージン
        EFFECT_BTN_Y: 280,       // エフェクト設定ボタンのY座標 (ウィンドウ内相対)
        EFFECT_BTN_GAP: 20,      // エフェクト設定ボタン間の隙間
        LOG_TEXT_Y: 390,         // 更新履歴テキストのY座標 (ウィンドウ内相対)
        LOG_AREA_LEFT: 40,       // 更新履歴エリアの左マージン
        LOG_AREA_Y: 410,         // 更新履歴エリアのY座標 (ウィンドウ内相対)
        LOG_AREA_MARGIN_RIGHT: 80, // 更新履歴エリアの右マージン (幅=winWidth-80計算用)
        LOG_AREA_MARGIN_BOTTOM: 450, // 更新履歴エリアの下マージン (高さ=winHeight-450計算用)
        LOG_LINE_HEIGHT: 24      // ログの行高
    },
    // テキスト・フォント関連設定
    TEXT: {
        TITLE_MAIN_FONT: 'bold 80px sans-serif',
        TITLE_SUB_FONT: '30px sans-serif',
        TITLE_MAIN_Y_RATIO: 0.4,  // タイトルメインテキストの画面高さに対するY座標割合
        TITLE_SUB_Y_RATIO: 0.48,  // タイトルサブテキストの画面高さに対するY座標割合
        DEFAULT_FONT: '24px sans-serif',
        SCROLL_FONT: '20px monospace'
    },
    // ヘッダーUI配置設定
    HEADER: {
        CONFIG_BTN_SIZE: 40,   // プレイ画面ヘッダーのコンフィグボタンサイズ
        CONFIG_BTN_MARGIN: 15, // コンフィグボタンのベース位置計算用マージン
        CONFIG_BTN_OFFSET_Y: 5, // コンフィグボタンの微調整Yオフセット
        CONFIG_BTN_RIGHT: 45,  // コンフィグボタンの右からのマージン
        LEVEL_BOX_HEIGHT: 40,  // レベル表示枠の高さ
        LEVEL_BOX_PADDING: 30, // レベル表示枠の横パディング
        LEVEL_Y_OFFSET: 10,    // レベル表示の微調整Yオフセット
        FONT_LEVEL: 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }
};
