// title-animation.js
import { COLOR_CONFIG, SHAPE_CONFIG, VISUALIZER_AUDIO_CONFIG } from '../core/config.js';
import { getCachedGemSprite } from './renderer.js';
import { ParticleManager } from '../entity/ParticleManager.js';
import { soundManager } from './SoundManager.js';

let canvas, ctx;
let particles = [];
let gems = [];
let animationId = null;
let lastTime = 0;
let gemSpawnTimer = 0;
let titleParticleManager = null;

export function initTitleAnimation() {
    canvas = document.getElementById('title-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    resize();
    window.addEventListener('resize', resize);
    
    lastTime = performance.now();
    gemSpawnTimer = 1000 + Math.random() * 4000;
    
    if (!titleParticleManager) {
        titleParticleManager = new ParticleManager();
    }
    
    if (!animationId) {
        loop(performance.now());
    }
}

export function stopTitleAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    window.removeEventListener('resize', resize);
    
    // クリア
    particles = [];
    gems = [];
    if (titleParticleManager) {
        titleParticleManager.clear();
        titleParticleManager = null;
    }
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function resize() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function spawnGem() {
    const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
    const activeColors = COLOR_CONFIG.filter(c => c.enabled);
    if (activeShapes.length === 0 || activeColors.length === 0) return;

    const radius = 15 + Math.random() * 15; // 15~30px
    const colorIdx = Math.floor(Math.random() * activeColors.length);
    const colorDef = activeColors[colorIdx];
    const shape = activeShapes[Math.floor(Math.random() * activeShapes.length)];
    const angle = Math.random() * Math.PI * 2;
    const angularVelocity = (Math.random() - 0.5) * 0.1; // 回転速度
    
    const x = Math.random() * canvas.width;
    const y = -50; // 画面外からスタート
    const vy = 2 + Math.random() * 2;
    // 画面高の 40% ~ 60% で破壊される
    const explodeY = canvas.height * (0.4 + Math.random() * 0.2);
    
    gems.push({ x, y, vy, radius, colorId: colorIdx, color: colorDef.color, shape, angle, angularVelocity, explodeY });
}

function explodeGem(gem) {
    if (titleParticleManager) {
        titleParticleManager.spawnBurstSparks(gem.x, gem.y, gem.color, 1.5, 30 + Math.random() * 20, 1.0);
        titleParticleManager.spawnParticles(gem.x, gem.y, gem.color);
    }
}

function update(deltaTime) {
    gemSpawnTimer -= deltaTime;
    if (gemSpawnTimer <= 0) {
        spawnGem();
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
            x: Math.random() * canvas.width,
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

function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // === 背景オーディオビジュアライザ (グリッチ・オシロスコープ) ===
    let freqData = null;
    if (soundManager) {
        freqData = soundManager.getBgmFrequencyData();
    }
    
    // config.js に定義した TITLE_RANGES を参照
    const titleRanges = VISUALIZER_AUDIO_CONFIG.TITLE_RANGES;
    const numColors = titleRanges.length;
    
    const time = performance.now() / 1000;
    const timeInt = Math.floor(time * 5);
    
    // 7本のベースY座標の中心（デフォルトは45%の位置）
    let centerBaseY = canvas.height * 0.45;
    
    // DOMからタイトルのh1要素を取得し、その中央のY座標を算出する
    const h1Element = document.querySelector('#scene-title h1');
    if (h1Element && canvas) {
        const h1Rect = h1Element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        // Canvas内でのh1の相対的な縦中心位置を計算
        centerBaseY = (h1Rect.top + h1Rect.height / 2) - canvasRect.top;
    }
    
    const lineSpacing = 5; // 5pxずつずらす
    
    // 帯域ごとの平均音量
    const waveData = [];
    
    const sampleRate = soundManager.context ? soundManager.context.sampleRate : 44100;
    const getBinIndex = (hz) => Math.min(255, Math.max(0, Math.floor((hz * 512) / sampleRate)));
    
    for (let i = 0; i < numColors; i++) {
        const colorDef = titleRanges[i];
        const color = colorDef.color;
        
        // 5pxずつ縦にずらす。中心が0になるように調整
        const baseY = centerBaseY + (i - Math.floor(numColors / 2)) * lineSpacing;
        
        const points = [];
        // 波の密度（小さいほど密集する）
        const stepX = 4;
        
        const startBin = getBinIndex(colorDef.minHz);
        const endBin = getBinIndex(colorDef.maxHz);
        const binRange = Math.max(1, endBin - startBin);
        
        // 1本の弦として画面左から右へ
        for (let x = 0; x <= canvas.width + stepX; x += stepX) {
            // 現在のX座標がどの帯域(色)に属するか判定
            let bandIndex = Math.floor((x / canvas.width) * numColors);
            if (bandIndex >= numColors) bandIndex = numColors - 1;
            
            // この弦(色)が、自分の担当帯域にいるか
            const isMyBand = (bandIndex === i);
            
            let offsetY = 0;
            if (isMyBand && freqData) {
                // 担当する周波数範囲内のビンインデックスをX座標の割合に基づいて補間
                const xRatio = (x % (canvas.width / numColors)) / (canvas.width / numColors);
                const localBinIndex = Math.floor(xRatio * binRange);
                const binIndex = startBin + Math.min(binRange, localBinIndex);
                
                // 0.0 ~ 1.0 に正規化
                let val = freqData[binIndex] / 255.0;
                // 波形の起伏を派手にするための補正（高音も跳ねやすく、メリハリをつける）
                val = Math.pow(val, 1.2);
                
                // 最大振幅（画面高さの約15%まで跳ね上がる派手な設定）
                const maxAmp = canvas.height * 0.15;
                
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
        
        const sprite = getCachedGemSprite(g.shape, g.colorId);
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

function loop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // deltaTimeの異常な跳ね上がりを防ぐ
    update(Math.min(deltaTime, 50));
    draw();
    
    animationId = requestAnimationFrame(loop);
}
