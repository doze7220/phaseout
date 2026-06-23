import { AppConfig, COLOR_CONFIG } from '../core/config.js';
import { EFFECT_MATH_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';
import { particleManager } from './effects.js';
import { PhaseManager, PHASE_NORMAL } from '../core/PhaseManager.js';

export class PrismLinkRenderer {
    constructor() {
        this.prismLinkState = { active: false, steps: [], fadeOutElapsed: null, isGlitching: false, glitchElapsed: null };
        this.sublimationEffects = [];
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.outlineCanvas = document.createElement('canvas');
        this.outlineCtx = this.outlineCanvas.getContext('2d');
    }

    update(realDelta, gameDelta) {
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

    triggerSublimationIfNeeded() {
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

    draw(ctx, _triggerScreenShake) {
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
    }
}
