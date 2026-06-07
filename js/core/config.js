// config.js

export const LAYOUT_CONFIG = {
    APP_WIDTH: 720,
    APP_HEIGHT: 1280,
    HEADER_HEIGHT: 70,
    FOOTER_HEIGHT: 120,
    INITIAL_GEM_COUNT: 200
};

export const GRAPHICS_CONFIG = {
    GEM_STYLE: 'rich' // 'rich' または 'flat'
};

export const CORE_MATH_CONFIG = {
    EXP_BASE_EFFICIENCY: 100 // 基本経験値計算時のマジックナンバー
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
    BLOCK_SPIKE_BONUS_MULTI: 0.05
};

export const SHAPE_CONFIG = [
    { type: 'circle', enabled: true, weight: 10 },
    { type: 'triangle', enabled: true, weight: 10 },
    { type: 'square', enabled: true, weight: 10 },
    { type: 'rectangle', enabled: true, weight: 3 }
];

export const COLOR_CONFIG = [
    { color: '#FF3B30', name: 'Red', enabled: true },
    { color: '#007AFF', name: 'Blue', enabled: true },
    { color: '#34C759', name: 'Green', enabled: true },
    { color: '#FFCC00', name: 'Yellow', enabled: true },
    { color: '#AF52DE', name: 'Purple', enabled: false },
    { color: '#FF9500', name: 'Orange', enabled: false },
    { color: '#5AC8FA', name: 'Cyan', enabled: false }
];

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
        MID: '#FFCC00',  // LIFEゲージ：警告（LIFE 30％未満～15%以上）
        LOW: '#FF7700',  // LIFEゲージ：危険（LIFE 15％未満）
        DAMAGE: '#ff0000', // 消費ゲージ（タップ時の消費）
        HEAL: '#34C759'    // 回復ゲージ（回復予告）
    }
};

export const FLOATING_TEXT_CONFIG = {
    COLORS: {
        damage: '#FF9500',
        heal: '#00FF00',
        exp: '#00BFFF'
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

export const activeColors = COLOR_CONFIG.filter(c => c.enabled).map(c => c.color);

// 全体で共有する状態管理オブジェクト
export const GameState = {
    score: 0n,
    actualScore: 0n,
    displayScore: 0n,
    GEMS: [],
    isAnimating: false,
    engine: null,
    render: null,
    runner: null,
    isStasis: false,
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
    colorDestroyCounts: activeColors.reduce((acc, color) => { acc[color] = 1; return acc; }, {}),

    playTimeMs: 0,
    maxChain: 0,
    maxScorePerTap: 0n,
    maxChainPerColor: {},

    // ゲーム状態のリセット
    reset() {
        this.score = 0n;
        this.actualScore = 0n;
        this.displayScore = 0n;
        this.GEMS = [];
        this.isAnimating = false;
        this.isStasis = false;

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
        this.colorDestroyCounts = activeColors.reduce((acc, color) => { acc[color] = 1; return acc; }, {});

        this.playTimeMs = 0;
        this.maxChain = 0;
        this.maxScorePerTap = 0n;
        this.maxChainPerColor = {};
    }
};

export const AppConfig = {

    SCORE_DIGIT_LIMITS: {
        PC: { SCORE: 23, RATE: 23, POPUP_SCORE: 12, POPUP_RATE: 12 },
        MOBILE: { SCORE: 12, RATE: 9, POPUP_SCORE: 9, POPUP_RATE: 9 }
    },
    EFFECT_LEVEL: 'FULL', // 'FULL' | 'LITE' | 'NONE'
    DEBUG_MODE: false
};

// 初期化処理: デバイス自動判定とlocalStorageからの復元
if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    AppConfig.EFFECT_LEVEL = isMobile ? 'LITE' : 'FULL';

    const savedEffect = localStorage.getItem('phaseout_effect_level');
    if (savedEffect && ['FULL', 'LITE', 'NONE'].includes(savedEffect)) {
        AppConfig.EFFECT_LEVEL = savedEffect;
    }
}
