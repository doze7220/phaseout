// ScreenEffects.js
import { formatScore } from './score.js';
import { LAYOUT_CONFIG, LIFE_CONFIG, LEVEL_UP_ANIMATION, AppConfig } from './config.js';

export class ScreenEffects {
    constructor() {
        this.GaugeManager = {
            vMain: LIFE_CONFIG.MAX_LIFE,
            vRed: 0,
            vGreen: 0,
            greenTarget: 0,
            pauseDecayTimer: 0,
            redTimer: 0,
            greenTimer: 0,
            isRedAnimating: false,
            isGreenAnimating: false,

            init(life) {
                this.vMain = life;
                this.vRed = life;
                this.vGreen = life;
                this.pauseDecayTimer = 0;
                this.redTimer = 0;
                this.greenTimer = 0;
                this.isRedAnimating = false;
                this.isGreenAnimating = false;
                
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
            },

            triggerHeal(actualLife) {
                this.pauseDecayTimer = 500;
                this.greenTimer = 500;
                this.isGreenAnimating = true;
                this.vGreen = actualLife; 
                this.blueStart = this.vMain;
            },

            isDecayPaused() {
                return this.pauseDecayTimer > 0;
            },

            update(deltaTime, actualLife, maxLife) {
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
    }

    showChainPopup(count, color) {
        const chainPopup = document.getElementById('chain-popup');
        if (!chainPopup) return;

        chainPopup.innerText = `${formatScore(count)} Chain`;
        chainPopup.style.color = '#FFFFFF';
        chainPopup.style.textShadow = `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 20px ${color}, 0 0 40px ${color}`;

        chainPopup.classList.remove('active', 'fade-out');
        void chainPopup.offsetWidth;
        chainPopup.classList.add('active');

        if (chainPopup.fadeTimeout) {
            clearTimeout(chainPopup.fadeTimeout);
            chainPopup.fadeTimeout = null;
        }
    }

    hideChainPopup() {
        const chainPopup = document.getElementById('chain-popup');
        if (chainPopup) {
            chainPopup.classList.remove('active');
            chainPopup.classList.add('fade-out');
        }
    }

    showScorePopup(points) {
        const chainPopup = document.getElementById('chain-popup');
        if (!chainPopup) return;

        chainPopup.innerHTML = `${formatScore(points, AppConfig.GAINED_SCORE_FORMAT_FULL)}<br><span style="font-size: 0.6em;">Score</span>`;
        chainPopup.style.color = '#FFFFFF';
        chainPopup.style.textShadow = `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 20px #FFD700, 0 0 40px #FFD700`;
        chainPopup.classList.remove('active', 'fade-out');
        void chainPopup.offsetWidth;
        chainPopup.classList.add('active');

        if (chainPopup.fadeTimeout) {
            clearTimeout(chainPopup.fadeTimeout);
        }
        chainPopup.fadeTimeout = setTimeout(() => {
            chainPopup.classList.remove('active');
            chainPopup.classList.add('fade-out');
        }, 1000);
    }

    triggerScreenShake() {
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;

        gameWrapper.classList.remove('shake');
        void gameWrapper.offsetWidth;
        gameWrapper.classList.add('shake');

        setTimeout(() => {
            gameWrapper.classList.remove('shake');
        }, 500);
    }

    updateLevelDisplay(level) {
        const display = document.getElementById('level-display');
        if (!display) return;

        display.innerText = `Lv. ${level}`;
        display.classList.remove('level-up-glow');
        void display.offsetWidth;
        display.classList.add('level-up-glow');
    }

    showLevelUpPopup(oldLevel, newLevel) {
        const popup = document.getElementById('level-up-popup');
        if (!popup) return;

        if (popup.animationTimeout) {
            clearTimeout(popup.animationTimeout);
        }
        if (popup.hideTimeout) {
            clearTimeout(popup.hideTimeout);
        }

        popup.innerHTML = `
            <div style="font-size: 2em; font-weight: bold; margin-bottom: 5px;">String Level Up</div>
            <div style="font-size: 3.5em; font-weight: bold;">${oldLevel} → ${newLevel}</div>
        `;
        popup.style.display = 'block';
        popup.style.color = LEVEL_UP_ANIMATION.color;
        
        popup.style.transition = 'none';
        popup.style.transform = 'translate(-50%, -50%) scale(2)';
        popup.style.opacity = '0';

        void popup.offsetWidth;

        popup.style.transition = `transform ${LEVEL_UP_ANIMATION.timeShrinkMs}ms ease-out, opacity ${LEVEL_UP_ANIMATION.timeShrinkMs}ms ease-out`;
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
        popup.style.opacity = LEVEL_UP_ANIMATION.alphaCenter.toString();

        popup.animationTimeout = setTimeout(() => {
            popup.style.transition = `transform ${LEVEL_UP_ANIMATION.timeExpandMs}ms ease-in, opacity ${LEVEL_UP_ANIMATION.timeExpandMs}ms ease-in`;
            popup.style.transform = 'translate(-50%, -50%) scale(1.5)';
            popup.style.opacity = '0';

            popup.hideTimeout = setTimeout(() => {
                popup.style.display = 'none';
            }, LEVEL_UP_ANIMATION.timeExpandMs);

        }, LEVEL_UP_ANIMATION.timeShrinkMs + LEVEL_UP_ANIMATION.timeCenterMs);
    }

    togglePinchEffect(isPinch) {
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;
        if (isPinch) gameWrapper.classList.add('pinch-mode');
        else gameWrapper.classList.remove('pinch-mode');
    }

    toggleStasisEffect(isStasis) {
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;
        if (isStasis) gameWrapper.classList.add('stasis-mode');
        else gameWrapper.classList.remove('stasis-mode');
    }
}
