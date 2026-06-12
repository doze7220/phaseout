// LayoutConfig.js

const APP_WIDTH = 720;
const APP_HEIGHT = 1280;
const FOOTER_HEIGHT = 120;
const PUZZLE_HEIGHT = 1080; // パズル領域の高さを固定
const HEADER_HEIGHT = APP_HEIGHT - FOOTER_HEIGHT - PUZZLE_HEIGHT; // ボトムアップで逆算

const POPUP_LEVEL_UP_BG_Y = -380; // レベルアップ背景のY座標 (基準: ポップアップ中心)
const POPUP_CHAIN_BASE_Y = -70;    // スコア・チェイン演出の基準Y座標 (Chainテキストの位置)

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
        CONFIG_TOP: 20,        // コンフィグボタンのY座標 (基準: 画面上端)
        CONFIG_RIGHT: 70       // コンフィグボタンのX座標 (基準: 画面右端)
    },
    // UI.Window等のモーダル画面設定
    MODAL: {
        WIDTH: 600,            // モーダルの基準幅
        HEIGHT: 900,           // モーダルの基準高さ
        TITLE_HEIGHT: 40,      // タイトルバーの高さ
        CLOSE_BTN_SIZE: 60,    // 閉じるボタン(X)のサイズ
        CLOSE_BTN_TOP: 10,     // 閉じるボタンの上マージン (基準: ウィンドウ上端)
        CLOSE_BTN_RIGHT: 20,   // 閉じるボタンの右マージン (基準: ウィンドウ右端)
        FONT_TITLE: '24px sans-serif' // タイトルのフォント
    },
    // ConfigScene内の要素配置設定
    CONFIG_SCENE: {
        PADDING_LEFT: 45,        // 各種テキストの左マージン (基準: ウィンドウ左端)
        DEBUG_TOGGLE_RIGHT: 120, // デバッグトグルの右マージン (基準: ウィンドウ右端)
        DEBUG_TOGGLE_Y: 130,     // デバッグトグルのY座標 (基準: ウィンドウ上端)
        DEBUG_TOGGLE_WIDTH: 80,  // デバッグトグルの幅
        DEBUG_TOGGLE_HEIGHT: 40, // デバッグトグルの高さ
        DEBUG_TEXT_Y: 150,       // デバッグテキストのY座標 (基準: ウィンドウ上端)
        EFFECT_TEXT_Y: 250,      // エフェクト設定テキストのY座標 (基準: ウィンドウ上端)
        EFFECT_BTN_WIDTH: 120,   // エフェクト設定ボタンの幅
        EFFECT_BTN_HEIGHT: 50,   // エフェクト設定ボタンの高さ
        EFFECT_BTN_LEFT: 40,     // エフェクト設定ボタン群の左マージン (基準: ウィンドウ左端)
        EFFECT_BTN_Y: 280,       // エフェクト設定ボタンのY座標 (基準: ウィンドウ上端)
        EFFECT_BTN_GAP: 20,      // エフェクト設定ボタン間の隙間
        MATH_TEXT_Y: 370,        // 詳細スコアテキストのY座標
        MATH_TOGGLE_Y: 350,      // 詳細スコアトグルのY座標
        LOG_TEXT_Y: 440,         // 更新履歴テキストのY座標 (基準: ウィンドウ上端)
        LOG_AREA_LEFT: 40,       // 更新履歴エリアの左マージン (基準: ウィンドウ左端)
        LOG_AREA_Y: 460,         // 更新履歴エリアのY座標 (基準: ウィンドウ上端)
        LOG_AREA_MARGIN_RIGHT: 80, // 更新履歴エリアの右マージン (基準: ウィンドウ右端)
        LOG_AREA_MARGIN_BOTTOM: 500, // 更新履歴エリアの下マージン計算用 (Y + 40px)
        LOG_LINE_HEIGHT: 24,     // ログテキストの行高
        LOG_LINE_MAX_LEN: 35     // ログテキスト1行あたりの最大文字数
    },
    // テキスト・フォント関連設定
    TEXT: {
        TITLE_MAIN_FONT: 'bold 80px sans-serif', // タイトルのメインフォント
        TITLE_SUB_FONT: '30px sans-serif',       // タイトルのサブフォント
        TITLE_MAIN_Y_RATIO: 0.4,                 // タイトルメインのY座標（基準: 画面高さ比率）
        TITLE_SUB_Y_RATIO: 0.48,                 // タイトルサブのY座標（基準: 画面高さ比率）
        DEFAULT_FONT: '24px sans-serif',         // 汎用フォント
        SCROLL_FONT: '20px monospace'            // スクロールUI用フォント
    },
    // ヘッダーUI配置設定
    HEADER: {
        CONFIG_BTN_SIZE: 40,     // プレイ画面ヘッダーのコンフィグボタンサイズ
        CONFIG_BTN_MARGIN: 15,   // コンフィグボタンのベース位置計算用マージン
        CONFIG_BTN_OFFSET_Y: 5,  // コンフィグボタンの微調整Yオフセット (基準: Header下端)
        CONFIG_BTN_RIGHT: 45,    // コンフィグボタンの右マージン (基準: 画面右端)
        LEVEL_BOX_HEIGHT: 40,    // レベル表示枠の高さ
        LEVEL_BOX_PADDING: 30,   // レベル表示枠の横パディング
        LEVEL_Y_OFFSET: 10,      // レベル表示の微調整Yオフセット (基準: Header下端)
        FONT_LEVEL: 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif', // レベル表示フォント

        UI_MARGIN_BOTTOM: 15,          // スコアなどUI要素の底面からのマージン
        ROW2_BASE_HEIGHT: 14,          // 下段要素のベース高さ
        ROW2_OFFSET_Y: 10,             // 下段要素のYオフセット
        ROW1_BASE_HEIGHT: 14,          // 上段要素のベース高さ
        TOP_ROW_BASE_HEIGHT: 30,       // 最上段要素のベース高さ
        TOP_ROW_OFFSET_Y: 10,          // 最上段要素のYオフセット
        TIMER_SCALE_Y: 1.0,            // タイマー描画のYスケール
        TIMER_SCALE_X: 0.6,            // タイマー描画のXスケール
        TIMER_OFFSET_Y: 5,             // タイマーのYオフセット
        TIMER_X: 10,                   // タイマーのX座標 (基準: 画面左端)
        DECAY_SCALE: 0.48,             // 減少値テキストのスケール
        TAP_COST_GAP: 10,              // タップコストテキストの間隔
        SCORE_PADDING_RIGHT: 60,       // スコア表示の右マージン (基準: 画面右端)
        SCORE_OFFSET_Y: 5,             // スコア表示のYオフセット
        SCORE_MAX_WIDTH_RATIO_MOBILE: 0.55, // モバイル時のスコア最大幅比率
        SCORE_MAX_WIDTH_OFFSET_MOBILE: 10,  // モバイル時のスコア幅調整オフセット
        SCORE_MAX_WIDTH_RATIO_PC: 0.65,     // PC時のスコア最大幅比率
        SCORE_MAX_WIDTH_OFFSET_PC: 50       // PC時のスコア幅調整オフセット
    },
    // HP・EXPゲージ設定
    GAUGE: {
        MARGIN_X: 10,                      // 画面左右端からのマージン（基準: 画面端）
        MARGIN_Y: 10,                      // 画面上下端からのマージン（基準: 画面端）
        LINE_WIDTH: 4,                     // ゲージの線の太さ
        EXP_RADIUS: 2                      // EXPゲージの角丸
    },
    // 連鎖やレベルアップ等のポップアップ演出設定
    POPUPS: {
        CHAIN_TEXT_Y: POPUP_CHAIN_BASE_Y,                  // 連鎖テキストのY座標 (基準: ポップアップ中心)
        MATH_TEXT_Y: POPUP_CHAIN_BASE_Y - 50,              // 数式テキストのY座標
        SCORE_REALTIME_Y: POPUP_CHAIN_BASE_Y - 120,        // スコア描画エリアの中心Y座標
        SCORE_CANVAS_SCALE: 1.5,                           // スコア描画のスケール
        LEVEL_UP_BG_Y: POPUP_LEVEL_UP_BG_Y,
        LEVEL_UP_BG_HEIGHT: 160,           // レベルアップ背景の高さ
        LEVEL_UP_TITLE_Y: POPUP_LEVEL_UP_BG_Y + 30,  // レベルアップタイトルのY座標
        LEVEL_UP_LEVEL_Y: POPUP_LEVEL_UP_BG_Y + 70,  // レベルアップテキストのY座標
        LEVEL_UP_RATE_LABEL_X: -80,        // RATEラベルのX座標 (基準: ポップアップ中心)
        LEVEL_UP_RATE_OLD_X: -20,          // 旧RATE値のX座標
        LEVEL_UP_RATE_ARROW_X: 20,         // 矢印のX座標
        LEVEL_UP_RATE_NEW_X: 100,          // 新RATE値のX座標
        LEVEL_UP_RATE_Y: POPUP_LEVEL_UP_BG_Y + 105,  // RATE情報全体のY座標
        LEVEL_UP_COST_Y: POPUP_LEVEL_UP_BG_Y + 130,  // COST情報のY座標
        FONT_CHAIN: 'bold 40px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        FONT_SCORE_LABEL: 'bold 20px "Segoe UI"',
        FONT_LEVEL_UP_TITLE: 'italic 900 32px "Segoe UI"',
        FONT_LEVEL_UP_LEVEL: 'bold 24px "Segoe UI"',
        FONT_LEVEL_UP_STATS: 'bold 18px monospace'
    },
    // TitleScene 設定
    TITLE_SCENE: {
        START_BTN_Y_RATIO: 0.7,            // STARTボタンのY座標（基準: 画面高さ比率）
        SHADOW_COLOR: 'rgba(0, 0, 0, 0.8)',// タイトルロゴの影の色
        SHADOW_BLUR: 20,                   // メインタイトルの影のぼかし幅
        SHADOW_OFFSET_X: 0,                // メインタイトルの影のXズレ
        SHADOW_OFFSET_Y: 0,                // メインタイトルの影のYズレ
        VERSION_FONT: '14px monospace',    // バージョン表記用フォント
        VERSION_Y_OFFSET: 10,              // バージョン表記のYマージン（基準: 画面下端）
        VERSION_COLOR: 'rgba(255, 255, 255, 0.5)' // バージョン表記の文字色
    },
    // BootScene 設定
    BOOT_SCENE: {
        FONT_INIT: '24px monospace',       // 初期化中テキストのフォント
        INIT_Y_OFFSET: -40,                // 初期化中テキストのYオフセット (基準: 画面中心)
        FONT_TAP: 'bold 36px sans-serif',  // TAPテキストのフォント
        TAP_Y_RATIO: 0.75                  // TAPテキストのY座標 (基準: 画面高さ比率)
    },
    // ResultScene (ResultRenderer) 設定
    RESULT_SCENE: {
        FONT_TITLE: 'bold 48px sans-serif',// リザルトタイトルのフォント
        TITLE_Y: 200,                      // リザルトタイトルのY座標
        SCORE_OFFSET_X: -150,              // スコアのXオフセット (基準: 画面中心)
        SCORE_Y: 240,                      // スコアのY座標
        SCORE_SCALE: 1,                    // スコアのスケール
        FONT_LEVEL: 'bold 36px sans-serif',// 到達レベルのフォント
        LEVEL_Y: 400,                      // 到達レベルのY座標
        FONT_TIME: '30px sans-serif',      // プレイ時間のフォント
        TIME_Y: 460,                       // プレイ時間のY座標
        CHAIN_Y: 520,                      // 最大連鎖数のY座標
        MAX_SCORE_LBL_Y: 580,              // 最大スコア(ラベル)のY座標
        MAX_SCORE_OFFSET_X: -100,          // 最大スコア値のXオフセット (基準: 画面中心)
        MAX_SCORE_Y: 600,                  // 最大スコア値のY座標
        MAX_SCORE_SCALE: 0.7,              // 最大スコア値のスケール
        FONT_NEXT: '24px sans-serif',      // NEXTボタンのフォント
        NEXT_Y_OFFSET: 100,                // NEXTボタンのYオフセット (基準: 画面下端)
        FONT_TOTAL: 'bold 36px sans-serif',// リザルト合計スコアのフォント
        TOTAL_Y: 150,                      // リザルト合計スコアのY座標
        LOG_AREA_OFFSET_X: -250,           // ログエリアのXオフセット (基準: 画面中心)
        LOG_AREA_Y: 200,                   // ログエリアのY座標
        LOG_AREA_WIDTH: 500,               // ログエリアの幅
        LOG_AREA_BOTTOM_MARGIN: 400,       // ログエリアの下マージン (基準: 画面下端)
        FONT_LOG: '24px sans-serif',       // ログテキストのフォント
        LOG_ICON_OFFSET_X: 40,             // ログアイコンのXオフセット (基準: ログエリア左端)
        LOG_TEXT_OFFSET_X: 70              // ログテキストのXオフセット (基準: ログエリア左端)
    },
    // デバッグオーバーレイ（FPS表示等）設定
    DEBUG_OVERLAY: {
        FPS_FONT: 'bold 16px monospace',   // FPS表示用フォント
        FPS_OFFSET_X: 10,                  // FPS表示の右マージン（基準: 画面右端）
        FPS_OFFSET_Y: 10,                  // FPS表示の下マージン（基準: 画面下端）
        FPS_OUTLINE_WIDTH: 3,              // FPS文字の縁取り線の太さ
        FPS_COLOR_GOOD: '#00FF00',         // FPS 50以上の文字色
        FPS_COLOR_WARN: '#FFCC00',         // FPS 30～49の文字色
        FPS_COLOR_BAD: '#FF3B30',          // FPS 29以下の文字色
        WINDOW_FONT: 'bold 12px monospace',// デバッグ情報ウィンドウのフォント
        WINDOW_X: 5,                       // デバッグウィンドウ左上X（基準: 画面左端）
        WINDOW_Y: 125,                     // デバッグウィンドウ左上Y（基準: 画面上端）
        WINDOW_WIDTH: 280,                 // デバッグウィンドウの幅
        WINDOW_PADDING: 10,                // デバッグウィンドウの上下パディング
        WINDOW_BG_COLOR: 'rgba(0, 0, 0, 0.6)', // デバッグウィンドウの背景色
        LINE_HEIGHT: 16,                   // デバッグテキストの行の高さ
        TEXT_OFFSET_X: 10,                 // テキスト開始位置X（基準: 画面左端）
        TEXT_START_Y: 130,                 // 1行目のテキスト開始位置Y（基準: 画面上端）
        TEXT_COLOR: '#00FF00'              // デバッグテキストの基本文字色
    }
};
