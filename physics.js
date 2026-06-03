// physics.js
import { GameState, activeShapes, activeColors, SIZE_MIN, SIZE_MAX, SIZE_STEP, SIZE_MEAN, SIZE_STD_DEV } from './config.js';
import { hookCustomRenderer } from './renderer.js';
import { setupGameLogic, removeGameLogic } from './logic.js';
import { hookEffectsRenderer } from './effects.js';

export function initPhysics() {
    const { Engine, Render, Runner, Bodies, Composite, Events } = window.Matter;

    // 既存のエンジンやレンダーがあればクリア（リセット用）
    if (GameState.engine) {
        Render.stop(GameState.render);
        Runner.stop(GameState.runner);
        Engine.clear(GameState.engine);
        if (GameState.render.canvas) {
            GameState.render.canvas.remove();
        }
        removeGameLogic(); // 古いイベントリスナーや更新フックを削除
    }
    
    // 状態の初期化
    GameState.reset();
    
    const engine = Engine.create();
    engine.gravity.y = 1;

    const gameWrapper = document.getElementById('game-wrapper');
    
    const render = Render.create({
        element: gameWrapper,
        engine: engine,
        options: {
            width: 400,
            height: 600,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1
        }
    });

    const runner = Runner.create();

    const wallOptions = {
        isStatic: true,
        render: { fillStyle: '#444' }
    };
    const ground = Bodies.rectangle(200, 610, 400, 20, wallOptions);
    const leftWall = Bodies.rectangle(-10, 300, 20, 600, wallOptions);
    const rightWall = Bodies.rectangle(410, 300, 20, 600, wallOptions);
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    GameState.engine = engine;
    GameState.render = render;
    GameState.runner = runner;
    
    // カスタムレンダラー（宝石スタンプ描画）のフック
    hookCustomRenderer(Events, render, GameState.GEMS);
    
    // エフェクト（レーザー・パーティクル）のフック
    hookEffectsRenderer(Events, render);

    spawnInitialGems();

    Render.run(render);
    Runner.run(runner, engine);
    
    // 入力イベント・ライフ減少などのゲームロジック設定
    setupGameLogic(engine, render);
}

// 正規分布（Box-Muller変換）に基づく乱数生成
function generateNormalRandom(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

export function createGem(x, y) {
    const { Bodies } = window.Matter;
    
    let rawSize = generateNormalRandom(SIZE_MEAN, SIZE_STD_DEV);
    let steppedSize = Math.round(rawSize / SIZE_STEP) * SIZE_STEP;
    const radius = Math.max(SIZE_MIN, Math.min(SIZE_MAX, steppedSize));

    const shape = activeShapes[Math.floor(Math.random() * activeShapes.length)];
    const colorIndex = Math.floor(Math.random() * activeColors.length);
    const colorStr = activeColors[colorIndex];

    const bodyOptions = {
        restitution: 0.3,
        friction: 0.05,
        density: 0.001,
        render: {
            visible: false // カスタムレンダラーで描画するためデフォルトは非表示
        }
    };

    let gem;
    switch (shape) {
        case 'circle':
            gem = Bodies.circle(x, y, radius, bodyOptions);
            break;
        case 'triangle':
            gem = Bodies.polygon(x, y, 3, radius + 2, bodyOptions);
            break;
        case 'square':
            const sqSize = radius * 2 * 0.8;
            gem = Bodies.rectangle(x, y, sqSize, sqSize, bodyOptions);
            break;
        case 'rectangle':
            const w = radius * 1.5;
            const h = w * 2;
            gem = Bodies.rectangle(x, y, w, h, bodyOptions);
            break;
        default:
            gem = Bodies.circle(x, y, radius, bodyOptions);
    }

    // カスタムプロパティを付与
    gem.colorId = colorIndex;
    gem.colorStr = colorStr;
    gem.shapeKey = shape; // renderer.js キャッシュキー用
    gem.isGem = true;
    gem.isMarkedForDeletion = false;
    gem.customRadius = radius;

    return gem;
}

export function spawnInitialGems() {
    const { Composite } = window.Matter;
    const count = 150;
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const x = 30 + col * 37 + (row % 2 === 0 ? 0 : 18);
        const y = -50 - row * 35;
        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }
}
