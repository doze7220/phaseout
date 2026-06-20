// BackgroundManager.js

import { PHASE_WHITE_ENTER, PHASE_WHITE, PHASE_WHITE_EXIT } from '../core/PhaseManager.js';
import { AppConfig, STARRYSKY_CONFIG, EFFECT_MATH_CONFIG } from '../core/config.js';

class BackgroundManagerImpl {
    constructor() {
        this.stars = [];
        this.fluctuations = [];
        this.clear();
    }

    clear() {
        this.stars = [];
        this.fluctuations = [];
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

    updateAndDraw(ctx, GameState, PhaseManager) {
        const phase = PhaseManager.getCurrentPhaseName();
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();

        // 黒背景 (宇宙空間のベース)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // フェイズ3: アステライアの静かな星空 (常に最奥)
        this.drawStarrySky(ctx, centerX, centerY, width, height);

        // フェイズ状態に応じた背景色のベース制御
        if (phase === PHASE_WHITE_ENTER || phase === PHASE_WHITE || phase === PHASE_WHITE_EXIT) {
            // ホワイトフェイズ中は背景を白で塗りつぶす（反転表現や白飛びの土台）
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
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

            // 速度と距離の更新 (遠いほど速くして奥行きを出す)
            const currentSpeed = star.speed * (1 + (star.distance / Math.max(centerX, centerY)) * 2);
            star.distance += currentSpeed;

            // 座標の計算
            const x = centerX + Math.cos(star.angle) * star.distance;
            const y = centerY + Math.sin(star.angle) * star.distance;

            // アルファ値の更新 (フェードイン)
            if (star.alpha < 1) {
                star.alpha += star.alphaSpeed;
                if (star.alpha > 1) star.alpha = 1;
            }

            // 画面外判定
            if (x < 0 || x > width || y < 0 || y > height) {
                this._initStar(star, centerX, centerY, false);
                continue;
            }

            // 星の描画
            ctx.globalAlpha = star.alpha;
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
    spawnPrismFluctuation(x, y, colorHex, addedGauge) {
        const config = EFFECT_MATH_CONFIG.PRISM_FLUCTUATION;
        const threshold = config.MULTI_THRESHOLD;
        
        let remaining = addedGauge;
        let n = 0;

        while (remaining > 0) {
            const amount = Math.min(remaining, threshold);
            remaining -= amount;

            // 指数減衰の適用
            const decayPower = Math.pow(config.DECAY_RATE, n);
            const outputEnergy = amount * decayPower;
            
            const energyRatio = Math.max(0.0, Math.min(1.0, outputEnergy / config.MAX_ENERGY));

            if (energyRatio > 0.05) {
                const delayMs = n * config.MULTI_INTERVAL_MS;
                const fluc = {
                    x, y,
                    colorHex,
                    energyRatio: energyRatio,
                    initialEnergyRatio: energyRatio,
                    progress: 0,
                    active: false
                };

                this.fluctuations.push(fluc);

                if (delayMs > 0) {
                    setTimeout(() => {
                        fluc.active = true;
                    }, delayMs);
                } else {
                    fluc.active = true;
                }
            }
            n++;
        }
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
        if (this.fluctuations.length === 0) return;

        const config = EFFECT_MATH_CONFIG.PRISM_FLUCTUATION;
        const maxRadius = Math.max(ctx.canvas.width, ctx.canvas.height) * config.MAX_RADIUS_MULTI;

        ctx.save();
        ctx.globalCompositeOperation = config.COMPOSITE_OP || 'lighter';

        for (let i = this.fluctuations.length - 1; i >= 0; i--) {
            const fluc = this.fluctuations[i];
            if (!fluc.active) continue;

            if (!GameState.isPuzzlePaused) {
                fluc.progress += config.PROGRESS_SPEED;
            }
            if (fluc.progress >= 1.0) {
                this.fluctuations.splice(i, 1);
                continue;
            }

            // 内外の進行速度差で太さを表現する物理モデル
            const outerProgress = 1 - Math.pow(1 - fluc.progress, 3);
            const innerProgress = 1 - Math.pow(1 - fluc.progress, 2);
            
            // 外側と内側の半径
            const outerRadius = maxRadius * outerProgress;
            const innerRadius = maxRadius * innerProgress;

            // 描画用の中心半径
            const radius = (outerRadius + innerRadius) / 2;

            // 太さの計算 (diffの最大値は約0.1481)
            const diff = Math.max(0, outerProgress - innerProgress);
            const thicknessRatio = Math.min(1.0, diff / 0.1481);
            
            // 発生時のエネルギー量に応じた最大太さ
            const maxThick = config.MAX_THICKNESS * (fluc.initialEnergyRatio || 1.0);
            const currentThickness = Math.max(config.MIN_THICKNESS, maxThick * thicknessRatio);

            // 透明度も後半にかけて減衰
            const alpha = (fluc.initialEnergyRatio * config.MID_ALPHA_MULTI) * (1 - fluc.progress);

            if (currentThickness <= 0 || alpha <= 0) continue;

            const rgb = this._hexToRgb(fluc.colorHex);
            const colorRgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

            ctx.lineWidth = currentThickness;
            ctx.strokeStyle = `rgba(${colorRgbStr}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(fluc.x, fluc.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export const BackgroundManager = new BackgroundManagerImpl();
