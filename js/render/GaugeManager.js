import { LIFE_CONFIG, AppConfig, GameState, LEVEL_CONFIG } from '../core/config.js';
import { GAUGE_ANIM_CONFIG, WHITE_PHASE_EFFECT_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { drawHeaderUI } from './ScoreRenderer.js';
import { getScoreRate } from '../core/config.js';
import { PhaseManager } from '../core/PhaseManager.js';

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
    flickerPhase: 0, // ホワイトフェイズ明滅用の積分位相

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
        this.flickerPhase = 0;

        // CSSによるレイアウト制約の設定は不要になったため削除
        // SVGのパス長計算なども、描画時に行うためここでは不要
    },

    triggerDamage(actualLife) {
        this.pauseDecayTimer = GAUGE_ANIM_CONFIG.DAMAGE_PAUSE_MS;
        this.redTimer = GAUGE_ANIM_CONFIG.DAMAGE_RED_MS;
        this.isRedAnimating = true;
        this.vRed = Math.max(this.vRed, this.vMain, this.vGreen);
        if (actualLife < this.vMain) {
            this.vMain = actualLife;
        }

        if (AppConfig.EFFECT_LEVEL === 'FULL') {
            this.damageFlashTimer = GAUGE_ANIM_CONFIG.DAMAGE_FLASH_MS;
        }
    },

    triggerHeal(actualLife) {
        this.pauseDecayTimer = GAUGE_ANIM_CONFIG.HEAL_PAUSE_MS;
        this.greenTimer = GAUGE_ANIM_CONFIG.HEAL_GREEN_MS;
        this.isGreenAnimating = true;
        this.vGreen = actualLife;
        this.blueStart = this.vMain;

        if (AppConfig.EFFECT_LEVEL === 'FULL') {
            this.healFlashTimer = GAUGE_ANIM_CONFIG.HEAL_FLASH_MS;
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
            const progress = 1.0 - (this.greenTimer / GAUGE_ANIM_CONFIG.HEAL_GREEN_MS);
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
            let addAmount = Math.max(diff * GAUGE_ANIM_CONFIG.EXP_ANIM.SPEED_MULT, GAUGE_ANIM_CONFIG.EXP_ANIM.MIN_STEP);
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
                this.expFlashTimer = GAUGE_ANIM_CONFIG.EXP_FLASH_MS;
            }
        }
        
        // 描画用の状態を保持
        this._currentLifeDecayRate = currentLifeDecayRate;
        this._actualLife = actualLife;
        this._maxLife = maxLife;

        // ホワイトフェイズゲージ明滅の位相積分（周波数変動による位相飛び防止）
        const currentPhaseName = PhaseManager.getCurrentPhaseName();
        if (currentPhaseName === 'ホワイトステイシス中' || currentPhaseName === 'ホワイト突入演出中' || currentPhaseName === 'ホワイト解除演出中') {
            const gaugeRatio = PhaseManager.getGaugeRatio();
            const threshold = GAUGE_ANIM_CONFIG.WHITE_PHASE.GLITCH_THRESHOLD;
            if (gaugeRatio <= threshold) {
                const progress = Math.max(0, 1.0 - (gaugeRatio / threshold)); 
                const speedBase = GAUGE_ANIM_CONFIG.WHITE_PHASE.FLICKER_SPEED_BASE;
                const speedMax = GAUGE_ANIM_CONFIG.WHITE_PHASE.FLICKER_SPEED_MAX;
                const currentSpeed = speedBase + (speedMax - speedBase) * progress;
                this.flickerPhase += currentSpeed * deltaTime;
            } else {
                this.flickerPhase = 0;
            }
        } else {
            this.flickerPhase = 0;
        }
    },

    draw(ctx, gameTime = 0) {
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

        drawSymmetricGauge(1.0, 0, 12, LIFE_CONFIG.COLORS.BASE); // 下地
        
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
        
        let isGlow = this.damageFlashTimer > 0 || this.healFlashTimer > 0;

        let isWhitePhaseGauge = false;
        const currentPhaseName = PhaseManager.getCurrentPhaseName();
        if (currentPhaseName === 'ホワイトステイシス中' || currentPhaseName === 'ホワイト解除演出中') {
            isWhitePhaseGauge = true;
        } else if (currentPhaseName === 'ホワイト突入演出中') {
            // 大膨張トランジション・イン完了時の白フラッシュからゲージを白化させる
            const confPhaseWhite = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE;
            const timeStasis = confPhaseWhite.STASIS_DELAY_MS;
            const timeTribal = timeStasis + confPhaseWhite.TRIBAL_TOTAL_MS;
            const timeIn = timeTribal + confPhaseWhite.TRANSITION_IN_EXPAND_MS;
            if (PhaseManager.stateTimer >= timeIn) {
                isWhitePhaseGauge = true;
            }
        }

        if (isWhitePhaseGauge) {
            if (currentPhaseName === 'ホワイト解除演出中') {
                lifeColor = LIFE_CONFIG.COLORS.WHITE_PHASE;
                isGlow = true;
            } else {
                const gaugeRatio = PhaseManager.getGaugeRatio();
                const threshold = GAUGE_ANIM_CONFIG.WHITE_PHASE.GLITCH_THRESHOLD;
                if (gaugeRatio > threshold) {
                    lifeColor = LIFE_CONFIG.COLORS.WHITE_PHASE;
                    isGlow = true;
                } else {
                    const sinVal = Math.sin(this.flickerPhase);
                    
                    // -1.0〜1.0 のサイン波を 0.0〜1.0 に正規化し、SmoothStepイージングをかける
                    let blend = (sinVal + 1.0) / 2.0;
                    blend = blend * blend * (3.0 - 2.0 * blend);
                    
                    // LIFE_CONFIGに設定された下地色と発光色を補完する
                    const baseHex = LIFE_CONFIG.COLORS.WHITE_PHASE_BASE.replace('#', '');
                    const whiteHex = LIFE_CONFIG.COLORS.WHITE_PHASE.replace('#', '');
                    
                    const c1 = {
                        r: parseInt(baseHex.substring(0, 2), 16),
                        g: parseInt(baseHex.substring(2, 4), 16),
                        b: parseInt(baseHex.substring(4, 6), 16)
                    };
                    const c2 = {
                        r: parseInt(whiteHex.substring(0, 2), 16),
                        g: parseInt(whiteHex.substring(2, 4), 16),
                        b: parseInt(whiteHex.substring(4, 6), 16)
                    };
                    
                    const r = Math.floor(c1.r + (c2.r - c1.r) * blend);
                    const g = Math.floor(c1.g + (c2.g - c1.g) * blend);
                    const b = Math.floor(c1.b + (c2.b - c1.b) * blend);
                    
                    lifeColor = `rgb(${r}, ${g}, ${b})`;
                    isGlow = blend > 0.5;
                }
            }
        }

        drawSymmetricGauge(mainRatio, 0, 12, lifeColor, isGlow);

        // EXPゲージ (内側, margin 12, width 8)
        let currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));
        const expRatio = Math.max(0, Math.min(GameState.displayExp / currentNextLevelExp, 1));
        
        // TODO: [PRISM GAUGE RESERVE] 将来のプリズム（Pエネルギー）ゲージ描画用として温存
        /*
        drawSymmetricGauge(1.0, 12, 8, '#222222'); // EXPベース
        drawSymmetricGauge(expRatio, 12, 8, '#00aaff', this.expFlashTimer > 0); // EXP値
        */

        // レベル表示などがゲージの上に描画されるように最後に drawHeaderUI を呼ぶ
        // ゲージ発光時の shadowBlur や shadowColor が後続描画（スコア等）に漏洩しないようにリセット
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        drawHeaderUI(ctx, timerStr, decayStr, tapCostValue, GameState.displayScore, currentRate, GameState.displayLevel);

        ctx.restore();
    }
};
