// title-animation.js
import { COLOR_CONFIG, SHAPE_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { ParticleManager } from '../entity/ParticleManager.js';
import { soundManager } from './SoundManager.js';

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
    let freqData = null;
    if (soundManager) {
        freqData = soundManager.getBgmFrequencyData();
    }
    
    // 赤から紫(シアン含む)の7色（低音から高音へのマッピング）
    const visualizerColors = [
        '#FF3B30', // 赤 (低音)
        '#FF9500', // 橙
        '#FFCC00', // 黄
        '#34C759', // 緑
        '#5AC8FA', // 水色 (シアン)
        '#007AFF', // 青
        '#AF52DE'  // 紫 (高音)
    ];
    
    const numColors = visualizerColors.length;
    
    const time = performance.now() / 1000;
    // ベースY座標の中心をLayoutConfigから取得
    let centerBaseY = height * LAYOUT_CONFIG.TITLE_SCENE.VISUALIZER_Y_RATIO;
    
    const lineSpacing = 5; // 5pxずつずらす
    
    const waveData = [];
    
    for (let i = 0; i < numColors; i++) {
        const color = visualizerColors[i];
        
        // 5pxずつ縦にずらす。中心が0になるように調整
        const baseY = centerBaseY + (i - Math.floor(numColors / 2)) * lineSpacing;
        
        const points = [];
        // 波の密度（小さいほど密集する）
        const stepX = 4;
        
        // 1本の弦として画面左から右へ
        for (let x = 0; x <= width + stepX; x += stepX) {
            // 現在のX座標がどの帯域(色)に属するか判定
            let bandIndex = Math.floor((x / width) * numColors);
            if (bandIndex >= numColors) bandIndex = numColors - 1;
            
            // この弦(色)が、自分の担当帯域にいるか
            const isMyBand = (bandIndex === i);
            
            let offsetY = 0;
            if (isMyBand && freqData) {
                // 全128帯域のうち、現在のX座標に対応するビンを取得
                let binIndex = Math.floor((x / width) * 128);
                if (binIndex > 127) binIndex = 127;
                
                // 0.0 ~ 1.0 に正規化
                let val = freqData[binIndex] / 255.0;
                // 波形の起伏を派手にするための補正（高音も跳ねやすく、メリハリをつける）
                val = Math.pow(val, 1.2);
                
                // 最大振幅（画面高さの約15%まで跳ね上がる派手な設定）
                const maxAmp = height * 0.15;
                
                // スペクトラム波形のように上下に激しくジグザグさせる
                const sign = (Math.floor(x / stepX) % 2 === 0) ? -1 : 1;
                
                offsetY = sign * (val * maxAmp);
            } else {
                // 他の帯域：他の色が主張しているため、自分は弦としての微振動のみ
                offsetY = (Math.random() - 0.5) * 2;
            }
            points.push({ x, y: baseY + offsetY });
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
