// BackgroundManager.js

import { PhaseManager, PHASE_NORMAL, PHASE_WHITE_ENTER, PHASE_WHITE, PHASE_WHITE_EXIT } from '../core/PhaseManager.js';
import { AppConfig, STARRYSKY_CONFIG, GameState } from '../core/config.js';
import { WHITE_PHASE_EFFECT_CONFIG, PRISM_FLUCTUATION_CONFIG } from '../core/effectConfig.js';

class BackgroundManagerImpl {
    constructor() {
        this.stars = [];
        this.rippleEmitters = [];
        this.rippleParticles = [];
        this.clear();
    }

    clear() {
        this.stars = [];
        this.rippleEmitters = [];
        this.rippleParticles = [];
    }

    _initStar(star, centerX, centerY, isInitial = false) {
        star.angle = Math.random() * Math.PI * 2;
        star.speed = STARRYSKY_CONFIG.SPEED_MIN + Math.random() * (STARRYSKY_CONFIG.SPEED_MAX - STARRYSKY_CONFIG.SPEED_MIN);
        
        // 初回発生時は画面全体に散らすため距離を大きくランダム化
        // リセット時は中心付近から再出発させる
        const maxDist = Math.max(centerX, centerY) * 1.5;
        star.distance = isInitial ? Math.random() * maxDist : Math.random() * 20;

        star.size = STARRYSKY_CONFIG.SIZE_MIN + Math.random() * (STARRYSKY_CONFIG.SIZE_MAX - STARRYSKY_CONFIG.SIZE_MIN);
        star.alpha = 0;
        star.alphaSpeed = STARRYSKY_CONFIG.ALPHA_SPEED_MIN + Math.random() * (STARRYSKY_CONFIG.ALPHA_SPEED_MAX - STARRYSKY_CONFIG.ALPHA_SPEED_MIN);
        star.color = STARRYSKY_CONFIG.COLORS[Math.floor(Math.random() * STARRYSKY_CONFIG.COLORS.length)];
        return star;
    }

    update(realDelta, gameDelta) {
        if (!GameState.isPuzzlePaused) {
            const phase = PhaseManager.getCurrentPhaseName();
            const config = PRISM_FLUCTUATION_CONFIG;
            // 波紋エミッター更新
            for (let i = this.rippleEmitters.length - 1; i >= 0; i--) {
                const emitter = this.rippleEmitters[i];
                emitter.timer -= gameDelta;
                if (emitter.timer <= 0) {
                    const energyRatio = emitter.currentEnergy / config.MAX_ENERGY;
                    this.rippleParticles.push({
                        x: emitter.x, y: emitter.y, colorHex: emitter.colorHex,
                        energyRatio: energyRatio, initialEnergyRatio: energyRatio, progress: 0
                    });
                    emitter.timer = config.MULTI_INTERVAL_MS;
                    emitter.currentEnergy *= config.DECAY_RATE;
                    if (emitter.currentEnergy / config.MAX_ENERGY <= config.MIN_ENERGY_RATIO) {
                        this.rippleEmitters.splice(i, 1);
                    }
                }
            }
            // 波紋パーティクル更新
            for (let i = this.rippleParticles.length - 1; i >= 0; i--) {
                const p = this.rippleParticles[i];
                p.progress += config.PROGRESS_SPEED * (gameDelta / 16.66);
                if (p.progress >= 1.0) {
                    this.rippleParticles.splice(i, 1);
                }
            }
            // 星の更新
            const centerX = 360; // 720/2
            const centerY = 640; // 1280/2
            for (let i = 0; i < this.stars.length; i++) {
                const star = this.stars[i];
                const currentSpeed = star.speed * (1 + (star.distance / Math.max(centerX, centerY)) * 2);
                star.distance += currentSpeed * (gameDelta / 16.66);
                if (star.alpha < 1) {
                    star.alpha += star.alphaSpeed * (gameDelta / 16.66);
                    if (star.alpha > 1) star.alpha = 1;
                }
                const x = centerX + Math.cos(star.angle) * star.distance;
                const y = centerY + Math.sin(star.angle) * star.distance;
                if (x < 0 || x > 720 || y < 0 || y > 1280) {
                    this._initStar(star, centerX, centerY, false);
                }
            }
        }
    }

    draw(ctx, GameState, PhaseManager) {
        const phase = PhaseManager.getCurrentPhaseName();
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();

        // フェイズ3: アステライアの静かな星空 (常に最奥)
        this.drawStarrySky(ctx, centerX, centerY, width, height);

        // フェイズ状態に応じた背景色のベース制御
        if (phase === PHASE_WHITE_ENTER || phase === PHASE_WHITE || phase === PHASE_WHITE_EXIT) {
            ctx.fillStyle = '#ffffff';
            if (GameState.isWhiteExitWipeOut) {
                const conf = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE_EXIT;
                const wipeStartTime = conf.STASIS_DELAY_MS + conf.TRIBAL_TOTAL_MS;
                const p = Math.max(0, (PhaseManager.stateTimer - wipeStartTime) / conf.TRANSITION_OUT_WIPE_MS);
                const expP = 1.0 - Math.pow(1.0 - p, 3);
                const maxR = 1200;
                const currentR = maxR * expP;

                ctx.beginPath();
                ctx.rect(-50, -50, width + 100, height + 100);
                ctx.arc(centerX, centerY, Math.max(0, currentR), 0, Math.PI * 2, true);
                ctx.fill();
            } else {
                ctx.fillRect(-50, -50, width + 100, height + 100);
            }
        } else if (phase === PHASE_NORMAL) {
            // 通常パズル時のフェイズシフト予兆の背景白化 (Whiteout Pressure)
            const gaugeRatio = PhaseManager.getGaugeRatio();
            if (gaugeRatio > 0.5) {
                const whiteAlpha = Math.max(0, (gaugeRatio - 0.5) * 2);
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
                // 画面シェイクによるオフセット考慮
                ctx.fillRect(-50, -50, width + 100, height + 100);
                ctx.restore();
            }
        }

        // フェイズ4: 物理的な波紋 (PrismFluctuation)
        this.drawPrismFluctuations(ctx, GameState, PhaseManager);

        // 将来の演出用スタブ呼び出し
        this.drawOmenRipple(ctx, GameState, PhaseManager);
        this.drawReverseRipple(ctx, GameState, PhaseManager);

        ctx.restore();
    }

    // フェイズ3: 星空描画
    drawStarrySky(ctx, centerX, centerY, width, height) {
        const targetCount = STARRYSKY_CONFIG.COUNTS[AppConfig.EFFECT_LEVEL] || 0;

        // 星の数を維持する (足りない場合は追加)
        while (this.stars.length < targetCount) {
            this.stars.push(this._initStar({}, centerX, centerY, true));
        }
        // 多すぎる場合は切り捨てる
        if (this.stars.length > targetCount) {
            this.stars.length = targetCount;
        }

        if (targetCount === 0) return;

        ctx.save();
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            const x = centerX + Math.cos(star.angle) * star.distance;
            const y = centerY + Math.sin(star.angle) * star.distance;

            // 星の描画
            ctx.globalAlpha = Math.max(0, Math.min(1, star.alpha));
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // フェイズ4: 予兆波紋描画スタブ
    drawOmenRipple(ctx, GameState, PhaseManager) {
        // TODO: たゆたう同心円と純白への脱色（予兆）を描画
    }

    // フェイズ5: 逆波紋アニメーションスタブ
    drawReverseRipple(ctx, GameState, PhaseManager) {
        // TODO: 外側から内側に巻き戻る逆波紋のループアニメーションを描画
    }

    // --- 新規: 物理的な波紋 (Prism Fluctuation) ---
    clearPrismFluctuation() {
        this.rippleEmitters = [];
        this.rippleParticles = [];
    }

    spawnPrismFluctuation(x, y, colorHex, addedGauge) {
        const config = PRISM_FLUCTUATION_CONFIG;
        
        // 追加されたゲージを初期エネルギーとする（MAX_ENERGYでキャップ）
        const initialEnergy = Math.min(addedGauge, config.MAX_ENERGY);

        if (initialEnergy <= 0) return;

        const emitter = {
            x, y, colorHex,
            currentEnergy: initialEnergy,
            timer: 0 // 初回は即座に発生させるため0
        };

        this.rippleEmitters.push(emitter);
    }

    _hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length >= 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return {r, g, b};
    }

    _lerpColor(hexStr, targetR, targetG, targetB, ratio) {
        const rgb = this._hexToRgb(hexStr);
        const r = Math.floor(rgb.r + (targetR - rgb.r) * ratio);
        const g = Math.floor(rgb.g + (targetG - rgb.g) * ratio);
        const b = Math.floor(rgb.b + (targetB - rgb.b) * ratio);
        return `${r}, ${g}, ${b}`;
    }

    drawPrismFluctuations(ctx, GameState, PhaseManager) {
        const config = PRISM_FLUCTUATION_CONFIG;
        
        if (this.rippleParticles.length === 0) return;

        const maxRadius = Math.max(ctx.canvas.width, ctx.canvas.height) * config.MAX_RADIUS_MULTI;

        ctx.save();
        ctx.globalCompositeOperation = config.COMPOSITE_OP || 'lighter';

        // --- パーティクルの描画処理 ---
        for (let i = this.rippleParticles.length - 1; i >= 0; i--) {
            const p = this.rippleParticles[i];

            // 内外の進行速度差で太さを表現する物理モデル
            const outerProgress = 1 - Math.pow(1 - p.progress, 3);
            const innerProgress = 1 - Math.pow(1 - p.progress, 2);
            
            const outerRadius = maxRadius * outerProgress;
            const innerRadius = maxRadius * innerProgress;

            const radius = (outerRadius + innerRadius) / 2;

            const diff = Math.max(0, outerProgress - innerProgress);
            const thicknessRatio = Math.min(1.0, diff / 0.1481);
            
            const maxThick = config.MAX_THICKNESS * p.initialEnergyRatio;
            const currentThickness = Math.max(config.MIN_THICKNESS, maxThick * thicknessRatio);

            const alpha = (p.initialEnergyRatio * config.MID_ALPHA_MULTI) * (1 - p.progress);

            if (currentThickness <= 0 || alpha <= 0) continue;

            const rgb = this._hexToRgb(p.colorHex);
            let r = rgb.r, g = rgb.g, b = rgb.b;
            
            // シフトゲージ残量が50%を超えたら、その超過分に応じて白(255, 255, 255)へ近づける
            const gaugeRatio = PhaseManager.getGaugeRatio();
            if (gaugeRatio > 0.5) {
                const whiteLerp = (gaugeRatio - 0.5) * 2; // 0.5~1.0 を 0.0~1.0 に正規化
                r = Math.floor(r + (255 - r) * whiteLerp);
                g = Math.floor(g + (255 - g) * whiteLerp);
                b = Math.floor(b + (255 - b) * whiteLerp);
            }
            const colorRgbStr = `${r}, ${g}, ${b}`;

            ctx.lineWidth = currentThickness;
            ctx.strokeStyle = `rgba(${colorRgbStr}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export const BackgroundManager = new BackgroundManagerImpl();
