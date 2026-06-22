import { generateScoreData, calculateChainScore } from '../core/score.js';
import { AppConfig, GameState, getScoreRate, CORE_MATH_CONFIG, COLOR_CONFIG, THEME_COLORS } from '../core/config.js';
import { EFFECT_MATH_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';
import { getScoreSprite, createScoreCanvas, drawString, measureString, measureScoreData, drawScoreData } from './ScoreRenderer.js';
import { particleManager } from './effects.js';
import { PhaseManager, PHASE_NORMAL } from '../core/PhaseManager.js';

export class ScreenEffectPopup {
    constructor() {
        this.floatingTexts = [];
        this.chainPopupState = { active: false, count: 0, color: '', scoreCanvas: null, elapsed: 0, duration: 1500, popElapsed: null };
        this.levelUpState = { active: false, oldLevel: 0, newLevel: 0, r1Str: '', r2Str: '', oldCost: 0, newCost: 0, elapsed: 0, duration: 2500 };
        this.prismLinkState = { active: false, steps: [], fadeOutElapsed: null, isGlitching: false, glitchElapsed: null };
        this.sublimationEffects = [];
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.outlineCanvas = document.createElement('canvas');
        this.outlineCtx = this.outlineCanvas.getContext('2d');
    }

    update(realDelta, gameDelta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            if (ft.delay > 0) {
                ft.delay -= gameDelta;
            } else {
                ft.elapsed += gameDelta;
                if (ft.elapsed >= ft.duration) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        if (this.chainPopupState.active) {
            this.chainPopupState.elapsed += gameDelta;
            if (this.chainPopupState.popElapsed !== null) {
                this.chainPopupState.popElapsed += gameDelta;
            }
        }

        if (this.levelUpState.active) {
            this.levelUpState.elapsed += gameDelta;
        }

        if (this.prismLinkState.active) {
            for (const step of this.prismLinkState.steps) {
                step.elapsed += gameDelta;
            }
            if (this.prismLinkState.isGlitching && this.prismLinkState.glitchElapsed !== null) {
                this.prismLinkState.glitchElapsed += gameDelta;
            }
            if (this.prismLinkState.fadeOutElapsed !== null) {
                this.prismLinkState.fadeOutElapsed += gameDelta;
            }
        }

        for (let i = this.sublimationEffects.length - 1; i >= 0; i--) {
            const effect = this.sublimationEffects[i];
            effect.mergeElapsed += gameDelta;
            const mathConf = EFFECT_MATH_CONFIG.PRISM_LINK;
            const totalDuration = mathConf.MERGE_DURATION_MS + mathConf.STAY_DURATION_MS + mathConf.EXPAND_DURATION_MS;
            if (effect.mergeElapsed >= totalDuration) {
                this.sublimationEffects.splice(i, 1);
            }
        }
    }

    triggerPrismLinkStep(step, baseColorId = 0, isWhitePhase = false) {
        if (!this.prismLinkState.active) {
            this.prismLinkState.active = true;
            this.prismLinkState.steps = [];
            this.prismLinkState.fadeOutElapsed = null;
            this.prismLinkState.isGlitching = false;
            this.prismLinkState.glitchElapsed = null;
            this.prismLinkState.isFullLinkMerging = false;
            this.prismLinkState.mergeElapsed = null;
            this.prismLinkState.baseColorId = baseColorId;
            this.prismLinkState.isWhitePhase = isWhitePhase;
        }
        this.prismLinkState.steps.push({
            step: step,
            elapsed: 0,
            hasLanded: false
        });
        this.prismLinkState.maxDepth = step;
    }

    showChainPopup(count, color, depth = 1) {
        if (!this.chainPopupState.active || this.chainPopupState.scoreCanvas !== null) {
            this.chainPopupState.elapsed = 0;
        }
        this.chainPopupState.active = true;
        this.chainPopupState.count = count;
        this.chainPopupState.depth = depth;
        this.chainPopupState.color = color;
        this.chainPopupState.scoreCanvas = null;
        this.chainPopupState.popElapsed = 0;
        this.chainPopupState.duration = this.chainPopupState.elapsed + 1500;

        if (count >= 3) {
            let currentScore = calculateChainScore(count, depth, PhaseManager.getCurrentPhaseName(), GameState.level);
            currentScore *= GameState.debug.scoreMultiplier;
            this.chainPopupState.realtimeScoreCanvas = createScoreCanvas(currentScore);
        } else {
            this.chainPopupState.realtimeScoreCanvas = null;
        }
    }

    hideChainPopup() {
        if (this.chainPopupState.active) {
            this.chainPopupState.popElapsed = 1000;
            this.chainPopupState.duration = this.chainPopupState.elapsed + 500;
        }
        if (this.prismLinkState.active) {
            if (this.prismLinkState.maxDepth >= 6 && PhaseManager.getCurrentPhaseName() === PHASE_NORMAL) {
                this.sublimationEffects.push({
                    mergeElapsed: 0,
                    baseColorId: this.prismLinkState.baseColorId,
                    isWhitePhase: this.prismLinkState.isWhitePhase,
                    steps: JSON.parse(JSON.stringify(this.prismLinkState.steps))
                });
                this.prismLinkState.active = false;
            } else {
                this.prismLinkState.isGlitching = true;
                this.prismLinkState.glitchElapsed = 0;
            }
        }
    }

    showScorePopup(points) {
        if (this.chainPopupState.active) {
            this.chainPopupState.scoreCanvas = createScoreCanvas(points);
            this.chainPopupState.elapsed = 0;
            this.chainPopupState.duration = 1500;
        }
        if (this.prismLinkState.active) {
            if (this.prismLinkState.maxDepth >= 6 && PhaseManager.getCurrentPhaseName() === PHASE_NORMAL) {
                this.sublimationEffects.push({
                    mergeElapsed: 0,
                    baseColorId: this.prismLinkState.baseColorId,
                    isWhitePhase: this.prismLinkState.isWhitePhase,
                    steps: JSON.parse(JSON.stringify(this.prismLinkState.steps))
                });
                this.prismLinkState.active = false;
            } else {
                this.prismLinkState.isGlitching = true;
                this.prismLinkState.glitchElapsed = 0;
            }
        }
    }

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        const isMobile = window.innerWidth <= 600;
        const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_RATE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_RATE;

        const r1Str = oldRate >= 10000 ? (oldRate.toExponential(2)) : (oldRate % 1 === 0 ? oldRate : oldRate.toFixed(1));
        const r2Str = newRate >= 10000 ? (newRate.toExponential(2)) : (newRate % 1 === 0 ? newRate : newRate.toFixed(1));

        this.levelUpState = {
            active: true,
            oldLevel, newLevel,
            r1Str, r2Str,
            oldCost: Math.floor(oldCost), newCost: Math.floor(newCost),
            elapsed: 0,
            duration: 2500
        };
    }

    showFloatingNumber(text, type, x, y, delay = 0) {
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

        const numberScale = 1.125;
        const labelScale = 0.75;

        const paddingScaleNum = 12 * numberScale;
        const paddingScaleLbl = 12 * labelScale;

        const numDispWidth = totalWidth * numberScale;
        const lblDispWidth = labelAdvanceWidth * labelScale;

        const canvasWidth = Math.max(numDispWidth + paddingScaleNum * 2, lblDispWidth + paddingScaleLbl * 2);
        const gap = 1;

        const yOffset = (46 * labelScale) + gap - (16 * numberScale);
        const numDispHeight = 54 * numberScale;
        const canvasHeight = yOffset + numDispHeight;

        // キャッシュ用のオフスクリーンキャンバスを作成（DOMには追加しない）
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

        let typeOffsetX = 0;
        let typeOffsetY = 0;
        if (type === 'damage') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.DAMAGE; }
        if (type === 'heal') { typeOffsetX = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.HEAL; }
        if (type === 'exp') { typeOffsetY = EFFECT_MATH_CONFIG.FLOAT_TEXT_OFFSET.EXP; }

        const randomX = (Math.random() - 0.5) * 40;
        const finalX = x + randomX + typeOffsetX;
        const finalY = y - canvasHeight + typeOffsetY;

        this.floatingTexts.push({
            image: canvas,
            x: finalX,
            y: finalY,
            elapsed: 0,
            delay: delay,
            duration: EFFECT_MATH_CONFIG.FLOAT_TEXT_DURATION_MS
        });
    }

    drawPopups(ctx, _triggerScreenShake) {
        // 1. フローティングテキスト
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            if (ft.delay > 0) continue;

            const elapsed = ft.elapsed;
            if (elapsed >= ft.duration) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            const progress = elapsed / ft.duration;
            let opacity = 0;
            let offsetY = 10;
            let scale = 0.8;

            // CSSアニメーション .floatUp の再現
            if (progress <= 0.15) {
                const p = progress / 0.15;
                opacity = p;
                offsetY = 10 - (10 * p);
                scale = 0.8 + 0.3 * p;
            } else if (progress <= 0.30) {
                const p = (progress - 0.15) / 0.15;
                opacity = 1;
                offsetY = 0;
                scale = 1.1 - 0.1 * p;
            } else {
                const p = (progress - 0.30) / 0.70;
                opacity = 1 - p;
                offsetY = -60 * p;
                scale = 1.0;
            }

            ctx.save();
            ctx.translate(ft.x, ft.y + offsetY);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.max(0, opacity);
            ctx.drawImage(ft.image, -ft.image.width / 2, 0);
            ctx.restore();
        }

        // 2-A. Prism Link UI
        if (this.prismLinkState.active) {
            const state = this.prismLinkState;
            let globalAlpha = 1.0;
            const mathConf = EFFECT_MATH_CONFIG.PRISM_LINK;

            if (state.isGlitching) {
                const glitchElapsed = state.glitchElapsed;
                if (glitchElapsed > mathConf.GLITCH_DURATION_MS) {
                    state.active = false;
                    state.isGlitching = false;
                    state.glitchElapsed = null;
                }
            } else if (state.fadeOutElapsed !== null) {
                const fadeElapsed = state.fadeOutElapsed;
                if (fadeElapsed > 500) {
                    state.active = false;
                    state.fadeOutElapsed = null;
                } else {
                    globalAlpha = 1.0 - (fadeElapsed / 500);
                }
            }

            if (state.active) {
                const conf = LAYOUT_CONFIG.PRISM_LINK_UI;
                ctx.save();
                ctx.globalAlpha = globalAlpha;

                const totalWidth = 7 * conf.ICON_SIZE + 6 * conf.ICON_SPACING;
                const startX = (LAYOUT_CONFIG.BASE.WIDTH - totalWidth) / 2;
                const centerX = conf.CENTER_X || LAYOUT_CONFIG.BASE.WIDTH / 2;
                const centerY = conf.CENTER_Y || conf.Y_OFFSET + conf.ICON_SIZE / 2;
                const baseColorId = state.baseColorId || 0;
                const isReverse = state.isWhitePhase;

                for (let depth = 0; depth < 7; depth++) {
                    const colorIndex = (baseColorId + depth) % 7;
                    const colorData = COLOR_CONFIG[colorIndex];
                    if (!colorData) continue;

                    const visualDepth = isReverse ? (6 - depth) : depth;
                    let iconX = startX + visualDepth * (conf.ICON_SIZE + conf.ICON_SPACING);
                    let iconY = conf.Y_OFFSET;

                    let scale = 1.0;
                    let alpha = 0.3;
                    let flash = 0;
                    let isLit = false;

                    if (depth === 0) {
                        isLit = true;
                        alpha = 1.0;
                        scale = 1.0;
                    } else {
                        const stepData = state.steps.find(s => s.step === depth);

                        if (stepData) {
                            const elapsed = stepData.elapsed;
                            if (elapsed < mathConf.DROP_DURATION_MS) {
                                const p = Math.max(0, elapsed / mathConf.DROP_DURATION_MS);
                                scale = mathConf.MAX_SCALE - (mathConf.MAX_SCALE - 1.0) * (p * p);
                                alpha = 0.3 + 0.7 * p;
                            } else {
                                if (!stepData.hasLanded) {
                                    stepData.hasLanded = true;
                                    if (typeof _triggerScreenShake !== "undefined") _triggerScreenShake(8);
                                    if (typeof particleManager !== "undefined" && AppConfig.EFFECT_LEVEL === "FULL") {
                                        particleManager.spawnBurstSparks(iconX + conf.ICON_SIZE / 2, iconY + conf.ICON_SIZE / 2, colorData.color, 1.5, 15, 1.5);
                                    }
                                }
                                isLit = true;
                                alpha = 1.0;
                                const flashElapsed = elapsed - mathConf.DROP_DURATION_MS;
                                if (flashElapsed < mathConf.FLASH_DURATION_MS) {
                                    flash = 1.0 - (flashElapsed / mathConf.FLASH_DURATION_MS);
                                }
                            }
                        } else {
                            if (mathConf.SHOW_UNLIT_BASE === false) continue;
                            alpha = 0.15;
                        }
                    }

                    ctx.save();
                    ctx.translate(iconX + conf.ICON_SIZE / 2, iconY + conf.ICON_SIZE / 2);

                    const sprite = AssetManager.images[colorData.symbolKey];
                    if (sprite) {
                        const fillMode = isLit ? mathConf.STAMP_FILL_MODE : mathConf.BASE_FILL_MODE;
                        const customColor = isLit ? mathConf.STAMP_FILL_CUSTOM_COLOR : mathConf.BASE_FILL_CUSTOM_COLOR;

                        const lw = mathConf.BASE_OUTLINE_WIDTH || 0;
                        const cvSize = conf.ICON_SIZE + lw * 2;

                        if (lw > 0) {
                            this.outlineCanvas.width = cvSize;
                            this.outlineCanvas.height = cvSize;
                            this.outlineCtx.clearRect(0, 0, cvSize, cvSize);

                            for (let dx of [-1, 0, 1]) {
                                for (let dy of [-1, 0, 1]) {
                                    if (dx === 0 && dy === 0) continue;
                                    this.outlineCtx.drawImage(sprite, lw + dx * lw, lw + dy * lw, conf.ICON_SIZE, conf.ICON_SIZE);
                                }
                            }
                            this.outlineCtx.globalCompositeOperation = "source-in";
                            const outFillMode = mathConf.BASE_OUTLINE_FILL_MODE || 0;
                            const outCustomColor = mathConf.BASE_OUTLINE_CUSTOM_COLOR || "white";
                            this.outlineCtx.fillStyle = (outFillMode === 1) ? colorData.color : outCustomColor;
                            if (outFillMode !== 0) {
                                this.outlineCtx.fillRect(0, 0, cvSize, cvSize);
                            }
                            this.outlineCtx.globalCompositeOperation = "source-over";
                        }

                        this.tempCanvas.width = conf.ICON_SIZE;
                        this.tempCanvas.height = conf.ICON_SIZE;
                        this.tempCtx.clearRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);

                        if (fillMode === 0) {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                        } else {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = "source-in";
                            this.tempCtx.fillStyle = (fillMode === 1) ? colorData.color : customColor;
                            this.tempCtx.fillRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = "source-over";
                        }

                        const drawX = -conf.ICON_SIZE / 2;
                        const drawY = -conf.ICON_SIZE / 2;
                        const outDrawX = drawX - lw;
                        const outDrawY = drawY - lw;

                        if (state.isGlitching) {
                            ctx.globalCompositeOperation = "lighter";
                            const shiftX = (Math.random() - 0.5) * 15;
                            const shiftY = (Math.random() - 0.5) * 15;
                            ctx.translate(shiftX, shiftY);

                            ctx.scale(scale, scale);
                            ctx.globalAlpha = 0.8;

                            if (lw > 0) {
                                ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
                                ctx.shadowBlur = 5;
                                ctx.drawImage(this.outlineCanvas, outDrawX - 5, outDrawY);
                                ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
                                ctx.drawImage(this.outlineCanvas, outDrawX + 5, outDrawY);
                            }

                            ctx.shadowColor = "rgba(255, 0, 0, 0.8)";
                            ctx.shadowBlur = 5;
                            ctx.drawImage(this.tempCanvas, drawX - 5, drawY);

                            ctx.shadowColor = "rgba(0, 255, 255, 0.8)";
                            ctx.drawImage(this.tempCanvas, drawX + 5, drawY);

                            if (Math.random() < 0.5) {
                                ctx.globalCompositeOperation = "destination-out";
                                ctx.fillStyle = "black";
                                ctx.fillRect(-conf.ICON_SIZE, (Math.random() - 0.5) * conf.ICON_SIZE, conf.ICON_SIZE * 2, 10);
                            }
                        } else {
                            ctx.scale(scale, scale);
                            ctx.globalAlpha = globalAlpha * alpha;

                            if (lw > 0) {
                                ctx.globalCompositeOperation = mathConf.BASE_OUTLINE_COMPOSITE_OP || "source-over";
                                ctx.shadowColor = "transparent";
                                ctx.shadowBlur = 0;
                                ctx.drawImage(this.outlineCanvas, outDrawX, outDrawY);
                            }

                            ctx.globalCompositeOperation = isLit ? mathConf.STAMP_COMPOSITE_OP : mathConf.BASE_COMPOSITE_OP;
                            if (isLit) {
                                ctx.shadowColor = (fillMode === 1) ? colorData.color : ((fillMode === 2) ? customColor : colorData.color);
                                ctx.shadowBlur = 15;
                            } else {
                                ctx.shadowBlur = 0;
                            }
                            ctx.drawImage(this.tempCanvas, drawX, drawY);

                            if (flash > 0) {
                                ctx.globalCompositeOperation = mathConf.STAMP_COMPOSITE_OP;
                                ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
                                ctx.beginPath();
                                ctx.arc(0, 0, conf.ICON_SIZE / 2, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }
                    ctx.restore();
                }
                ctx.restore();
            }
        }

        // 2-B. Sublimation Effects
        for (const effect of this.sublimationEffects) {
            const mathConf = EFFECT_MATH_CONFIG.PRISM_LINK;
            const mergeElapsed = effect.mergeElapsed;
            let mergePhase = 0;

            if (mergeElapsed < mathConf.MERGE_DURATION_MS) {
                mergePhase = 1;
            } else if (mergeElapsed < mathConf.MERGE_DURATION_MS + mathConf.STAY_DURATION_MS) {
                mergePhase = 2;
            } else {
                mergePhase = 3;
            }

            const conf = LAYOUT_CONFIG.PRISM_LINK_UI;
            ctx.save();
            ctx.globalAlpha = 1.0;

            const totalWidth = 7 * conf.ICON_SIZE + 6 * conf.ICON_SPACING;
            const startX = (LAYOUT_CONFIG.BASE.WIDTH - totalWidth) / 2;
            const centerX = conf.CENTER_X || LAYOUT_CONFIG.BASE.WIDTH / 2;
            const centerY = conf.CENTER_Y || conf.Y_OFFSET + conf.ICON_SIZE / 2;
            const baseColorId = effect.baseColorId || 0;
            const isReverse = effect.isWhitePhase;

            if (mergePhase >= 2) {
                const stayElapsed = mergeElapsed - mathConf.MERGE_DURATION_MS;
                let mScale = 1.0;
                let phaseAlpha = 1.0;

                if (mergePhase === 3) {
                    const expandElapsed = stayElapsed - mathConf.STAY_DURATION_MS;
                    const p = Math.max(0, expandElapsed / mathConf.EXPAND_DURATION_MS);
                    mScale = 1.0 + 2.0 * p;
                    phaseAlpha = Math.max(0, 1.0 - p);
                }

                ctx.save();
                ctx.globalAlpha = phaseAlpha;
                ctx.translate(centerX, centerY);
                ctx.scale(mScale, mScale);

                const outerR = EFFECT_MATH_CONFIG.PRISM_LINK.SUBLIMATION_TRIBAL_OUTER_R; // 60
                const innerR = EFFECT_MATH_CONFIG.PRISM_LINK.SUBLIMATION_TRIBAL_INNER_R; // 2
                const radiusStep = (outerR - innerR) / 6;
                const lineWidth = mathConf.SUBLIMATION_TRIBAL_LINE_WIDTH || 4;

                for (let i = 0; i < 7; i++) {
                    const circleRadius = outerR - i * radiusStep;
                    ctx.beginPath();
                    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
                    ctx.lineWidth = lineWidth;
                    ctx.strokeStyle = "#ffffff";
                    ctx.shadowColor = "#ffffff";
                    ctx.shadowBlur = 15;
                    ctx.stroke();
                }

                ctx.restore();

                if (PhaseManager.getCurrentPhaseName() === PHASE_NORMAL) {
                    ctx.save();
                    ctx.globalAlpha = phaseAlpha;
                    ctx.translate(centerX, centerY);

                    ctx.shadowBlur = 0;
                    ctx.font = "16px monospace, 'Courier New'";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    let isLogGlitch = false;
                    const totalStayExpand = mathConf.STAY_DURATION_MS + mathConf.EXPAND_DURATION_MS;
                    if (stayElapsed > totalStayExpand - mathConf.GLITCH_DURATION_MS) {
                        isLogGlitch = true;
                        ctx.translate((Math.random() - 0.5) * 15, 0);
                    }

                    const logBaseY = mathConf.SUBLIMATION_LOG_POS_Y || -40;
                    const logs = mathConf.SUBLIMATION_LOG_TIMINGS || [
                        { text: "PHASE SHIFT PREDICTION...", offsetY: 0 },
                        { text: "ASTRAEA SUBLIMATION", offsetY: 24 }
                    ];

                    logs.forEach((log) => {
                        let fontColor = `rgba(255, 255, 255, 1.0)`;
                        if (isLogGlitch) {
                            const r = Math.random();
                            if (r > 0.6) fontColor = `rgba(0, 255, 255, 1.0)`;
                            else if (r > 0.3) fontColor = `rgba(255, 0, 255, 1.0)`;
                        }

                        ctx.strokeStyle = `rgba(0, 0, 0, 1.0)`;
                        ctx.lineWidth = 4;
                        ctx.strokeText(log.text, 0, logBaseY + log.offsetY);
                        ctx.fillStyle = fontColor;
                        ctx.fillText(log.text, 0, logBaseY + log.offsetY);
                    });

                    ctx.restore();
                }
            } else {
                for (let depth = 0; depth < 7; depth++) {
                    const colorIndex = (baseColorId + depth) % 7;
                    const colorData = COLOR_CONFIG[colorIndex];
                    if (!colorData) continue;

                    const visualDepth = isReverse ? (6 - depth) : depth;
                    let iconX = startX + visualDepth * (conf.ICON_SIZE + conf.ICON_SPACING);
                    let iconY = conf.Y_OFFSET;

                    const p = mergeElapsed / mathConf.MERGE_DURATION_MS;
                    const ease = p * p * p;
                    iconX = iconX + (centerX - conf.ICON_SIZE / 2 - iconX) * ease;
                    iconY = iconY + (centerY - conf.ICON_SIZE / 2 - iconY) * ease;

                    let scale = 1.0;
                    let alpha = 1.0;
                    let isLit = true;

                    ctx.save();
                    ctx.translate(iconX + conf.ICON_SIZE / 2, iconY + conf.ICON_SIZE / 2);

                    const sprite = AssetManager.images[colorData.symbolKey];
                    if (sprite) {
                        const fillMode = mathConf.STAMP_FILL_MODE;
                        const customColor = mathConf.STAMP_FILL_CUSTOM_COLOR;

                        const lw = mathConf.BASE_OUTLINE_WIDTH || 0;
                        const cvSize = conf.ICON_SIZE + lw * 2;

                        if (lw > 0) {
                            this.outlineCanvas.width = cvSize;
                            this.outlineCanvas.height = cvSize;
                            this.outlineCtx.clearRect(0, 0, cvSize, cvSize);

                            for (let dx of [-1, 0, 1]) {
                                for (let dy of [-1, 0, 1]) {
                                    if (dx === 0 && dy === 0) continue;
                                    this.outlineCtx.drawImage(sprite, lw + dx * lw, lw + dy * lw, conf.ICON_SIZE, conf.ICON_SIZE);
                                }
                            }
                            this.outlineCtx.globalCompositeOperation = "source-in";
                            const outFillMode = mathConf.BASE_OUTLINE_FILL_MODE || 0;
                            const outCustomColor = mathConf.BASE_OUTLINE_CUSTOM_COLOR || "white";
                            this.outlineCtx.fillStyle = (outFillMode === 1) ? colorData.color : outCustomColor;
                            if (outFillMode !== 0) {
                                this.outlineCtx.fillRect(0, 0, cvSize, cvSize);
                            }
                            this.outlineCtx.globalCompositeOperation = "source-over";
                        }

                        this.tempCanvas.width = conf.ICON_SIZE;
                        this.tempCanvas.height = conf.ICON_SIZE;
                        this.tempCtx.clearRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);

                        if (fillMode === 0) {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                        } else {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = "source-in";
                            this.tempCtx.fillStyle = (fillMode === 1) ? colorData.color : customColor;
                            this.tempCtx.fillRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = "source-over";
                        }

                        const drawX = -conf.ICON_SIZE / 2;
                        const drawY = -conf.ICON_SIZE / 2;
                        const outDrawX = drawX - lw;
                        const outDrawY = drawY - lw;

                        ctx.scale(scale, scale);
                        ctx.globalAlpha = alpha;

                        if (lw > 0) {
                            ctx.globalCompositeOperation = mathConf.BASE_OUTLINE_COMPOSITE_OP || "source-over";
                            ctx.drawImage(this.outlineCanvas, outDrawX, outDrawY);
                        }

                        ctx.globalCompositeOperation = "source-over";
                        ctx.drawImage(this.tempCanvas, drawX, drawY);

                        const easeP = p * p * p;

                        ctx.save();
                        ctx.globalCompositeOperation = "lighter";
                        ctx.globalAlpha = alpha * easeP * 2.0;
                        ctx.shadowColor = "#ffffff";
                        ctx.shadowBlur = 30 * easeP;
                        ctx.drawImage(this.tempCanvas, drawX, drawY);
                        ctx.restore();
                    }
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        // 3. Chain & Score Popup
        if (this.chainPopupState.active) {
            const cp = this.chainPopupState;
            const elapsed = cp.elapsed;
            if (elapsed >= cp.duration) {
                cp.active = false;
            } else {
                let baseScale = 1.0;
                let opacity = 1.0;

                if (cp.scoreCanvas) {
                    // 最終確定時のアニメーション
                    if (elapsed < 150) {
                        // 確定時の弾けるようなポップ
                        const p = Math.sin((elapsed / 150) * Math.PI); // 0 -> 1 -> 0
                        baseScale = 1.0 + 0.15 * p;
                    } else if (elapsed > 1000) {
                        // フェードアウトと拡大
                        const p = (elapsed - 1000) / 500;
                        baseScale = 1.0 + 0.3 * p;
                        opacity = 1.0 - p;
                    }
                } else {
                    // ドラムロール中のアニメーション
                    const timeSinceUpdate = cp.popElapsed;
                    if (timeSinceUpdate > 1000) {
                        const p = (timeSinceUpdate - 1000) / 500;
                        baseScale = 1.0 + 0.2 * p;
                        opacity = 1.0 - p;
                    } else {
                        // 出現時のポップアップ
                        const p = Math.min(1, elapsed / 100);
                        baseScale = 0.5 + 0.5 * p;
                    }
                }

                let popScale = 1.0;
                // 数値更新時のアニメーション (連鎖中のみChainテキストが弾む)
                if (cp.popElapsed !== null && !cp.scoreCanvas) {
                    const popElapsed = cp.popElapsed;
                    if (popElapsed < 150) {
                        const popP = popElapsed / 150; // 0 to 1
                        popScale = (1.0 + 0.2 * (1 - popP));
                    }
                }

                ctx.save();
                ctx.translate(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2);
                ctx.scale(baseScale, baseScale);
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

                const conf = LAYOUT_CONFIG.POPUPS;

                // 1. スコアと数式 (確定前後で共通のレイアウトを使用)
                const isFinalScore = !!cp.scoreCanvas;
                const isDetailed = AppConfig.SHOW_MATH_POPUP && cp.count >= 3;
                const displayCanvas = cp.scoreCanvas || cp.realtimeScoreCanvas;

                // 詳細モード時は常に表示。非詳細モード時は最終確定時のみ表示。
                if (displayCanvas && (isDetailed || isFinalScore)) {
                    ctx.save();

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const isWhitePhase = (PhaseManager.getCurrentPhaseName() === 'ホワイトステイシス中');

                    // スコア描画
                    const scaleScale = conf.SCORE_CANVAS_SCALE || 1.5;
                    const sw = displayCanvas.width * scaleScale;
                    const sh = displayCanvas.height * scaleScale;
                    const dx = -sw / 2;
                    const dy = conf.SCORE_REALTIME_Y - sh / 2;

                    if (isWhitePhase) {
                        const hue = Math.floor(elapsed * EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360;

                        // 1. 強烈な背景モヤ（巨大な後光）を敷いて背景の白さを抑えつつ色を主張
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-over';
                        const bgCy = conf.SCORE_REALTIME_Y + (isDetailed ? (conf.MATH_TEXT_Y - conf.SCORE_REALTIME_Y) / 2 : 0);
                        ctx.translate(0, bgCy);
                        ctx.scale(3.0, 1.5); // 横長・縦長に引き延ばす
                        const radius = sh;
                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                        gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.85)`);
                        gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 0.4)`);
                        gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
                        ctx.fillStyle = gradient;
                        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
                        ctx.restore();

                        // 2. スコア文字のアウトライン発光 (複数回重ねて濃くする)
                        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                        ctx.shadowBlur = EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.BLUR;
                        ctx.globalCompositeOperation = 'source-over'; // 白背景に勝つために通常合成
                        ctx.drawImage(displayCanvas, dx, dy, sw, sh);
                        ctx.drawImage(displayCanvas, dx, dy, sw, sh); // 2度描きで発光を濃くする

                        ctx.shadowBlur = 0;
                        ctx.drawImage(displayCanvas, dx, dy, sw, sh); // 本体描画（黒フチ確保）
                    } else {
                        ctx.drawImage(displayCanvas, dx, dy, sw, sh);
                    }

                    // 数式描画 (詳細モードのみ)
                    if (isDetailed) {
                        const chainBase = cp.count - 2;
                        const depthDivisorNum = Number(CORE_MATH_CONFIG.DEPTH_BONUS_DIVISOR);
                        const depthBonusMulNum = depthDivisorNum + cp.depth;
                        const depthBonusStr = (depthBonusMulNum / depthDivisorNum).toFixed(1);

                        // 実RATEの取得とパース
                        const rateValue = BigInt(Math.floor(getScoreRate(GameState.level)));
                        const rateTokens = generateScoreData(rateValue, 7);

                        // 幅の計測
                        const rateLabelPrefix = 'char';
                        const rateLabelStr = "RATE";
                        const rateLabelWidth = measureString(rateLabelStr, rateLabelPrefix, conf.RATE_LABEL.SCALE_X);
                        const rateValueWidth = measureScoreData(rateTokens, conf.RATE_VALUE.SCALE_X);

                        // RATEブロック全体の幅（VALUEの幅のみ。LABELは右上などに重なる装飾として扱うため、横幅の計算には含めない）
                        const rateBlockWidth = conf.RATE_VALUE.OFFSET_X + rateValueWidth;

                        const powerChar = isWhitePhase ? '\u00B3' : '\u00B2';

                        const mathText1 = `\u00D7 ${chainBase}`;
                        const mathText2 = powerChar;
                        const mathText3 = ` \u00D7 ${depthBonusStr}`;

                        ctx.font = conf.FONT_CHAIN;
                        const w1 = ctx.measureText(mathText1).width;
                        const w2 = ctx.measureText(mathText2).width;
                        const w3 = ctx.measureText(mathText3).width;
                        const mathRestWidth = w1 + w2 + w3;

                        // Xオフセットの計算 (全体をセンタリング)
                        const margin = conf.MATH_GAP !== undefined ? conf.MATH_GAP : 10;
                        const totalWidth = rateBlockWidth + margin + mathRestWidth;
                        const startX = -totalWidth / 2;

                        // 実RATE数値の描画
                        const valX = startX + conf.RATE_VALUE.OFFSET_X;
                        const valY = conf.MATH_TEXT_Y + conf.RATE_VALUE.OFFSET_Y;
                        drawScoreData(ctx, rateTokens, valX, valY, conf.RATE_VALUE.SCALE_X, conf.RATE_VALUE.SCALE_Y);

                        // RATEラベルの描画（実RATE数値の右上を基準位置とする）
                        const labelX = valX + rateValueWidth + conf.RATE_LABEL.OFFSET_X;
                        const labelY = valY + conf.RATE_LABEL.OFFSET_Y;
                        drawString(ctx, rateLabelStr, rateLabelPrefix, labelX, labelY, conf.RATE_LABEL.SCALE_X, conf.RATE_LABEL.SCALE_Y);

                        // 続く数式文字列を描画
                        const mathStartX = startX + rateBlockWidth + margin;

                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 4;
                        ctx.textAlign = 'left';

                        const drawMath = () => {
                            let cx = mathStartX;
                            // Part 1
                            ctx.fillStyle = '#FFD700';
                            ctx.strokeText(mathText1, cx, conf.MATH_TEXT_Y);
                            ctx.fillText(mathText1, cx, conf.MATH_TEXT_Y);
                            cx += w1;

                            // Part 2 (Highlight during White Phase)
                            ctx.fillStyle = isWhitePhase ? EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.POWER_TEXT_COLOR : '#FFD700';
                            ctx.strokeText(mathText2, cx, conf.MATH_TEXT_Y);
                            ctx.fillText(mathText2, cx, conf.MATH_TEXT_Y);
                            cx += w2;

                            // Part 3
                            ctx.fillStyle = '#FFD700';
                            ctx.strokeText(mathText3, cx, conf.MATH_TEXT_Y);
                            ctx.fillText(mathText3, cx, conf.MATH_TEXT_Y);
                        };

                        if (isWhitePhase) {
                            const hue = Math.floor(elapsed * EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.HUE_SPEED) % 360;

                            // 巨大な後光（背景）
                            ctx.save();
                            const bgCx = mathStartX + mathRestWidth / 2;
                            ctx.translate(bgCx, conf.MATH_TEXT_Y);
                            ctx.scale(1.5, 1.0);
                            const radius = mathRestWidth * 0.6;
                            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                            gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.6)`);
                            gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
                            ctx.fillStyle = gradient;
                            ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
                            ctx.restore();

                            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
                            ctx.shadowBlur = EFFECT_MATH_CONFIG.WHITE_SCORE_GLOW.BLUR;
                            ctx.globalCompositeOperation = 'source-over'; // 黒縁を維持するため通常合成

                            drawMath();
                            drawMath(); // 2度描きで発光を濃くする
                            ctx.shadowBlur = 0;
                            drawMath(); // 本体
                        } else {
                            ctx.shadowColor = '#000';
                            ctx.shadowBlur = 4;
                            drawMath();
                        }

                        ctx.shadowBlur = 0;
                        ctx.textAlign = 'center'; // 元に戻す
                    }
                    ctx.restore();
                }

                // 2. Chain / Depth (popScaleを適用)
                ctx.save();
                ctx.scale(popScale, popScale);

                ctx.font = conf.FONT_CHAIN;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Text Shadow
                ctx.shadowColor = cp.color || '#FFD700';
                ctx.shadowBlur = 20;

                // フラッシュ＆グロウ (cp.scoreCanvas がある = 最終確定)
                if (cp.scoreCanvas && elapsed < 300) {
                    const flashOpacity = 1.0 - (elapsed / 300);
                    ctx.shadowBlur = 40 + (60 * flashOpacity);
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity * 0.5})`;
                    ctx.fillRect(-LAYOUT_CONFIG.BASE.WIDTH / 2, -100, LAYOUT_CONFIG.BASE.WIDTH, 200);
                }

                ctx.fillStyle = '#FFFFFF';
                const text = `${cp.count} Chain / ${cp.depth} Depth`;
                ctx.fillText(text, 0, conf.CHAIN_TEXT_Y);
                ctx.shadowBlur = 40;
                ctx.fillText(text, 0, conf.CHAIN_TEXT_Y);
                ctx.shadowBlur = 0;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeText(text, 0, conf.CHAIN_TEXT_Y);
                ctx.fillText(text, 0, conf.CHAIN_TEXT_Y);

                ctx.restore(); // popScaleの復元
                ctx.restore(); // baseScaleとtranslateの復元
            }
        }

        // 3. Level Up Popup
        if (this.levelUpState.active) {
            const lu = this.levelUpState;
            const elapsed = lu.elapsed;
            if (elapsed >= lu.duration) {
                lu.active = false;
            } else {
                let opacity = 1.0;
                let scale = 1.0;

                // フェードイン＆スケール
                if (elapsed < 200) {
                    scale = 0.8 + 0.2 * (elapsed / 200);
                }
                // フェードアウト
                if (elapsed > 2000) {
                    opacity = 1.0 - ((elapsed - 2000) / 500);
                }

                const conf = LAYOUT_CONFIG.POPUPS;
                ctx.save();
                ctx.translate(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2);
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

                // 背景帯
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y, LAYOUT_CONFIG.BASE.WIDTH, conf.LEVEL_UP_BG_HEIGHT);
                ctx.strokeStyle = '#00FFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y);
                ctx.lineTo(LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y);
                ctx.moveTo(-LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y + conf.LEVEL_UP_BG_HEIGHT);
                ctx.lineTo(LAYOUT_CONFIG.BASE.WIDTH / 2, conf.LEVEL_UP_BG_Y + conf.LEVEL_UP_BG_HEIGHT);
                ctx.stroke();

                ctx.scale(scale, scale);

                // テキスト描画
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.font = conf.FONT_LEVEL_UP_TITLE;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 10;
                ctx.fillText('STIRRING LEVEL UP', 0, conf.LEVEL_UP_TITLE_Y);

                ctx.font = conf.FONT_LEVEL_UP_LEVEL;
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.fillText(`Lv.${lu.oldLevel} >>> Lv.${lu.newLevel}`, 0, conf.LEVEL_UP_LEVEL_Y);

                ctx.font = conf.FONT_LEVEL_UP_STATS;
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowBlur = 0;

                // Rate
                ctx.textAlign = 'right';
                ctx.fillStyle = '#00FFFF'; ctx.fillText('RATE', conf.LEVEL_UP_RATE_LABEL_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = '#aaaaaa'; ctx.fillText(`${lu.r1Str}x`, conf.LEVEL_UP_RATE_OLD_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = '#FF00FF'; ctx.fillText('>>>', conf.LEVEL_UP_RATE_ARROW_X, conf.LEVEL_UP_RATE_Y);
                ctx.fillStyle = THEME_COLORS.GREEN; ctx.fillText(`${lu.r2Str}x`, conf.LEVEL_UP_RATE_NEW_X, conf.LEVEL_UP_RATE_Y);

                // Cost
                ctx.fillStyle = '#00FFFF'; ctx.fillText('COST', conf.LEVEL_UP_RATE_LABEL_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = '#aaaaaa'; ctx.fillText(`-${lu.oldCost}`, conf.LEVEL_UP_RATE_OLD_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = '#FF00FF'; ctx.fillText('>>>', conf.LEVEL_UP_RATE_ARROW_X, conf.LEVEL_UP_COST_Y);
                ctx.fillStyle = THEME_COLORS.GREEN; ctx.fillText(`-${lu.newCost}`, conf.LEVEL_UP_RATE_NEW_X, conf.LEVEL_UP_COST_Y);

                ctx.restore();
            }
        }
    }
}
