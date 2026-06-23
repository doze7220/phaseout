// ParticleManager.js
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
import { AppConfig, GameState } from '../core/config.js';
import { PARTICLE_CONFIG } from '../core/effectConfig.js';

export class ParticleManager {
    constructor() {
        this.particles = [];
        this.sparks = [];
    }

    spawnParticles(x, y, colorStr, countMult = 1.0) {
        if (countMult <= 0) return;
        
        const conf = PARTICLE_CONFIG;
        const baseCount = conf.BASE_COUNT + Math.floor(Math.random() * conf.RAND_COUNT);
        const count = Math.max(1, Math.floor(baseCount * countMult));
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = conf.BASE_SPEED + Math.random() * conf.RAND_SPEED;
            const size = conf.BASE_SIZE + Math.random() * conf.RAND_SIZE;
            
            // 三角形の頂点座標を生成（ランダムな歪みを持たせる）
            const v1x = -size / 2 + (Math.random() * size * 0.2);
            const v1y = size / 2 + (Math.random() * size * 0.2);
            const v2x = size / 2 - (Math.random() * size * 0.2);
            const v2y = size / 2 - (Math.random() * size * 0.2);
            const v3x = (Math.random() * size * 0.4) - (size * 0.2);
            const v3y = -size / 2 + (Math.random() * size * 0.2);

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: colorStr,
                life: 1.0,
                decay: conf.DECAY_BASE + Math.random() * conf.DECAY_RAND,
                rotation: Math.random() * Math.PI * 2,
                angularVelocity: (Math.random() - 0.5) * conf.ROTATION_SPEED_MAX,
                vertices: [
                    { x: v1x, y: v1y },
                    { x: v2x, y: v2y },
                    { x: v3x, y: v3y }
                ]
            });
        }
    }

    spawnSparks(x, y, colorStr, speedMult, count) {
        for (let j = 0; j < count; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 * speedMult;
            this.sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: (3 + Math.random() * 3) * speedMult, // This formula is approximate to the one in renderer.js
                color: colorStr,
                life: 1.0,
                decay: 0.05 + Math.random() * 0.05
            });
        }
    }

    // A specific spawn method for burst sparks to allow custom size mult
    spawnBurstSparks(x, y, colorStr, speedMult, burstCount, sizeMult) {
        for (let j = 0; j < burstCount; j++) {
            const angle = Math.random() * Math.PI * 2;
            const burstSpeed = 2 * speedMult * 2;
            this.sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * burstSpeed,
                vy: Math.sin(angle) * burstSpeed,
                size: (5 + Math.random() * 5) * sizeMult,
                color: colorStr,
                life: 1.0,
                decay: 0.05 + Math.random() * 0.05
            });
        }
    }

    updateAndDraw(ctx) {
        const isFullEffect = AppConfig.EFFECT_LEVEL === 'FULL';

        // パーティクルの更新と描画
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (!GameState.isPuzzlePaused) {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);

            if (isFullEffect) {
                // 生ポリゴン＋角度連動キラキラ反射描画
                if (!GameState.isPuzzlePaused) p.rotation += p.angularVelocity;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);

                if (Math.abs(Math.sin(p.rotation)) > 0.95) {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = '#ffffff'; // 反射光（白）
                } else {
                    ctx.fillStyle = p.color;
                }

                ctx.beginPath();
                ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
                ctx.lineTo(p.vertices[1].x, p.vertices[1].y);
                ctx.lineTo(p.vertices[2].x, p.vertices[2].y);
                ctx.fill();
            } else {
                // 軽量描画（四角形）
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            
            ctx.restore();
        }

        // 火花（sparks）の更新と軽量描画（加算合成）
        if (this.sparks.length > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            for (let i = this.sparks.length - 1; i >= 0; i--) {
                const s = this.sparks[i];
                
                if (!GameState.isPuzzlePaused) {
                    s.x += s.vx;
                    s.y += s.vy;
                    s.life -= s.decay;
                }
                
                if (s.life <= 0) {
                    this.sparks.splice(i, 1);
                    continue;
                }
                
                ctx.globalAlpha = Math.max(0, s.life);
                const sSprite = SpriteCacheManager.get(`spark-${s.color}`);
                if (sSprite) {
                    // スプライトのグラデーションを活かすため少し大きめに描画
                    const drawSize = s.size * 2.5;
                    ctx.drawImage(sSprite, s.x - drawSize / 2, s.y - drawSize / 2, drawSize, drawSize);
                } else {
                    ctx.fillStyle = s.color;
                    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
                }
            }
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
        this.sparks = [];
    }
}
