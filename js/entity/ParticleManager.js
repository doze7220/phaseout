// ParticleManager.js
import { getCachedSprite } from '../render/renderer.js';

export class ParticleManager {
    constructor() {
        this.particles = [];
        this.sparks = [];
    }

    spawnParticles(x, y, colorStr, countMult = 1.0) {
        if (countMult <= 0) return;
        const baseCount = 5 + Math.floor(Math.random() * 5); // 1個につき5〜9個のパーティクル
        const count = Math.max(1, Math.floor(baseCount * countMult));
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 4,
                color: colorStr,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03
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
        // パーティクルの更新と描画
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            const pSprite = getCachedSprite(`particle-${p.color}`);
            if (pSprite) {
                ctx.drawImage(pSprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            } else {
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
                
                s.x += s.vx;
                s.y += s.vy;
                s.life -= s.decay;
                
                if (s.life <= 0) {
                    this.sparks.splice(i, 1);
                    continue;
                }
                
                ctx.globalAlpha = Math.max(0, s.life);
                const sSprite = getCachedSprite(`spark-${s.color}`);
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
