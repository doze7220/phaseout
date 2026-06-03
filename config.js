// config.js
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

export const SIZE_MIN = 10;
export const SIZE_MAX = 60;
export const SIZE_STEP = 5;
export const SIZE_MEAN = 25;
export const SIZE_STD_DEV = 5;

export const CONNECTION_THRESHOLD = 20;
export const LASER_ANIMATION_MS = 100;

export const LIFE_CONFIG = {
    MAX_LIFE: 1000,
    INITIAL_DECAY: 0.5, // 1フレーム(約16ms)あたりの減少量
    TAP_COST: 50,       // タップ時の即時消費量
    RESTORE_BASE: 10,   // 連鎖数×この値が回復量
    SCORE_PER_LEVEL: 10000, // 次のレベルまでのスコア目安
    DECAY_MULTIPLIER: 1.15, // レベルが上がるごとの消費量倍率
    COLORS: {
        HIGH: '#007AFF', // 50%以上
        MID: '#FFCC00',  // 20%以上
        LOW: '#FF3B30'   // 20%未満
    }
};

export const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
export const activeColors = COLOR_CONFIG.filter(c => c.enabled).map(c => c.color);

// 全体で共有する状態管理オブジェクト
export const GameState = {
    score: 0,
    GEMS: [],
    lightLines: [],
    particles: [],
    isAnimating: false,
    engine: null,
    render: null,
    runner: null,
    
    // ライフ・レベル管理
    life: LIFE_CONFIG.MAX_LIFE,
    maxLife: LIFE_CONFIG.MAX_LIFE,
    level: 1,
    isGameOver: false,
    nextLevelScore: LIFE_CONFIG.SCORE_PER_LEVEL,
    
    // ゲーム状態のリセット
    reset() {
        this.score = 0;
        this.GEMS = [];
        this.lightLines = [];
        this.particles = [];
        this.isAnimating = false;
        
        this.life = LIFE_CONFIG.MAX_LIFE;
        this.level = 1;
        this.isGameOver = false;
        this.nextLevelScore = LIFE_CONFIG.SCORE_PER_LEVEL;
    }
};
