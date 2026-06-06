import { formatScore } from '../core/score.js';
import { LAYOUT_CONFIG, LIFE_CONFIG, LEVEL_UP_ANIMATION, AppConfig, GameState, LEVEL_CONFIG } from '../core/config.js';
import { getCachedSprite } from './renderer.js';
import { getScoreSprite, drawTextToCanvas, createScoreCanvas } from './ScoreRenderer.js';
import { getCurrentLifeDecayRate } from '../core/logic.js';

export class ScreenEffects {
    constructor() {
        this.ripples = [];
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

                const expStrokeWidth = 4;
                const eMin = xMin + strokeWidth / 2 + expStrokeWidth / 2 + 2;
                const eMax = xMax - strokeWidth / 2 - expStrokeWidth / 2 - 2;
                const eYMin = yMin + strokeWidth / 2 + expStrokeWidth / 2 + 2;
                const eYMax = yMax - strokeWidth / 2 - expStrokeWidth / 2 - 2;
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

            update(deltaTime, actualLife, maxLife, exp = 0, nextLevelExp = 1000) {
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

                // タイマーと減少レートの更新
                if (!GameState.isGameOver) {
                    if (this.timerElement) {
                        const elapsed = GameState.playTimeMs;
                        const mm = Math.floor(elapsed / 60000).toString().padStart(2, '0');
                        const ss = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
                        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
                        drawTextToCanvas('play-timer', `${mm}:${ss}:${ms}`, 'char', -4);
                    }
                    if (this.decayElement) {
                        const rate = getCurrentLifeDecayRate();
                        drawTextToCanvas('life-decay-rate', `- ${rate.toFixed(1)} /s`, 'char-orange', -2);
                    }
                }

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
    }

    showChainPopup(count, color) {
        const chainPopup = document.getElementById('chain-popup');
        if (!chainPopup) return;

        chainPopup.innerText = `${formatScore(count)} Chain`;
        chainPopup.style.marginTop = '0px'; // 位置リセット
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

        const scoreCanvas = createScoreCanvas(points, AppConfig.GAINED_SCORE_FORMAT_FULL);

        chainPopup.innerHTML = '';

        const labelDiv = document.createElement('div');
        labelDiv.innerHTML = `<span style="font-size: 0.6em;">Score</span>`;
        labelDiv.style.position = 'absolute';
        labelDiv.style.bottom = '100%';
        labelDiv.style.width = '100%';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.marginBottom = '-20px'; // 行間をさらに詰める
        chainPopup.appendChild(labelDiv);

        if (scoreCanvas) {
            // 累計スコア表示の1.5倍サイズで表示
            scoreCanvas.style.setProperty('width', `${scoreCanvas.width * 1.5}px`, 'important');
            scoreCanvas.style.setProperty('height', `${scoreCanvas.height * 1.5}px`, 'important');
            scoreCanvas.style.display = 'block';
            scoreCanvas.style.margin = '0 auto';
            chainPopup.appendChild(scoreCanvas);
        }

        chainPopup.style.marginTop = '-11px'; // Chain表記とベースラインを合わせるためのオフセット

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

    showFloatingNumber(text, type, x, y, delay = 0) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.className = `floating-text ${type}`;

            const chars = text.split('');
            let totalWidth = 0;
            const sprites = [];
            for (const c of chars) {
                const sprite = getScoreSprite(`float-char-${type}-${c}`);
                if (sprite) {
                    sprites.push(sprite);
                    totalWidth += (sprite.advanceWidth || sprite.width);
                }
            }

            const labelSprite = getScoreSprite(`float-label-${type}`);
            const labelAdvanceWidth = labelSprite ? (labelSprite.advanceWidth || labelSprite.width) : 0;

            const numberScale = 1.125; // 36px (1.5x of original 24px) from 32px base
            const labelScale = 0.75;   // 24px (1.0x of original 24px) from 32px base

            const paddingScaleNum = 12 * numberScale;
            const paddingScaleLbl = 12 * labelScale;

            const numDispWidth = totalWidth * numberScale;
            const lblDispWidth = labelAdvanceWidth * labelScale;

            const canvasWidth = Math.max(numDispWidth + paddingScaleNum * 2, lblDispWidth + paddingScaleLbl * 2);
            const gap = 1; // 隙間1px

            // sprite.height is 54. 
            // 46 is the visual bottom of label text, 16 is visual top of number text
            const yOffset = (46 * labelScale) + gap - (16 * numberScale);
            const numDispHeight = 54 * numberScale;
            const canvasHeight = yOffset + numDispHeight;

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            if (labelSprite) {
                const lx = (canvasWidth - lblDispWidth) / 2 - paddingScaleLbl;
                ctx.drawImage(labelSprite, 0, 0, labelSprite.width, labelSprite.height, lx, 0, labelSprite.width * labelScale, labelSprite.height * labelScale);
            }

            let currentX = (canvasWidth - numDispWidth) / 2 - paddingScaleNum;
            for (const sprite of sprites) {
                const w = sprite.width * numberScale;
                const h = sprite.height * numberScale;
                ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, currentX, yOffset, w, h);
                currentX += (sprite.advanceWidth || sprite.width) * numberScale;
            }

            el.appendChild(canvas);

            let typeOffsetX = 0;
            let typeOffsetY = 0;
            if (type === 'damage') { typeOffsetX = -20; typeOffsetY = -20; }
            if (type === 'heal') { typeOffsetX = 20; typeOffsetY = 20; }
            if (type === 'exp') { typeOffsetY = 40; }

            const randomX = (Math.random() - 0.5) * 40;
            el.style.left = `calc(${x}px + ${randomX + typeOffsetX}px)`;

            // Animation margin-top shifts it upwards, so offset by canvasHeight to put tap point near bottom-center
            el.style.top = `${y - canvasHeight + typeOffsetY}px`;
            el.style.transform = `translateX(-50%)`;

            const wrapper = document.getElementById('game-wrapper');
            if (wrapper) {
                wrapper.appendChild(el);

                setTimeout(() => {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 2400); // 2.4s is animation duration
            }
        }, delay);
    }

    updateLevelDisplay(level) {
        const display = document.getElementById('level-display');
        if (display) {
            display.innerHTML = `<span class="level-prefix">Lv.</span><span class="level-number">${level}</span>`;
            display.classList.remove('level-up-glow');
            void display.offsetWidth;
            display.classList.add('level-up-glow');
        }
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

    createRipple(x, y) {
        if (AppConfig.EFFECT_LEVEL === 'NONE') return;
        this.ripples.push({
            x: x,
            y: y,
            startTime: performance.now(),
            duration: 350
        });
    }

    updateAndDraw(ctx) {
        if (this.ripples.length > 0) {
            const now = performance.now();
            const sprite = getCachedSprite('ripple');
            if (!sprite) return;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            for (let i = this.ripples.length - 1; i >= 0; i--) {
                const r = this.ripples[i];
                const elapsed = now - r.startTime;
                if (elapsed >= r.duration) {
                    this.ripples.splice(i, 1);
                    continue;
                }

                // CSS Animation keyframes equivalent:
                // 0%: scale(0), opacity(1)
                // 55%: scale(0.8), opacity(0.8)
                // 100%: scale(1), opacity(0)
                const progress = elapsed / r.duration;
                let scale, opacity;

                if (progress <= 0.55) {
                    const p = progress / 0.55;
                    scale = p * 0.8;
                    opacity = 1.0 - (p * 0.2); // 1.0 -> 0.8
                } else {
                    const p = (progress - 0.55) / 0.45;
                    scale = 0.8 + (p * 0.2); // 0.8 -> 1.0
                    opacity = 0.8 * (1.0 - p); // 0.8 -> 0
                }

                ctx.save();
                ctx.translate(r.x, r.y);
                ctx.scale(scale, scale);
                ctx.globalAlpha = Math.max(0, opacity);
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                ctx.restore();
            }
            ctx.restore();
        }
    }
}
