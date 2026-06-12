// physics.js
import { GameState, STAGE_DATA, activeColors, SIZE_MIN, SIZE_MAX, SIZE_STEP, SIZE_MEAN, SIZE_STD_DEV, PHYSICS_CONFIG, AppConfig, PHYSICS_MATH_CONFIG } from './config.js';
import { LAYOUT_CONFIG } from './LayoutConfig.js';
import { setupGemRenderer } from '../render/renderer.js';
import { MasterRenderer } from '../render/MasterRenderer.js';
import { setupEffectsRenderer, toggleStasisEffect, clearAll } from '../render/effects.js';
import { setupGameLogic, removeGameLogic } from './logic.js';


export function initPhysics() {
    const { Engine, Render, Runner, Bodies, Composite, Events } = window.Matter;

    // 既存のエンジンやレンダーがあればクリア（リセット用）
    if (GameState.engine) {
        if (GameState.runner) {
            Runner.stop(GameState.runner);
        }
        window.Matter.Composite.clear(GameState.engine.world);
        Engine.clear(GameState.engine);
        removeGameLogic(); // 古いイベントリスナーや更新フックを削除
    }

    // 状態の初期化
    GameState.reset();
    
    // エフェクトの初期化
    clearAll();
    toggleStasisEffect(false);

    // 物理エンジン初期化
    const engine = Engine.create({
        constraintIterations: 4,
        positionIterations: 8,
        velocityIterations: 8
    });
    engine.gravity.y = 1;

    const appWidth = 720;
    const appHeight = 1280;

    // Canvas完全移行に伴い、Matter.js標準のRenderは削除しました。
    // 描画ループはMasterRendererが担当します。

    const runner = Runner.create();

    const wallOptions = {
        isStatic: true,
        render: { fillStyle: '#444' }
    };
    
    // 動的・ボトムアップ座標での物理空間構築
    const puzzleBottom = LAYOUT_CONFIG.BASE.HEIGHT - LAYOUT_CONFIG.BASE.FOOTER_HEIGHT;

    // 床：上端 Y=puzzleBottom (中心 Y=puzzleBottom+10, 高さ 20)
    const ground = Bodies.rectangle(appWidth / 2, puzzleBottom + 10, appWidth + 100, 20, wallOptions);
    
    // 煙突構造：天井を無くし、左壁・右壁を上空 (Y=-1000) から床まで延長
    const wallHeight = puzzleBottom + 1000;
    const wallCenterY = (puzzleBottom - 1000) / 2;
    const leftWall = Bodies.rectangle(0, wallCenterY, 20, wallHeight, wallOptions);
    const rightWall = Bodies.rectangle(appWidth, wallCenterY, 20, wallHeight, wallOptions);
    
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    GameState.engine = engine;
    GameState.runner = runner;
    // GameState.render は削除されました

    spawnInitialGems();

    // 入力イベント・ライフ減少などのゲームロジック設定
    // ※ render 依存部分は削除（または null を渡すなど、logic.js 側も対応が必要）
    setupGameLogic(engine, null);
}

export function updatePhysics(delta) {
    // FPS低下時の物理破綻（トンネリング）を防ぐため、deltaの最大値を制限
    let safeDelta = delta;
    if (safeDelta > PHYSICS_MATH_CONFIG.MAX_DELTA_MS) {
        safeDelta = PHYSICS_MATH_CONFIG.MAX_DELTA_MS;
    } else if (safeDelta < 0) {
        safeDelta = PHYSICS_MATH_CONFIG.FALLBACK_DELTA_MS;
    }

    if (GameState.engine) {
        // コンフィグメニュー展開時などのステイシス状態では物理更新を完全にスキップ
        if (!GameState.isStasis) {
            // 固定タイムステップ (60FPS基準 = 16.666ms) を使って更新
            const timeStep = 1000 / 60;
            GameState.accumulator = (GameState.accumulator || 0) + safeDelta;
            
            // フリーズからの復帰時などの無限ループを防ぐため、蓄積時間の上限を5フレーム分とする
            if (GameState.accumulator > timeStep * 5) {
                GameState.accumulator = timeStep * 5;
            }

            while (GameState.accumulator >= timeStep) {
                window.Matter.Engine.update(GameState.engine, timeStep);
                GameState.accumulator -= timeStep;
            }
        }
        
        // ゲームオーバー後の完全停止状態（リザルト画面移行後）は、無駄な再描画をスキップしてFPSを安定させる
        if (GameState.isGameOver && GameState.isStasis) {
            return;
        }
    }
}

export function destroyPhysics() {
    if (GameState.engine) {
        if (GameState.runner) {
            window.Matter.Runner.stop(GameState.runner);
        }
        window.Matter.Composite.clear(GameState.engine.world);
        window.Matter.Engine.clear(GameState.engine);
        removeGameLogic();
        GameState.engine = null;
        GameState.runner = null;
    }
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
    const cols = Math.floor(LAYOUT_CONFIG.BASE.WIDTH / (SIZE_MAX * 1.2)); // 大体の列数
    const count = LAYOUT_CONFIG.BASE.INITIAL_GEM_COUNT;
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 50 + col * (LAYOUT_CONFIG.BASE.WIDTH / cols) + (row % 2 === 0 ? 0 : 25);
        const y = LAYOUT_CONFIG.BASE.HEADER_HEIGHT - 150 - Math.random() * 50; // はるか上空から降ってくるように
        const gem = createGem(x, y);
        Composite.add(GameState.engine.world, gem);
        GameState.GEMS.push(gem);
    }
}
