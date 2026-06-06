import { LAYOUT_CONFIG, LIFE_CONFIG, AppConfig, GameState, LEVEL_CONFIG } from '../core/config.js';
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
    timerElement: null,
    decayElement: null,

    init(life) {
        this.vMain = life;
        this.vRed = life;
        this.vGreen = life;
        this.pauseDecayTimer = 0;
        this.redTimer = 0;
        this.greenTimer = 0;
        this.isRedAnimating = false;
        this.isGreenAnimating = false;

        this.timerElement = document.getElementById('play-timer');
        this.decayElement = document.getElementById('life-decay-rate');

        // CSSキャッシュ対策として、JS側からインラインで表示サイズとレイアウト制約を強制
        if (this.timerElement) {
            this.timerElement.style.height = '18px';
            this.timerElement.style.width = 'auto';
            this.timerElement.style.alignSelf = 'flex-start';
        }
        if (this.decayElement) {
            this.decayElement.style.height = '14px';
            this.decayElement.style.width = 'auto';
            this.decayElement.style.alignSelf = 'flex-start';
        }

        const puzzleHeight = LAYOUT_CONFIG.APP_HEIGHT - LAYOUT_CONFIG.HEADER_HEIGHT - LAYOUT_CONFIG.FOOTER_HEIGHT;

        const svg = document.getElementById('life-gauge-svg');
        if (svg) {
            svg.setAttribute('viewBox', `0 0 ${LAYOUT_CONFIG.APP_WIDTH} ${puzzleHeight}`);
            svg.setAttribute('preserveAspectRatio', 'none');
        }

        const strokeWidth = 12;
        const xMin = strokeWidth / 2;
        const xMax = LAYOUT_CONFIG.APP_WIDTH - strokeWidth / 2;
        const yMin = strokeWidth / 2;
        const yMax = puzzleHeight - strokeWidth / 2;
        const xMid = LAYOUT_CONFIG.APP_WIDTH / 2;

        const pathL = `M ${xMid} ${yMax} L ${xMin} ${yMax} L ${xMin} ${yMin} L ${xMid} ${yMin}`;
        const pathR = `M ${xMid} ${yMax} L ${xMax} ${yMax} L ${xMax} ${yMin} L ${xMid} ${yMin}`;

        this.perimeter = (xMid - xMin) + (yMax - yMin) + (xMid - xMin);

        const types = ['base', 'damage', 'heal', 'main'];
        types.forEach(type => {
            const pathNodeL = document.getElementById(`life-gauge-${type}-L`);
            const pathNodeR = document.getElementById(`life-gauge-${type}-R`);
            if (pathNodeL && pathNodeR) {
                pathNodeL.setAttribute('d', pathL);
                pathNodeR.setAttribute('d', pathR);
                pathNodeL.style.strokeDasharray = this.perimeter;
                pathNodeR.style.strokeDasharray = this.perimeter;
                pathNodeL.style.strokeDashoffset = this.perimeter;
                pathNodeR.style.strokeDashoffset = this.perimeter;
            }
        });

        const expStrokeWidth = 8;
        const eMin = xMin + strokeWidth / 2 + expStrokeWidth / 2;
        const eMax = xMax - strokeWidth / 2 - expStrokeWidth / 2;
        const eYMin = yMin + strokeWidth / 2 + expStrokeWidth / 2;
        const eYMax = yMax - strokeWidth / 2 - expStrokeWidth / 2;
        const pathExpL = `M ${xMid} ${eYMax} L ${eMin} ${eYMax} L ${eMin} ${eYMin} L ${xMid} ${eYMin}`;
        const pathExpR = `M ${xMid} ${eYMax} L ${eMax} ${eYMax} L ${eMax} ${eYMin} L ${xMid} ${eYMin}`;

        this.expPerimeter = (xMid - eMin) + (eYMax - eYMin) + (xMid - eMin);

        const expNodeL = document.getElementById('exp-gauge-main-L');
        const expNodeR = document.getElementById('exp-gauge-main-R');
        if (expNodeL && expNodeR) {
            expNodeL.setAttribute('d', pathExpL);
            expNodeR.setAttribute('d', pathExpR);
            expNodeL.style.strokeDasharray = this.expPerimeter;
            expNodeR.style.strokeDasharray = this.expPerimeter;
            expNodeL.style.strokeDashoffset = this.expPerimeter;
            expNodeR.style.strokeDashoffset = this.expPerimeter;
        }

        this.render(life, LIFE_CONFIG.MAX_LIFE);
    },

    triggerDamage(actualLife) {
        this.pauseDecayTimer = 500;
        this.redTimer = 500;
        this.isRedAnimating = true;
        this.vRed = Math.max(this.vRed, this.vMain, this.vGreen);
        if (actualLife < this.vMain) {
            this.vMain = actualLife;
        }

        const svg = document.getElementById('life-gauge-svg');
        if (svg && AppConfig.EFFECT_LEVEL === 'FULL') {
            svg.classList.remove('damage-flash');
            void svg.offsetWidth;
            svg.classList.add('damage-flash');
            setTimeout(() => svg.classList.remove('damage-flash'), 150);
        }
    },

    triggerHeal(actualLife) {
        this.pauseDecayTimer = 500;
        this.greenTimer = 500;
        this.isGreenAnimating = true;
        this.vGreen = actualLife;
        this.blueStart = this.vMain;

        const svg = document.getElementById('life-gauge-svg');
        if (svg && AppConfig.EFFECT_LEVEL === 'FULL') {
            svg.classList.remove('heal-flash');
            void svg.offsetWidth;
            svg.classList.add('heal-flash');
            setTimeout(() => svg.classList.remove('heal-flash'), 150);
        }
    },

    isDecayPaused() {
        return this.pauseDecayTimer > 0;
    },

    update(deltaTime, actualLife, maxLife, exp = 0, nextLevelExp = 1000, currentLifeDecayRate = 0) {
        if (this.pauseDecayTimer > 0) this.pauseDecayTimer -= deltaTime;

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

        this.render(actualLife, maxLife);

        // ヘッダーUI（タイマー、レート、タップコスト、スコア、RATE）の更新
        const elapsed = GameState.playTimeMs;
        const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0');
        const ss = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        let timerStr = `${mm}:${ss}:${ms}`;
        let decayStr = `- ${currentLifeDecayRate.toFixed(1)} /s`;
        let tapCostValue = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);

        const currentRate = getScoreRate(GameState.level);
        drawHeaderUI(timerStr, decayStr, tapCostValue, GameState.displayScore, currentRate);

        // Update EXP gauge and animate displayTotalExp

        if (GameState.displayTotalExp < GameState.totalExp) {
            let diff = GameState.totalExp - GameState.displayTotalExp;
            // Add up to 10% of diff per frame, or at least 10 (or whatever makes it fast but smooth)
            // If diff is very large, it finishes in ~10 frames.
            let addAmount = Math.max(diff * 0.15, 5);
            if (GameState.displayTotalExp + addAmount > GameState.totalExp) {
                addAmount = GameState.totalExp - GameState.displayTotalExp;
            }

            GameState.displayTotalExp += addAmount;
            GameState.displayExp += addAmount;

            let currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));

            // Trigger level ups as long as displayExp is greater than requirement
            while (GameState.displayExp >= currentNextLevelExp) {
                GameState.displayExp -= currentNextLevelExp;
                GameState.displayLevel++;
                currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));

                // Level up UI effects
                const levelDisplay = document.getElementById('level-display');
                if (levelDisplay) {
                    levelDisplay.innerHTML = `<span class="level-prefix">Lv.</span><span class="level-number">${GameState.displayLevel}</span>`;
                    levelDisplay.classList.remove('level-up-glow');
                    void levelDisplay.offsetWidth;
                    levelDisplay.classList.add('level-up-glow');
                }

                const expNodeL = document.getElementById('exp-gauge-main-L');
                const expNodeR = document.getElementById('exp-gauge-main-R');
                if (expNodeL && expNodeR) {
                    expNodeL.classList.remove('flash');
                    expNodeR.classList.remove('flash');
                    void expNodeL.offsetWidth;
                    expNodeL.classList.add('flash');
                    expNodeR.classList.add('flash');
                    setTimeout(() => {
                        expNodeL.classList.remove('flash');
                        expNodeR.classList.remove('flash');
                    }, 200);
                }
            }
        }

        // Render EXP paths
        const expNodeL = document.getElementById('exp-gauge-main-L');
        const expNodeR = document.getElementById('exp-gauge-main-R');
        if (expNodeL && expNodeR) {
            // Re-calculate current requirement in case it wasn't level up
            let currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));
            const expRatio = Math.max(0, Math.min(GameState.displayExp / currentNextLevelExp, 1));
            const expOffset = this.expPerimeter * (1 - expRatio);
            expNodeL.style.strokeDashoffset = expOffset;
            expNodeR.style.strokeDashoffset = expOffset;
        }
    },

    render(actualLife, maxLife) {
        const types = ['damage', 'heal', 'main', 'base'];
        const nodes = {};
        types.forEach(t => {
            nodes[`${t}L`] = document.getElementById(`life-gauge-${t}-L`);
            nodes[`${t}R`] = document.getElementById(`life-gauge-${t}-R`);
        });

        if (!nodes.mainL) return;

        const mainRatio = Math.max(0, Math.min(this.vMain / maxLife, 1));
        const redRatio = Math.max(0, Math.min(this.vRed / maxLife, 1));
        const greenRatio = Math.max(0, Math.min(this.vGreen / maxLife, 1));

        let color = LIFE_CONFIG.COLORS.HIGH;
        if (actualLife / maxLife < 0.15) color = LIFE_CONFIG.COLORS.LOW;
        else if (actualLife / maxLife < 0.3) color = LIFE_CONFIG.COLORS.MID;

        if (nodes.baseL) {
            nodes.baseL.style.strokeDashoffset = 0;
            nodes.baseR.style.strokeDashoffset = 0;
        }

        const mainOffset = this.perimeter * (1 - mainRatio);
        nodes.mainL.style.strokeDashoffset = mainOffset;
        nodes.mainR.style.strokeDashoffset = mainOffset;
        nodes.mainL.style.stroke = color;
        nodes.mainR.style.stroke = color;

        if (nodes.damageL) {
            const redOffset = this.perimeter * (1 - redRatio);
            nodes.damageL.style.strokeDashoffset = redOffset;
            nodes.damageR.style.strokeDashoffset = redOffset;
            if (this.redTimer > 0 && this.vRed > this.vMain) {
                nodes.damageL.style.opacity = 1;
                nodes.damageR.style.opacity = 1;
            } else {
                nodes.damageL.style.opacity = 0;
                nodes.damageR.style.opacity = 0;
            }
        }

        if (nodes.healL) {
            const greenOffset = this.perimeter * (1 - greenRatio);
            nodes.healL.style.strokeDashoffset = greenOffset;
            nodes.healR.style.strokeDashoffset = greenOffset;
            if (this.greenTimer > 0 && this.vGreen > this.vMain) {
                nodes.healL.style.opacity = 1;
                nodes.healR.style.opacity = 1;
            } else {
                nodes.healL.style.opacity = 0;
                nodes.healR.style.opacity = 0;
            }
        }
    }
};
