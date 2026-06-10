// physics.js
import { GameState, LAYOUT_CONFIG, STAGE_DATA, activeColors, SIZE_MIN, SIZE_MAX, SIZE_STEP, SIZE_MEAN, SIZE_STD_DEV, PHYSICS_CONFIG, AppConfig, PHYSICS_MATH_CONFIG } from './config.js';
import { setupGemRenderer } from '../render/renderer.js';
import { MasterRenderer } from '../render/MasterRenderer.js';
import { setupEffectsRenderer, toggleStasisEffect, clearAll } from '../render/effects.js';
import { setupGameLogic, removeGameLogic } from './logic.js';


export function initPhysics() {
    const { Engine, Render, Runner, Bodies, Composite, Events } = window.Matter;

    // 既存のエンジンやレンダーがあればクリア（リセット用）
    if (GameState.engine) {
        if (GameState.gameLoopId) {
            cancelAnimationFrame(GameState.gameLoopId);
            GameState.gameLoopId = null;
        }
        if (GameState.render && GameState.render.frameRequestId) {
            Render.stop(GameState.render);
        }
        if (GameState.runner) {
            Runner.stop(GameState.runner);
        }
        Engine.clear(GameState.engine);
        if (GameState.render.canvas) {
            GameState.render.canvas.remove();
        }
        removeGameLogic(); // 古いイベントリスナーや更新フックを削除
    }
    
    // 状態の初期化
    GameState.reset();
    // drawHeaderUI は GaugeManager.update から呼ばれるため省略
    
    clearAll(); // エフェクト（パーティクル・レーザー）のクリア
    toggleStasisEffect(false); // エフェクト状態のリセット
    
    const engine = Engine.create({
        positionIterations: 10, // 物理演算の精度を上げて硬さを表現（デフォルト6）
        velocityIterations: 8   // 衝突計算の精度を上げてゴムっぽい挙動を減らす（デフォルト4）
    });
    engine.gravity.y = 1;

    const gameWrapper = document.getElementById('game-wrapper');
    
    const puzzleHeight = LAYOUT_CONFIG.APP_HEIGHT - LAYOUT_CONFIG.HEADER_HEIGHT - LAYOUT_CONFIG.FOOTER_HEIGHT;
    const appWidth = LAYOUT_CONFIG.APP_WIDTH;

    const render = Render.create({
        element: gameWrapper,
        engine: engine,
        options: {
            width: appWidth,
            height: puzzleHeight,
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
    // スポーン位置（y=-2000等）からこぼれないよう壁を遥か上まで伸ばす
    const wallHeight = puzzleHeight + 5000;
    const wallY = puzzleHeight / 2 - 2000;

    const ground = Bodies.rectangle(appWidth / 2, puzzleHeight, appWidth + 100, 20, wallOptions);
    const leftWall = Bodies.rectangle(0, wallY, 20, wallHeight, wallOptions);
    const rightWall = Bodies.rectangle(appWidth, wallY, 20, wallHeight, wallOptions);
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    GameState.engine = engine;
    GameState.render = render;
    GameState.runner = runner;
    
    // カスタムレンダラー（宝石スタンプ描画）の初期化
    // MasterRendererの初期化とレイヤー構築
    MasterRenderer.init(Events, render);
    setupGemRenderer(GameState);
    setupEffectsRenderer();

    spawnInitialGems();

    // 入力イベント・ライフ減少などのゲームロジック設定
    setupGameLogic(engine, render);

    // メインのゲームループ（ハイブリッド駆動方式）
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsTime = performance.now();
    const fpsDisplay = document.getElementById('fps-display');

    const gameLoop = (time) => {
        GameState.gameLoopId = requestAnimationFrame(gameLoop);

        let delta = time - lastTime;
        lastTime = time;
        // FPS低下時の物理破綻（トンネリング）を防ぐため、deltaの最大値を制限
        if (delta > PHYSICS_MATH_CONFIG.MAX_DELTA_MS) {
            delta = PHYSICS_MATH_CONFIG.MAX_DELTA_MS;
        } else if (delta < 0) {
            delta = PHYSICS_MATH_CONFIG.FALLBACK_DELTA_MS;
        }

        frameCount++;
        if (time - lastFpsTime >= 1000) {
            if (fpsDisplay) {
                fpsDisplay.textContent = `FPS: ${frameCount}`;
                if (frameCount < 30) fpsDisplay.style.color = '#FF3B30';
                else if (frameCount < 50) fpsDisplay.style.color = '#FFCC00';
                else fpsDisplay.style.color = '#00FF00';
            }
            frameCount = 0;
            lastFpsTime = time;
        }

        if (GameState.engine && GameState.render) {
            // コンフィグメニュー展開時などのステイシス状態では物理更新を完全にスキップ
            if (!GameState.isStasis) {
                Engine.update(GameState.engine, delta);
            }

            // ゲームオーバー後の完全停止状態（リザルト画面移行後）は、無駄な再描画をスキップしてFPSを安定させる
            if (GameState.isGameOver && GameState.isStasis) {
                return;
            }

            // 描画は常に更新
            Render.world(GameState.render, time);
        }
    };
    GameState.gameLoopId = requestAnimationFrame(gameLoop);
}

// 正規分布（Box-Muller変換）に基づく乱数生成
function generateNormalRandom(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

function pickGemShape() {
    const stage = STAGE_DATA.STAGE_01;
    const weights = stage.shapeWeights || { circle: 5, triangle: 2, square: 2, rectangle: 1 };
    const limits = stage.shapeLimits || { triangle: 30, square: 30, rectangle: 10, circle: 0 };
    
    // 現在の各形状の数をカウント
    const currentCounts = { circle: 0, triangle: 0, square: 0, rectangle: 0 };
    if (GameState.GEMS) {
        for (let i = 0; i < GameState.GEMS.length; i++) {
            const gem = GameState.GEMS[i];
            if (gem.shapeKey) {
                currentCounts[gem.shapeKey]++;
            }
        }
    }
    
    // 上限に達していない形状をウェイト分だけ配列に積む
    const availableShapes = [];
    for (const shape in weights) {
        const limit = limits[shape] || 0;
        if (limit === 0 || currentCounts[shape] < limit) {
            const w = weights[shape];
            for (let i = 0; i < w; i++) {
                availableShapes.push(shape);
            }
        }
    }
    
    // 万が一全て上限に達していればフェイルセーフとして無制限の円を返す
    if (availableShapes.length === 0) return 'circle';
    
    return availableShapes[Math.floor(Math.random() * availableShapes.length)];
}

export function createGem(x, y) {
    const { Bodies } = window.Matter;
    
    let rawSize = generateNormalRandom(SIZE_MEAN, SIZE_STD_DEV);
    let steppedSize = Math.round(rawSize / SIZE_STEP) * SIZE_STEP;
    const radius = Math.max(SIZE_MIN, Math.min(SIZE_MAX, steppedSize));

    const shape = pickGemShape();
    const colorIndex = Math.floor(Math.random() * activeColors.length);
    const colorStr = activeColors[colorIndex];

    const bodyOptions = {
        restitution: PHYSICS_CONFIG.restitution,
        friction: PHYSICS_CONFIG.friction,
        density: PHYSICS_CONFIG.density,
        frictionAir: PHYSICS_CONFIG.frictionAir || 0.001,
        frictionStatic: PHYSICS_CONFIG.frictionStatic || 0.5,
        slop: PHYSICS_CONFIG.slop || 0.01,
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
    const cols = Math.floor(LAYOUT_CONFIG.APP_WIDTH / (SIZE_MAX * 1.2)); // 大体の列数
    const count = LAYOUT_CONFIG.INITIAL_GEM_COUNT;
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 50 + col * (LAYOUT_CONFIG.APP_WIDTH / cols) + (row % 2 === 0 ? 0 : 25);
        const y = -100 - row * 50;
        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }
}
