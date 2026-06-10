import { generateScoreData, renderScoreToHtml } from '../core/score.js';
import { AppConfig, EFFECT_MATH_CONFIG } from '../core/config.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { getScoreSprite, createScoreCanvas } from './ScoreRenderer.js';

export class ScreenEffects {
    constructor() {
        this.ripples = [];
    }

    showChainPopup(count, color) {
        const chainPopup = document.getElementById('chain-popup');
        if (!chainPopup) return;

        chainPopup.innerHTML = `${count} Chain`;
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

        const scoreCanvas = createScoreCanvas(points);

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

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        const wrapper = document.getElementById('game-wrapper');
        if (!wrapper) return;

        // すでにあるポップアップを削除
        const existing = document.getElementById('level-up-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'level-up-popup';
        popup.className = 'level-up-popup';

        const isMobile = window.innerWidth <= 600;
        const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_RATE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_RATE;

        const r1Str = oldRate >= 10000 ? renderScoreToHtml(generateScoreData(BigInt(Math.floor(oldRate)), maxDigits)) : (oldRate % 1 === 0 ? oldRate : oldRate.toFixed(1));
        const r2Str = newRate >= 10000 ? renderScoreToHtml(generateScoreData(BigInt(Math.floor(newRate)), maxDigits)) : (newRate % 1 === 0 ? newRate : newRate.toFixed(1));

        popup.innerHTML = `
            <div class="level-up-bg"></div>
            <div class="level-up-content">
                <div class="level-up-title glitch-anim" data-text="STIRRING LEVEL UP">STIRRING LEVEL UP</div>
                <div class="level-up-levels">Lv.${oldLevel} <span class="arrow">>>></span> Lv.${newLevel}</div>
                <div class="level-up-stats">
                    <div class="stat-row">
                        <span class="stat-label">RATE</span>
                        <span class="stat-val old-val">${r1Str}x</span>
                        <span class="stat-arrow">>>></span>
                        <span class="stat-val new-val">${r2Str}x</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">COST</span>
                        <span class="stat-val old-val">-${Math.floor(oldCost)}</span>
                        <span class="stat-arrow">>>></span>
                        <span class="stat-val new-val">-${Math.floor(newCost)}</span>
                    </div>
                </div>
            </div>
        `;

        wrapper.appendChild(popup);

        // 2秒後にフェードアウトして削除
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => {
                if (popup.parentNode) popup.parentNode.removeChild(popup);
            }, 500); // フェードアウトアニメーション待ち
        }, 2000);
    }

    triggerScreenShake() {
        const gameWrapper = document.getElementById('game-wrapper');
        if (!gameWrapper) return;

        gameWrapper.classList.remove('shake');
        void gameWrapper.offsetWidth;
        gameWrapper.classList.add('shake');

        setTimeout(() => {
            gameWrapper.classList.remove('shake');
        }, EFFECT_MATH_CONFIG.SHAKE_DURATION_MS);
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
            if (type === 'damage') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; }
            if (type === 'heal') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; }
            if (type === 'exp') { typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.EXP; }

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
                }, EFFECT_MATH_CONFIG.FLOAT_TEXT_DURATION_MS); // 2.4s is animation duration
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
            duration: EFFECT_MATH_CONFIG.RIPPLE_DURATION_MS
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
