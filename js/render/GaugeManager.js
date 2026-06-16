import { LIFE_CONFIG, AppConfig, GameState, LEVEL_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { drawHeaderUI } from './ScoreRenderer.js';
import { getScoreRate } from '../core/config.js';

export const GaugeManager = {
    vMain: LIFE_CONFIG.MAX_LIFE,
    vRed: 0,
    vGreen: 0,
    greenTarget: 0,
    pauseDecayTimer: 0,
    redTimer: 0,
    greenTimer: 0,
    isRedAnimating: false,
    isGreenAnimating: false,
    
    // UI統合のためのアニメーション状態
    damageFlashTimer: 0,
    healFlashTimer: 0,
    expFlashTimer: 0,

    init(life) {
        this.vMain = life;
        this.vRed = life;
        this.vGreen = life;
        this.pauseDecayTimer = 0;
        this.redTimer = 0;
        this.greenTimer = 0;
        this.isRedAnimating = false;
        this.isGreenAnimating = false;
        
        this.damageFlashTimer = 0;
        this.healFlashTimer = 0;
        this.expFlashTimer = 0;

        // CSSによるレイアウト制約の設定は不要になったため削除
        // SVGのパス長計算なども、描画時に行うためここでは不要
    },

    triggerDamage(actualLife) {
        this.pauseDecayTimer = 500;
        this.redTimer = 500;
        this.isRedAnimating = true;
        this.vRed = Math.max(this.vRed, this.vMain, this.vGreen);
        if (actualLife < this.vMain) {
            this.vMain = actualLife;
        }

        if (AppConfig.EFFECT_LEVEL === 'FULL') {
            this.damageFlashTimer = 150;
        }
    },

    triggerHeal(actualLife) {
        this.pauseDecayTimer = 500;
        this.greenTimer = 500;
        this.isGreenAnimating = true;
        this.vGreen = actualLife;
        this.blueStart = this.vMain;

        if (AppConfig.EFFECT_LEVEL === 'FULL') {
            this.healFlashTimer = 150;
        }
    },

    isDecayPaused() {
        return this.pauseDecayTimer > 0;
    },

    update(deltaTime, actualLife, maxLife, exp = 0, nextLevelExp = 1000, currentLifeDecayRate = 0) {
        // 1. 状態の更新
        if (this.pauseDecayTimer > 0) this.pauseDecayTimer -= deltaTime;
        if (this.damageFlashTimer > 0) this.damageFlashTimer -= deltaTime;
        if (this.healFlashTimer > 0) this.healFlashTimer -= deltaTime;
        if (this.expFlashTimer > 0) this.expFlashTimer -= deltaTime;

        if (this.redTimer > 0) {
            this.redTimer -= deltaTime;
        } else if (this.isRedAnimating) {
            this.isRedAnimating = false;
            this.vRed = this.vMain;
        }

        if (this.greenTimer > 0) {
            this.greenTimer -= deltaTime;
            const progress = 1.0 - (this.greenTimer / 500);
            this.vMain = this.blueStart + (this.vGreen - this.blueStart) * progress;
        } else if (this.isGreenAnimating) {
            this.isGreenAnimating = false;
            this.vMain = this.vGreen;
        }

        if (this.pauseDecayTimer <= 0) {
            this.vMain = actualLife;
            this.vRed = actualLife;
            this.vGreen = actualLife;
            this.isRedAnimating = false;
            this.isGreenAnimating = false;
        }

        // EXPのアニメーション更新
        if (GameState.displayTotalExp < GameState.totalExp) {
            let diff = GameState.totalExp - GameState.displayTotalExp;
            let addAmount = Math.max(diff * 0.15, 5);
            if (GameState.displayTotalExp + addAmount > GameState.totalExp) {
                addAmount = GameState.totalExp - GameState.displayTotalExp;
            }

            GameState.displayTotalExp += addAmount;
            GameState.displayExp += addAmount;

            let currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));

            while (GameState.displayExp >= currentNextLevelExp) {
                GameState.displayExp -= currentNextLevelExp;
                GameState.displayLevel++;
                currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));
                this.expFlashTimer = 200;
            }
        }
        
        // 描画用の状態を保持
        this._currentLifeDecayRate = currentLifeDecayRate;
        this._actualLife = actualLife;
        this._maxLife = maxLife;
    },

    draw(ctx) {
        // 2. 描画 (第7層: BASE_UI)
        ctx.save();
        
        // ヘッダーUI（タイマー、レート、タップコスト、スコア、RATE）の描画
        const elapsed = GameState.playTimeMs;
        const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0');
        const ss = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        let timerStr = `${mm}:${ss}:${ms}`;
        let decayStr = `- ${(this._currentLifeDecayRate || 0).toFixed(1)} /s`;
        let tapCostValue = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);

        const currentRate = getScoreRate(GameState.level);

        // 外周ゲージの画
        // Header(120)の下から Footer(120) の上までがパズル領域
        // 下部中央から左右対称に描画するヘルパー関数
        const drawSymmetricGauge = (progress, margin, thickness, color, isGlow = false) => {
            if (progress <= 0) return;
            
            const w = 720;
            const puzzleTop = LAYOUT_CONFIG.BASE.HEADER_HEIGHT;
            const puzzleBottom = LAYOUT_CONFIG.BASE.HEIGHT - LAYOUT_CONFIG.BASE.FOOTER_HEIGHT;
            
            // 描画領域の矩形
            const rectLeft = margin + thickness / 2;
            const rectRight = w - margin - thickness / 2;
            const rectBottom = puzzleBottom - margin - thickness / 2;
            const rectTop = puzzleTop + margin + thickness / 2;
            
            // 下辺の半分 + 側辺 + 上辺の半分 が片側(50%)の長さ
            const halfBottom = (rectRight - rectLeft) / 2;
            const sideHeight = rectBottom - rectTop;
            const halfTop = halfBottom;
            const totalHalfLength = halfBottom + sideHeight + halfTop;
            
            // 現在描画すべき片側の長さ
            const currentLength = totalHalfLength * progress;
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            if (isGlow) {
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 10;
            } else {
                ctx.shadowBlur = 0;
            }

            // 右側の描画
            let rLen = currentLength;
            ctx.moveTo(w / 2, rectBottom);
            if (rLen > 0) {
                const step1 = Math.min(rLen, halfBottom);
                ctx.lineTo(w / 2 + step1, rectBottom);
                rLen -= step1;
            }
            if (rLen > 0) {
                const step2 = Math.min(rLen, sideHeight);
                ctx.lineTo(rectRight, rectBottom - step2);
                rLen -= step2;
            }
            if (rLen > 0) {
                const step3 = Math.min(rLen, halfTop);
                ctx.lineTo(rectRight - step3, rectTop);
            }
            ctx.stroke();

            // 左側の描画
            ctx.beginPath();
            let lLen = currentLength;
            ctx.moveTo(w / 2, rectBottom);
            if (lLen > 0) {
                const step1 = Math.min(lLen, halfBottom);
                ctx.lineTo(w / 2 - step1, rectBottom);
                lLen -= step1;
            }
            if (lLen > 0) {
                const step2 = Math.min(lLen, sideHeight);
                ctx.lineTo(rectLeft, rectBottom - step2);
                lLen -= step2;
            }
            if (lLen > 0) {
                const step3 = Math.min(lLen, halfTop);
                ctx.lineTo(rectLeft + step3, rectTop);
            }
            ctx.stroke();
        };

        // LIFEゲージ (外側, margin 0, width 12)
        const maxLife = this._maxLife;
        const actualLife = this._actualLife;
        const mainRatio = Math.max(0, Math.min(this.vMain / maxLife, 1));
        const redRatio = Math.max(0, Math.min(this.vRed / maxLife, 1));
        const greenRatio = Math.max(0, Math.min(this.vGreen / maxLife, 1));

        drawSymmetricGauge(1.0, 0, 12, '#333333'); // 下地
        
        // ダメージ赤ゲージ
        if (this.redTimer > 0 && this.vRed > this.vMain) {
            drawSymmetricGauge(redRatio, 0, 12, LIFE_CONFIG.COLORS.DAMAGE);
        }
        
        // 回復予定緑ゲージ
        if (this.greenTimer > 0 && this.vGreen > this.vMain) {
            drawSymmetricGauge(greenRatio, 0, 12, LIFE_CONFIG.COLORS.HEAL);
        }

        // メインライフゲージ
        let lifeColor = LIFE_CONFIG.COLORS.HIGH;
        if (actualLife / maxLife < 0.15) lifeColor = LIFE_CONFIG.COLORS.LOW;
        else if (actualLife / maxLife < 0.3) lifeColor = LIFE_CONFIG.COLORS.MID;
        
        drawSymmetricGauge(mainRatio, 0, 12, lifeColor, this.damageFlashTimer > 0 || this.healFlashTimer > 0);

        // EXPゲージ (内側, margin 12, width 8)
        let currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));
        const expRatio = Math.max(0, Math.min(GameState.displayExp / currentNextLevelExp, 1));
        
        // TODO: [PRISM GAUGE RESERVE] 将来のプリズム（Pエネルギー）ゲージ描画用として温存
        /*
        drawSymmetricGauge(1.0, 12, 8, '#222222'); // EXPベース
        drawSymmetricGauge(expRatio, 12, 8, '#00aaff', this.expFlashTimer > 0); // EXP値
        */

        // レベル表示などがゲージの上に描画されるように最後に drawHeaderUI を呼ぶ
        drawHeaderUI(ctx, timerStr, decayStr, tapCostValue, GameState.displayScore, currentRate, GameState.displayLevel);

        ctx.restore();
    }
};
