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

export const SHAPE_CONFIG = [
    { type: 'circle', enabled: true },
    { type: 'triangle', enabled: true },
    { type: 'square', enabled: true },
    { type: 'rectangle', enabled: true }
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
    MAX_LIFE: 5000,
    INITIAL_DECAY: 0.5, // 1フレーム(約16ms)あたりの減少量
    TAP_COST: 50,       // タップ時の即時消費量
    RESTORE_BASE: 10,   // 連鎖数×この値が回復量
    DECAY_MULTIPLIER: 1.15, // レベルが上がるごとの消費量倍率
    COLORS: {
        HIGH: '#007AFF', // LIFEゲージ：通常（LIFE 30％以上）
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

export const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
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

    playStartTime: 0,
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

        this.playStartTime = 0;
        this.maxChain = 0;
        this.maxScorePerTap = 0n;
        this.maxChainPerColor = {};
    }
};

export const AppConfig = {
    TOTAL_SCORE_FORMAT_FULL: true,
    GAINED_SCORE_FORMAT_FULL: true,
    SCORE_MAX_DISPLAY_DIGITS: 21,
    VISUALIZER_MODE: 'WAVE', // 'WAVE' | 'BLOCK' | 'OFF'
    DEBUG_MODE: false
};
