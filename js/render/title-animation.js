// title-animation.js
import { COLOR_CONFIG, SHAPE_CONFIG } from '../core/config.js';

const allColors = COLOR_CONFIG.map(c => c.color);
const allShapes = SHAPE_CONFIG.map(s => s.type);

let canvas, ctx;
let particles = [];
let gems = [];
let animationId = null;
let lastTime = 0;
let gemSpawnTimer = 0;

export function initTitleAnimation() {
    canvas = document.getElementById('title-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    resize();
    window.addEventListener('resize', resize);
    
    lastTime = performance.now();
    gemSpawnTimer = 1000 + Math.random() * 4000;
    
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
    const radius = 15 + Math.random() * 15; // 15~30px
    const color = allColors[Math.floor(Math.random() * allColors.length)];
    const shape = allShapes[Math.floor(Math.random() * allShapes.length)];
    const angle = Math.random() * Math.PI * 2;
    const angularVelocity = (Math.random() - 0.5) * 0.1; // 回転速度
    
    const x = Math.random() * canvas.width;
    const y = -50; // 画面外からスタート
    const vy = 2 + Math.random() * 2;
    // 画面高の 40% ~ 60% で破壊される
    const explodeY = canvas.height * (0.4 + Math.random() * 0.2);
    
    gems.push({ x, y, vy, radius, color, shape, angle, angularVelocity, explodeY });
}

function explodeGem(gem) {
    const count = 30 + Math.random() * 20; // 破片の数
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
            x: gem.x,
            y: gem.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // 少し上方向へのバーストを強める
            size: 3 + Math.random() * 5,
            color: gem.color,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.03
        });
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
        p.vy += 0.15; // 重力
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
            size: 1 + Math.random() * 2,
            color: 'rgba(255, 255, 255, 0.4)',
            life: 1.0,
            decay: 0.005 // ゆっくり消える
        });
    }
}

function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 宝石の描画
    for (let g of gems) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);
        
        ctx.fillStyle = g.color;
        ctx.beginPath();
        
        if (g.shape === 'circle') {
            ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        } else if (g.shape === 'square') {
            const sqSize = g.radius * 2 * 0.8;
            ctx.rect(-sqSize/2, -sqSize/2, sqSize, sqSize);
        } else if (g.shape === 'rectangle') {
            const w = g.radius * 1.5;
            const h = w * 2;
            ctx.rect(-w/2, -h/2, w, h);
        } else if (g.shape === 'triangle') {
            const r = g.radius + 2;
            ctx.moveTo(0, -r);
            ctx.lineTo(r * Math.cos(Math.PI/6), r * Math.sin(Math.PI/6));
            ctx.lineTo(-r * Math.cos(Math.PI/6), r * Math.sin(Math.PI/6));
            ctx.closePath();
        } else {
            ctx.arc(0, 0, g.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // ハイライト（立体感）
        ctx.beginPath();
        ctx.arc(-g.radius * 0.3, -g.radius * 0.3, g.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        
        ctx.restore();
    }
    
    // パーティクルの描画
    for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
