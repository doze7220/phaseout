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
    
    // ゲーム状態のリセット
    reset() {
        this.score = 0;
        this.GEMS = [];
        this.lightLines = [];
        this.particles = [];
        this.isAnimating = false;
    }
};
