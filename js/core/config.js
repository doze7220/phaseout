// config.js
import { changelog } from '../../changelog.js';

const CURRENT_VERSION = changelog[0].version;
import { GRAPHICS_CONFIG } from './effectConfig.js';

export const CORE_MATH_CONFIG = {
    EXP_BASE_EFFICIENCY: 100, // 基本経験値計算係数
    DEPTH_BONUS_DIVISOR: 10n  // 階層ボーナスの除算値 (初期設定値：1 + Depth/10)
};

export const PHASE_SHIFT_MATH = {
    GAUGE_MAX: 1000,
    GAUGE_ADD_BASE: 100,
    GAUGE_ADD_CHAIN_MULTI: 2,
    GAUGE_ADD_DEPTH_MULTI: 15,
    GAUGE_ACQUISITION_DECAY_RATE: 0.8,       // ホワイトフェイズクリア回数によるシフトエネルギー獲得量の減衰率
    BLACK_GAUGE_ACQUISITION_DECAY_RATE: 0.8, // ブラックフェイズクリア回数によるブレイクゲージ獲得量・タップ回復量の減衰率

    // ノーマルフェイズ・ブレイクゲージ用（残量ベース）
    DECAY_BASE: 0.5,             // 基本減衰量（％/sec）
    DECAY_ACCEL_COEFF: 2.0,    // 残量加速係数
    DECAY_POWER: 2.0,          // 残量加速の乗数

    // ホワイトフェイズ用（時間ベース）
    WHITE_DECAY_BASE: 20,           // 基本減衰量(/s)
    WHITE_DECAY_ACCEL_COEFF: 10,    // 時間加速係数
    WHITE_DECAY_POWER: 2,           // 時間加速の乗数（二次関数）
    WHITE_DECAY_TIME_DIVISOR: 15,   // 経過時間を割る値（t / DIVISPOR）

    // ブラックフェイズ用
    BLACK_DECAY_BASE: 100.0,             // ブラックフェイズ：基本減衰量(/s)
    BLACK_DECAY_ACCEL_COEFF: 20.0,     // ブラックフェイズ：時間加速係数
    BLACK_DECAY_POWER: 8.0,             // ブラックフェイズ：時間加速の乗数（二次関数）
    BLACK_DECAY_TIME_DIVISOR: 10.0,   // ブラックフェイズ：時間除数経過時間を割る値（t / DIVISPOR）
    BLACK_TAP_RESTORE: 20               // ブラックフェイズ：1タップあたりのブレイクゲージ回復量限値
};

export const PHYSICS_MATH_CONFIG = {
    MAX_DELTA_MS: 33,        // FPS低下時の最大Delta
    FALLBACK_DELTA_MS: 16.66 // 負の値の際のフォールバックDelta
};

export const SOUND_MATH_CONFIG = {
    SE_PITCH_STEP: 0.05,
    SE_PITCH_MAX: 2.0,
    BGM_FADE_DURATION_SWITCH: 1.5,
    BGM_FADE_DURATION_RATIO: 0.1,
    STASIS_FILTER_FREQ: 800,
    LOWPASS_FREQ: 500,
    LOWPASS_Q: 1.0,
    PITCH_MAX_MULT: 1.1,
    NORMAL_FILTER_FREQ: 22050,
    STASIS_TRANSITION_SEC: 0.5
};

export const SPAWN_CONFIG = {
    MAX_ACTIVE_GEMS: 180, // 盤面の最大宝石数 (初期配置数に合わせて)
    SPAWN_BATCH_DIVISOR: 10, // 同時補充数の分割係数（毎フレームの最大抽選回数算出用）
    SPAWN_RATE: {
        NORMAL: 1.0,
        WHITE: 1.0,
        BLACK: 0.8 // ブラックフェイズ中は枯渇に向かわせる
    },
    SPAWN_INTERVAL_FRAMES: {
        NORMAL: 5, // 通常フェイズ：例 設定5 = 5フレームに1回判定
        WHITE: 5,  // ホワイトフェイズ
        BLACK: 10  // ブラックフェイズ中
    }
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
        HEAL: THEME_COLORS.GREEN,   // 回復ゲージ（回復予告）
        BASE: '#333333',          // 通常時のゲージ下地色
        WHITE_PHASE: '#ffffff',   // ホワイトフェイズ中の発光色
        WHITE_PHASE_BASE: '#808080ff' // ホワイトフェイズ明滅時の下限色
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
    currentBgmState: 'normal',
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
    whitePhaseCount: 0,
    blackPhaseCount: 0,
    blackHoleVisualPulse: 0, // ブラックホールタップ時の一時的な視覚的膨張量
    breakGauge: 0,     // ブラックフェイズ移行のためのリバースゲージ
    currentCrackSetKey: null, // ヒビ割れ演出の現在のセットキー
    blackHoleChainCount: 0, // ブラックフェイズ中の無限チェイン数
    blackHolePooledScore: 0n,
    blackHolePooledExp: 0,
    blackHolePooledLife: 0,

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
        this.currentBgmState = 'normal';

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
        this.whitePhaseCount = 0;
        this.blackPhaseCount = 0;
        this.blackHoleVisualPulse = 0;
        this.breakGauge = 0;
        this.currentCrackSetKey = null;
        this.blackHoleChainCount = 0;
        this.blackHolePooledScore = 0n;
        this.blackHolePooledExp = 0;
        this.blackHolePooledLife = 0;

        // activeColors もリセット（StageManager.setupActiveColors()で再設定される）
        this.activeColors = [];
    }
};

export const AppConfig = {

    DEFAULT_SETTINGS: {
        PC: {
            EFFECT_LEVEL: 'FULL',
            VISUALIZER_MODE: 'OSCILLO'
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
    VISUALIZER_MODE: 'OSCILLO', // 'OSCILLO' | 'BLOCK' | 'GLITCH'
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
                if (['OSCILLO', 'BLOCK', 'GLITCH'].includes(savedConfig.visualizerMode)) AppConfig.VISUALIZER_MODE = savedConfig.visualizerMode;
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
