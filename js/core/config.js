// config.js
import { changelog } from '../../changelog.js';

const CURRENT_VERSION = changelog[0].version;
export const GRAPHICS_CONFIG = {
    GEM_STYLE: 'overlay', // 'h-light', 'overlay', 'flat' のいずれか
    SHOW_SYMBOL: true, // トライバル刻印の表示ON/OFF
    GEM_OUTLINE: 'FULL' // 'FULL', 'LINE', 'NONE' のいずれか
};

export const CORE_MATH_CONFIG = {
    EXP_BASE_EFFICIENCY: 100, // 基本経験値計算時のマジックナンバー
    DEPTH_BONUS_DIVISOR: 10n  // 階層ボーナスの除算値 (1 + Depth/10)
};

export const PHASE_SHIFT_MATH = {
    GAUGE_MAX: 1000,
    GAUGE_ADD_BASE: 100,
    GAUGE_ADD_CHAIN_MULTI: 2,
    GAUGE_ADD_DEPTH_MULTI: 15,
    DECAY_BASE: 0.5,
    DECAY_ACCEL_COEFF: 2.0,
    DECAY_POWER: 2
};

export const PHYSICS_MATH_CONFIG = {
    MAX_DELTA_MS: 33,        // FPS低下時の最大Delta
    FALLBACK_DELTA_MS: 16.66 // 負の値の際のフォールバックDelta
};

export const EFFECT_MATH_CONFIG = {
    LASER_SHRINK_TIMER: 10,
    SHRINK_BASE: 0.85,
    SHRINK_MIN: 0.5,
    SHRINK_LEVEL_MULTI: 0.05,
    FLASH_BASE: 0.6,
    FLASH_MAX: 0.9,
    FLASH_LEVEL_MULTI: 0.1,
    PULSE_SPEED: 100,
    PULSE_MULTI: 0.05,
    SPARK_COUNT_MULTI: 1,
    BURST_SPARK_COUNT_MULTI: 10,
    SHAKE_DURATION_MS: 500,
    RIPPLE_DURATION_MS: 350,
    FLOAT_TEXT_DURATION_MS: 2400,
    FLOAT_TEXT_OFFSET: {
        DAMAGE: -20,
        HEAL: 20,
        EXP: 40
    },
    TRIBAL_UNLOCK: {
        FILL_MODE: 1,              // シンボルの色塗りモード (0: 元画像のまま, 1: 陣営色で塗りつぶし, 2: 下記の指定色で塗りつぶし)
        FILL_CUSTOM_COLOR: 'rgba(255, 255, 255, 1.0)', // FILL_MODE が 2 の場合に使われる塗りつぶし色
        DURATION_MS: 2500,         // 演出の合計時間（ミリ秒）
        SCALE_START: 0.3,          // 出現時の初期スケール（1.0で元画像サイズ(512px)。大きすぎる場合はここを0.3〜0.5にする）
        SCALE_ADD: 0.6,            // 演出完了までにどれだけスケールを加算するか
        SCALE_POWER: 0.5,          // スケール拡大のイージングカーブ（0.5だと最初は早く、後からゆっくり拡大）
        FADE_IN_END: 0.2,          // 演出時間の何割でフェードインを終えるか（0.0〜1.0）
        FADE_OUT_START: 0.6,       // 演出時間の何割からフェードアウトを始めるか（0.0〜1.0）
        MAX_ALPHA: 0.8,            // 最大不透明度（1.0だと眩しすぎる場合があるため調整）
        SHADOW_BLUR: 30,           // 光彩（発光）の強さ・ボカシ幅
        COMPOSITE_OP: 'source-over',    // 合成モード（'lighter'で加算発光、'source-over'で通常描画、他`screen``color-dodge``overlay`'hard-light''multiply''xor'等）
        FACTION_TEXT_Y_OFFSET: 10,          // 陣営ログテキストの表示位置（画面中央からのYオフセット）
        FACTION_TEXT_FONT: '16px monospace, "Courier New"', // 陣営ログテキストのフォント
        FACTION_GLITCH_IN_END: 0.15,        // 出現時のグリッチ終了タイミング（進行度 0.0〜1.0）
        FACTION_GLITCH_OUT_START: 0.75,     // 消去時のグリッチ開始タイミング（進行度 0.0〜1.0）
        FACTION_TEXT_HIDE_START: 0.8        // テキストが完全に非表示になるタイミング（進行度 0.0〜1.0）
    },
    PRISM_LINK: {
        DROP_DURATION_MS: 150,             // スタンプ落下の所要時間
        FLASH_DURATION_MS: 60,            // 落下後の白フラッシュの持続時間
        MAX_SCALE: 3.0,                    // 落下開始時の最大スケール
        LASER_WIDTH_MULT: 0.5,             // レーザー膨張時の太さの加算倍率
        GLITCH_DURATION_MS: 200,           // 消去時のグリッチ持続時間
        SHOW_UNLIT_BASE: false,            // 未到達（点灯前）のベースアイコンを表示するかどうか
        BASE_COMPOSITE_OP: 'source-over',  // プリズムゲージ・ベースアイコンの合成モード：'lighter''source-over' 'screen''color-dodge''overlay''hard-light''multiply''xor'等
        BASE_FILL_MODE: 1,                 // 0: 元画像, 1: 陣営色, 2: カスタム色
        BASE_FILL_CUSTOM_COLOR: 'rgba(0, 0, 0, 1.0)',
        BASE_OUTLINE_WIDTH: 1,             // ベースアイコンのアウトラインの太さ (0で無効)
        BASE_OUTLINE_FILL_MODE: 2,         // アウトラインの塗りつぶしモード (0: 元画像, 1: 陣営色, 2: カスタム色)
        BASE_OUTLINE_COMPOSITE_OP: 'lighter', // アウトラインの合成モード
        BASE_OUTLINE_CUSTOM_COLOR: 'rgba(0, 255, 255, 1.0)', // アウトラインのカスタム色
        STAMP_COMPOSITE_OP: 'source-over',     // 落下してくる半透明スタンプおよびフラッシュ時の合成モード
        STAMP_FILL_MODE: 1,                // 例: 陣営色で発光しながら落下
        STAMP_FILL_CUSTOM_COLOR: 'rgba(255, 255, 255, 1.0)'
    },
    PARTICLE: {
        BASE_COUNT: 5,
        RAND_COUNT: 5,
        BASE_SPEED: 2,
        RAND_SPEED: 6,
        BASE_SIZE: 12,       // 破片を大きくするため初期値4から8へ変更
        RAND_SIZE: 12,       // 同上
        ROTATION_SPEED_MAX: 0.4,
        DECAY_BASE: 0.02,
        DECAY_RAND: 0.03
    },
    RESULT_GLITCH: {
        DURATION_MS: 250,
        SLICE_HEIGHT: 8,
        BASE_OFFSET_AMP: 8,
        NOISE_PROBABILITY: 0.1,
        NOISE_OFFSET_AMP: 40,
        COLOR_R: 'rgba(255, 0, 0, 0.8)',
        COLOR_C: 'rgba(0, 255, 255, 0.8)',
        COLOR_SHIFT_R: -5,
        COLOR_SHIFT_C: 5
    },
    // フルプリズムリンク（7色リンク）達成時の波紋（余波）演出
    PRISM_FLUCTUATION: {
        MAX_ENERGY: 150,        // 1波あたりの最大エネルギー量（視覚的な最大強度の上限）
        MIN_THICKNESS: 5,      // 波紋線の最低太さ
        MAX_THICKNESS: 90,      // 波紋線の最大太さ（MAX_ENERGY到達時）
        MULTI_INTERVAL_MS: 350, // マルチ波紋が発生する際の時間差（ミリ秒）
        DECAY_RATE: 0.98,        // 分割された2波目以降の波紋に掛かるエネルギーの指数減衰率
        PROGRESS_SPEED: 0.002,  // 波紋が広がる基本速度（毎フレーム加算される進行度）
        MAX_RADIUS_MULTI: 1.0,  // 波紋の最大広がり半径（画面サイズの何倍まで広がるか）
        MIN_ENERGY_RATIO: 0.001, // 波紋が完全に消滅するエネルギー残量の閾値
        MID_ALPHA_MULTI: 0.85,   // 波紋のグラデーション中間点における不透明度の倍率
        COMPOSITE_OP: 'source-over' // 波紋の合成モード ('lighter'で加算発光、'source-over'等)
    }
};

export const SOUND_MATH_CONFIG = {
    SE_PITCH_STEP: 0.05,
    SE_PITCH_MAX: 2.0,
    BGM_FADE_DURATION_SWITCH: 1.5,
    BGM_FADE_DURATION_RATIO: 0.1,
    STASIS_FILTER_FREQ: 800,
    NORMAL_FILTER_FREQ: 22050,
    STASIS_TRANSITION_SEC: 0.5
};

export const VISUALIZER_MATH_CONFIG = {
    PRESETS: {
        FULL: { FFT_SIZE: 16384, TITLE_STEP_X: 3, PUZZLE_STEP_X: 4 },
        LITE: { FFT_SIZE: 4096, TITLE_STEP_X: 6, PUZZLE_STEP_X: 8 },
        NONE: { FFT_SIZE: 2048, TITLE_STEP_X: 9, PUZZLE_STEP_X: 12 }
    },
    SPIKE_AMPLITUDE: 5.0,
    AMPLITUDE_DECAY: 0.1,
    TARGET_EASING: 0.05,
    WAVE_POWER: 1.2,
    WAVE_AMP_BASE: 0.015,
    WAVE_AMP_AUDIO_MULTI: 0.02,
    WAVE_AMP_SPIKE_MULTI: 0.03,
    BLOCK_PULSE_SPEED_1: 2,
    BLOCK_PULSE_SPEED_2: 3.5,
    BLOCK_PULSE_AMP: 0.015,
    BLOCK_AUDIO_PULSE_SPEED: 15,
    BLOCK_AUDIO_PULSE_AMP: 0.08,
    BLOCK_SPIKE_BONUS_MULTI: 0.05,
    GLITCH_TIME_MULTI: 2.0,      // GLITCH発生頻度（時間乗数）
    GLITCH_THRESHOLD: 0.99,      // GLITCH発生閾値
    GLITCH_SPIKE_AMP: 3.0        // ランダムグリッチのスパイク振幅(px)
};

export const STARRYSKY_CONFIG = {
    COUNTS: {
        FULL: 300,
        LITE: 150,
        NONE: 0
    },
    SIZE_MIN: 1.5,
    SIZE_MAX: 4.0,
    SPEED_MIN: 0.1,
    SPEED_MAX: 1.5,
    ALPHA_SPEED_MIN: 0.005,
    ALPHA_SPEED_MAX: 0.01,
    COLORS: [
        '#ffffff', // 純白
        '#e0f0ff', // わずかに青白い
        '#fff0e0'  // わずかに黄色い
    ]
};

export const SHAPE_CONFIG = [
    { type: 'circle', enabled: true, weight: 40 },
    { type: 'triangle', enabled: true, weight: 10 },
    { type: 'square', enabled: true, weight: 20 },
    { type: 'rectangle', enabled: true, weight: 3 }
];

export const COLOR_CONFIG = [
    { color: '#a81c14ff', name: 'Red', enabled: true, symbolKey: 'symbol_1', symbolColor: 'rgba(255, 255, 255, 1.0)', faction: 'IGNIS' },
    { color: '#FF7B00', name: 'Orange', enabled: false, symbolKey: 'symbol_2', symbolColor: 'rgba(255, 255, 255, 1.0)', faction: 'HELIOS' },
    { color: '#FFCC00', name: 'Yellow', enabled: true, symbolKey: 'symbol_3', symbolColor: 'rgba(0, 0, 0, 1.0)', faction: 'GAIA' },
    { color: '#34C759', name: 'Green', enabled: false, symbolKey: 'symbol_4', symbolColor: 'rgba(0, 0, 0, 0.8)', faction: 'VERITY' },
    { color: '#5AC8FA', name: 'Cyan', enabled: true, symbolKey: 'symbol_5', symbolColor: 'rgba(0, 0, 0, 1.0)', faction: 'AETHER' },
    { color: '#007AFF', name: 'Blue', enabled: false, symbolKey: 'symbol_6', symbolColor: 'rgba(255, 255, 255, 0.5)', faction: 'CELESS' },
    { color: '#AF52DE', name: 'Purple', enabled: true, symbolKey: 'symbol_7', symbolColor: 'rgba(255, 255, 255, 1.0)', faction: 'GNOSIS' }
    /*
    { color: '#9b1717', name: 'Red', enabled: true },
    { color: '#FF7B00', name: 'Orange', enabled: false },
    { color: '#f4ffb4', name: 'Yellow', enabled: true },
    { color: '#2ECC71', name: 'Green', enabled: true },
    { color: '#00E5FF', name: 'Cyan', enabled: false },
    { color: '#264885', name: 'Blue', enabled: true },
    { color: '#5B2C6F', name: 'Purple', enabled: false }

    { color: '#FF3B30', name: 'Red', enabled: true, symbolKey: 'symbol_1', symbolColor: 'rgba(255, 255, 255, 0.85)' },
    { color: '#FF9500', name: 'Orange', enabled: false, symbolKey: 'symbol_2', symbolColor: 'rgba(0, 0, 0, 0.6)' },
    { color: '#FFCC00', name: 'Yellow', enabled: true, symbolKey: 'symbol_3', symbolColor: 'rgba(0, 0, 0, 0.6)' },
    { color: '#34C759', name: 'Green', enabled: true, symbolKey: 'symbol_4', symbolColor: 'rgba(0, 0, 0, 0.6)' },
    { color: '#5AC8FA', name: 'Cyan', enabled: false, symbolKey: 'symbol_5', symbolColor: 'rgba(0, 0, 0, 0.6)' },
    { color: '#007AFF', name: 'Blue', enabled: true, symbolKey: 'symbol_6', symbolColor: 'rgba(255, 255, 255, 0.85)' },
    { color: '#AF52DE', name: 'Purple', enabled: false, symbolKey: 'symbol_7', symbolColor: 'rgba(255, 255, 255, 0.85)' }

    */
];

export const THEME_COLORS = COLOR_CONFIG.reduce((acc, c) => {
    acc[c.name.toUpperCase()] = c.color;
    return acc;
}, {});

export const SIZE_MIN = 25;
export const SIZE_MAX = 70;
export const SIZE_STEP = 5;
export const SIZE_MEAN = 40;
export const SIZE_STD_DEV = 5;

export const CONNECTION_THRESHOLD = 20;
export const LASER_ANIMATION_MS = 100;

export const PHYSICS_CONFIG = {
    restitution: 0.05,     // 反発係数（完全なゼロより微かに弾く方が硬い質感が出る）
    density: 0.5,          // 密度（ガラスや石のようにどっしりとした重みを持たせる）
    friction: 0.05,        // 摩擦（表面がつるつる滑るように低く設定）
    frictionAir: 0.001,    // 空気抵抗（素早くストンと落ちるように極小化）
    frictionStatic: 0.5,   // 静止摩擦（一度止まったらピタッと安定させる）
    slop: 0.01             // 沈み込み許容値（重なりの「グニャッ」としためり込みを最小化）
};

export const LIFE_CONFIG = {
    MAX_LIFE: 3000,
    INITIAL_DECAY: 0.5, // 1フレーム(約16ms)あたりの減少量
    TAP_COST: 50,       // タップ時の即時消費量
    RESTORE_BASE: 10,   // 連鎖数×この値が回復量
    DECAY_MULTIPLIER: 1.15, // レベルが上がるごとの消費量倍率
    COLORS: {
        HIGH: '#3C9A0E', // LIFEゲージ：通常（LIFE 30％以上）は少し濃い緑 RGB(60,154,14)
        MID: THEME_COLORS.YELLOW,  // LIFEゲージ：警告（LIFE 30％未満～15%以上）
        LOW: THEME_COLORS.ORANGE,  // LIFEゲージ：危険（LIFE 15％未満）
        DAMAGE: THEME_COLORS.RED, // 消費ゲージ（タップ時の消費）
        HEAL: THEME_COLORS.GREEN    // 回復ゲージ（回復予告）
    }
};

export const FLOATING_TEXT_CONFIG = {
    COLORS: {
        damage: THEME_COLORS.ORANGE,
        heal: THEME_COLORS.GREEN,
        exp: THEME_COLORS.CYAN
    },
    LABELS: {
        damage: 'LIFE',
        exp: 'EXP',
        heal: 'HEAL'
    }
};

export const LEVEL_UP_ANIMATION = {
    color: '#ffffff',
    alphaCenter: 0.8,
    timeShrinkMs: 500,
    timeCenterMs: 1300,
    timeExpandMs: 200
};

export const LEVEL_CONFIG = {
    BASE_REQUIRE_EXP: 10,        // Lv1→2に必要な初期経験値
    EXP_CURVE_MULTIPLIER: 1.5,   // レベルアップごとの必要経験値の増加倍率
};

export function getScoreRate(level) {
    if (level === 1) return 1.5;
    if (level === 2) return 15;
    if (level === 3) return 310;
    // Lv4以降はさらに劇的にインフレ
    return 310 * Math.pow(10, level - 3) * Math.pow(1.5, level - 3);
}

export const STAGE_DATA = {
    STAGE_01: {
        bgmCandidates: ['SET_01', 'SET_02', 'SET_03', 'SET_04'],
        shapeWeights: { circle: 5, triangle: 2, square: 2, rectangle: 1 },
        shapeLimits: { triangle: 30, square: 30, rectangle: 10, circle: 0 }
    }
};

// 注意: activeColors の定義はここから削除されました。
// 代わりに GameState.activeColors として動的管理されます（StageManager.setupActiveColors()で初期化）。

// 全体で共有する状態管理オブジェクト
export const GameState = {
    currentScene: 'BOOT', // 'BOOT', 'TITLE', 'PUZZLE', 'RESULT'
    isConfigOpen: false,

    score: 0n,
    actualScore: 0n,
    displayScore: 0n,
    GEMS: [],
    activeColors: [], // StageManager.setupActiveColors() で初期化される
    isAnimating: false,
    engine: null,
    render: null,
    runner: null,
    isPuzzlePaused: false,
    isSystemPaused: false,
    gameLoopId: null,

    // ライフ・レベル管理
    life: LIFE_CONFIG.MAX_LIFE,
    maxLife: LIFE_CONFIG.MAX_LIFE,
    level: 1,
    exp: 0,
    totalExp: 0,
    nextLevelExp: 10, // LEVEL_CONFIG.BASE_REQUIRE_EXP
    displayExp: 0,
    displayLevel: 1,
    displayTotalExp: 0,
    isGameOver: false,
    isHealing: false,
    stats: {},
    // colorDestroyCounts / totalScorePerColor は StageManager.setupActiveColors() で動的に初期化される
    colorDestroyCounts: {},

    playTimeMs: 0,
    maxChain: 0,
    maxChainColor: null,
    maxScorePerTap: 0n,
    maxScoreColor: null,
    maxChainPerColor: {},
    totalScorePerColor: {},

    // デバッグ・揮発性チート機能設定 (localStorageには保存されない)
    debug: {
        bfsMultiplier: 1,
        scoreMultiplier: 1n,
        lifeDecayMultiplier: 1,
        expMultiplier: 1,
        timeScale: 1.0,
        showWireframe: false
    },

    // ゲーム状態のリセット
    reset() {
        this.isConfigOpen = false;

        this.score = 0n;
        this.actualScore = 0n;
        this.displayScore = 0n;
        this.GEMS = [];
        this.isAnimating = false;
        this.isPuzzlePaused = false;
        this.isSystemPaused = false;

        this.life = LIFE_CONFIG.MAX_LIFE;
        this.level = 1;
        this.exp = 0;
        this.totalExp = 0;
        this.nextLevelExp = LEVEL_CONFIG.BASE_REQUIRE_EXP;
        this.displayExp = 0;
        this.displayLevel = 1;
        this.displayTotalExp = 0;
        this.isGameOver = false;
        this.isHealing = false;
        this.stats = {};
        // colorDestroyCounts / totalScorePerColor は StageManager.setupActiveColors() で再初期化される
        this.colorDestroyCounts = {};

        this.playTimeMs = 0;
        this.maxChain = 0;
        this.maxChainColor = null;
        this.maxScorePerTap = 0n;
        this.maxScoreColor = null;
        this.maxChainPerColor = {};
        this.totalScorePerColor = {};

        // activeColors もリセット（StageManager.setupActiveColors()で再設定される）
        this.activeColors = [];

        this.debug = {
            bfsMultiplier: 1,
            scoreMultiplier: 1n,
            lifeDecayMultiplier: 1,
            expMultiplier: 1,
            timeScale: 1.0,
            showWireframe: false
        };
    }
};

export const AppConfig = {

    DEFAULT_SETTINGS: {
        PC: {
            EFFECT_LEVEL: 'FULL',
            VISUALIZER_MODE: 'WAVE'
        },
        MOBILE: {
            EFFECT_LEVEL: 'LITE',
            VISUALIZER_MODE: 'GLITCH'
        }
    },

    SCORE_DIGIT_LIMITS: {
        PC: { SCORE: 23, RATE: 23, POPUP_SCORE: 12, POPUP_RATE: 12 },
        MOBILE: { SCORE: 12, RATE: 9, POPUP_SCORE: 9, POPUP_RATE: 9 }
    },
    EFFECT_LEVEL: 'FULL', // 'FULL' | 'LITE' | 'NONE'
    SHOW_MATH_POPUP: true, // 詳細スコア表示（数式ポップアップ）
    DEBUG_MODE: false,
    AUDIO_ENABLED: true,
    VISUALIZER_MODE: 'WAVE', // 'WAVE' | 'BLOCK' | 'GLITCH'
    RESULT_ANIMATION: true, // リザルト演出を有効にするか
    SHIFT_DECAY_MULT: 1 // シフト減衰倍率 (x0, x1, x5)
};

export function saveConfig() {
    if (typeof window !== 'undefined') {
        const configData = {
            version: CURRENT_VERSION,
            effectLevel: AppConfig.EFFECT_LEVEL,
            visualizerMode: AppConfig.VISUALIZER_MODE,
            showMathPopup: AppConfig.SHOW_MATH_POPUP,
            audioEnabled: AppConfig.AUDIO_ENABLED,
            resultAnimation: AppConfig.RESULT_ANIMATION,
            gemStyle: GRAPHICS_CONFIG.GEM_STYLE,
            showSymbol: GRAPHICS_CONFIG.SHOW_SYMBOL,
            gemOutline: GRAPHICS_CONFIG.GEM_OUTLINE,
            shiftDecayMult: AppConfig.SHIFT_DECAY_MULT
        };
        localStorage.setItem('phaseout_config', JSON.stringify(configData));
    }
}

// 初期化処理: デバイス自動判定とlocalStorageからの復元
if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    const defaults = isMobile ? AppConfig.DEFAULT_SETTINGS.MOBILE : AppConfig.DEFAULT_SETTINGS.PC;

    // まずデフォルト値を適用
    AppConfig.EFFECT_LEVEL = defaults.EFFECT_LEVEL;
    AppConfig.VISUALIZER_MODE = defaults.VISUALIZER_MODE;

    const savedConfigStr = localStorage.getItem('phaseout_config');
    let useDefaults = true;

    if (savedConfigStr) {
        try {
            const savedConfig = JSON.parse(savedConfigStr);
            // バージョンが一致するか確認
            if (savedConfig.version === CURRENT_VERSION) {
                useDefaults = false;
                // 設定を復元
                if (['FULL', 'LITE', 'NONE'].includes(savedConfig.effectLevel)) AppConfig.EFFECT_LEVEL = savedConfig.effectLevel;
                if (['WAVE', 'BLOCK', 'GLITCH'].includes(savedConfig.visualizerMode)) AppConfig.VISUALIZER_MODE = savedConfig.visualizerMode;
                if (savedConfig.showMathPopup !== undefined) AppConfig.SHOW_MATH_POPUP = savedConfig.showMathPopup;
                if (savedConfig.audioEnabled !== undefined) AppConfig.AUDIO_ENABLED = savedConfig.audioEnabled;
                if (savedConfig.resultAnimation !== undefined) AppConfig.RESULT_ANIMATION = savedConfig.resultAnimation;
                if (['h-light', 'overlay', 'flat'].includes(savedConfig.gemStyle)) GRAPHICS_CONFIG.GEM_STYLE = savedConfig.gemStyle;
                if (savedConfig.showSymbol !== undefined) GRAPHICS_CONFIG.SHOW_SYMBOL = savedConfig.showSymbol;
                if (['FULL', 'LINE', 'NONE'].includes(savedConfig.gemOutline)) GRAPHICS_CONFIG.GEM_OUTLINE = savedConfig.gemOutline;
                if (savedConfig.shiftDecayMult !== undefined) AppConfig.SHIFT_DECAY_MULT = savedConfig.shiftDecayMult;
            } else {
                console.warn(`[Config] Version mismatch. Expected ${CURRENT_VERSION}, got ${savedConfig.version}. Resetting to defaults.`);
            }
        } catch (e) {
            console.error('[Config] Failed to parse saved config.', e);
        }
    }

    if (useDefaults) {
        // 旧バージョンのフラグメント化されたキーを削除
        const oldKeys = ['phaseout_effect_level', 'phaseout_visualizer_mode', 'phaseout_show_math_popup', 'phaseout_audio_enabled', 'phaseout_result_animation', 'phaseout_show_symbol', 'phaseout_gem_style', 'phaseout_gem_outline'];
        oldKeys.forEach(key => localStorage.removeItem(key));

        // 初回起動やバージョン違い時はデフォルトを保存
        saveConfig();
    }
}
