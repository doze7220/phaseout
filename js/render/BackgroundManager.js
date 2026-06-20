// BackgroundManager.js

import { PHASE_WHITE_ENTER, PHASE_WHITE, PHASE_WHITE_EXIT } from '../core/PhaseManager.js';
import { AppConfig, STARRYSKY_CONFIG } from '../core/config.js';

class BackgroundManagerImpl {
    constructor() {
        this.stars = [];
        this.clear();
    }

    clear() {
        this.stars = [];
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
}

export const BackgroundManager = new BackgroundManagerImpl();
