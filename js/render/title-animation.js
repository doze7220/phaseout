// title-animation.js
import { COLOR_CONFIG, SHAPE_CONFIG, VISUALIZER_MATH_CONFIG, AppConfig } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { ParticleManager } from '../entity/ParticleManager.js';
import { soundManager } from './SoundManager.js';

export const TITLE_RANGES = [
    { color: '#FF3B30', minHz: 20, maxHz: 60 },     // 赤（サブベース）
    { color: '#FF9500', minHz: 60, maxHz: 250 },    // 橙（キック・ベース）
    { color: '#FFCC00', minHz: 250, maxHz: 500 },   // 黄（ローミッド）
    { color: '#34C759', minHz: 500, maxHz: 2000 },  // 緑（メロディ）
    { color: '#5AC8FA', minHz: 2000, maxHz: 4000 }, // 水色（ハイミッド）
    { color: '#007AFF', minHz: 4000, maxHz: 6000 }, // 青（スネア・アタック）
    { color: '#AF52DE', minHz: 6000, maxHz: 20000 } // 紫（ハイハット・空気感）
];

let particles = [];
let gems = [];
let gemSpawnTimer = 0;
let titleParticleManager = null;
let lastAppWidth = 720;
let lastAppHeight = 1280;

export function initTitleAnimation() {
    gemSpawnTimer = 1000 + Math.random() * 4000;

    if (!titleParticleManager) {
        titleParticleManager = new ParticleManager();
    }
}

export function stopTitleAnimation() {
    particles = [];
    gems = [];
    gemSpawnTimer = 0;
    if (titleParticleManager) {
        titleParticleManager.clear();
        titleParticleManager = null;
    }
}

function spawnGem(width, height) {
    const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
    const activeColors = COLOR_CONFIG.filter(c => c.enabled);
    if (activeShapes.length === 0 || activeColors.length === 0) return;

    const radius = 15 + Math.random() * 15; // 15~30px
    const colorIdx = Math.floor(Math.random() * activeColors.length);
    const colorDef = activeColors[colorIdx];
    const shape = activeShapes[Math.floor(Math.random() * activeShapes.length)];
    const angle = Math.random() * Math.PI * 2;
    const angularVelocity = (Math.random() - 0.5) * 0.1; // 回転速度

    const x = Math.random() * width;
    const y = -50; // 画面外からスタート
    const vy = 2 + Math.random() * 2;
    // 画面高の 40% ~ 60% で破壊される
    const explodeY = height * (0.4 + Math.random() * 0.2);

    gems.push({ x, y, vy, radius, colorId: colorIdx, color: colorDef.color, shape, angle, angularVelocity, explodeY });
}

function explodeGem(gem) {
    if (titleParticleManager) {
        titleParticleManager.spawnBurstSparks(gem.x, gem.y, gem.color, 1.5, 30 + Math.random() * 20, 1.0);
        titleParticleManager.spawnParticles(gem.x, gem.y, gem.color);
    }
}

export function updateTitleAnimation(deltaTime, width, height) {
    gemSpawnTimer -= deltaTime;
    if (gemSpawnTimer <= 0) {
        spawnGem(width, height);
        // 1秒 〜 5秒 に1回の頻度
        gemSpawnTimer = 1000 + Math.random() * 4000;
    }

    // 宝石の更新
    for (let i = gems.length - 1; i >= 0; i--) {
        let g = gems[i];
        g.vy += 0.14; // 物理法則の適用: 重力はパズルの1/2（Matter.jsの1Gが約0.28px/fのため0.14）
        g.y += g.vy;
        g.angle += g.angularVelocity;
        if (g.y >= g.explodeY) {
            explodeGem(g);
            gems.splice(i, 1);
        }
    }

    // パーティクルの更新
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14; // 重力（宝石と同じくパズルの1/2）
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // 背景用パーティクル（常時上から降る）
    if (Math.random() < 0.4) {
        particles.push({
            x: Math.random() * width,
            y: -10,
            vx: (Math.random() - 0.5) * 1,
            vy: 1 + Math.random() * 3,
            size: (1 + Math.random() * 2) * (2 + Math.random() * 1.5), // 2〜3倍強のランダムサイズ
            color: 'rgba(255, 255, 255, 0.4)',
            life: 1.0,
            decay: 0.005 // ゆっくり消える
        });
    }
}

export function drawTitleAnimation(ctx, width, height) {
    if (!ctx) return;

    // === 背景オーディオビジュアライザ (グリッチ・オシロスコープ) ===
    const effectLevel = AppConfig.EFFECT_LEVEL || 'FULL';
    const preset = VISUALIZER_MATH_CONFIG.PRESETS[effectLevel] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
    const waveStepX = preset.WAVE_STEP_X;

    const processedData = soundManager ? soundManager.getProcessedVisualizerData('title', TITLE_RANGES, waveStepX, width) : new Float32Array(TITLE_RANGES.length);
    
    const numColors = TITLE_RANGES.length;
    let centerBaseY = height * LAYOUT_CONFIG.TITLE_SCENE.VISUALIZER_Y_RATIO;
    const lineSpacing = 5; // 5pxずつずらす

    const waveData = [];

    for (let i = 0; i < numColors; i++) {
        const color = TITLE_RANGES[i].color;
        const baseY = centerBaseY + (i - Math.floor(numColors / 2)) * lineSpacing;
        
        // Coarse points (coarse resolution based on waveStepX)
        const coarsePoints = [];
        const stepsPerColor = Math.floor((width / numColors) / waveStepX);
        const colorWidth = width / numColors;

        for (let x = 0; x <= width + waveStepX; x += waveStepX) {
            let bandIndex = Math.floor((x / width) * numColors);
            if (bandIndex >= numColors) bandIndex = numColors - 1;
            const isMyBand = (bandIndex === i);

            let offsetY = 0;
            if (isMyBand) {
                const localX = x - i * colorWidth;
                let s = Math.floor(localX / waveStepX);
                if (s < 0) s = 0;
                if (s > stepsPerColor) s = stepsPerColor;
                
                const dataIdx = i * (stepsPerColor + 1) + s;
                let val = processedData[dataIdx];
                const maxAmp = height * 0.15;
                const sign = (Math.floor(x / waveStepX) % 2 === 0) ? -1 : 1;
                offsetY = sign * (val * maxAmp);
            } else {
                offsetY = (Math.random() - 0.5) * 2;
            }
            coarsePoints.push({ x, y: baseY + offsetY });
        }

        // Lerp to make a smooth wave
        const points = [];
        const drawStep = 3;
        for (let x = 0; x <= width + drawStep; x += drawStep) {
            const index = x / waveStepX;
            const idx0 = Math.min(coarsePoints.length - 1, Math.floor(index));
            const idx1 = Math.min(coarsePoints.length - 1, idx0 + 1);
            const ratio = index - idx0;
            
            const p0 = coarsePoints[idx0];
            const p1 = coarsePoints[idx1];
            
            const y = p0.y * (1 - ratio) + p1.y * ratio;
            points.push({ x, y });
        }
        
        waveData.push({ color, points });
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. 太いグロウ
    ctx.lineWidth = 4;
    for (const data of waveData) {
        ctx.beginPath();
        let first = true;
        for (const pt of data.points) {
            if (first) {
                ctx.moveTo(pt.x, pt.y);
                first = false;
            } else {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = data.color;
        ctx.stroke();
    }

    // 2. 細いコアライン
    ctx.lineWidth = 1;
    for (const data of waveData) {
        ctx.beginPath();
        let first = true;
        for (const pt of data.points) {
            if (first) {
                ctx.moveTo(pt.x, pt.y);
                first = false;
            } else {
                ctx.lineTo(pt.x, pt.y);
            }
        }
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = data.color;
        ctx.stroke();
    }
    ctx.restore();

    // 宝石の描画
    for (let g of gems) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);

        const sprite = SpriteCacheManager.getGem(g.shape, g.colorId);
        if (sprite) {
            const baseRadius = 50; // initCanvasCacheで指定した基準半径
            const scale = g.radius / baseRadius;
            ctx.scale(scale, scale);
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            // フォールバック（画像がない場合の簡易描画）
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // パーティクルの描画 (背景の雪など)
    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 砕けた宝石パーティクルの描画
    if (titleParticleManager) {
        titleParticleManager.updateAndDraw(ctx);
    }
}
