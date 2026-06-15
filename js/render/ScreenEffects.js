import { generateScoreData, renderScoreToHtml } from '../core/score.js';
import { AppConfig, EFFECT_MATH_CONFIG, GameState, getScoreRate, CORE_MATH_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { THEME_COLORS, COLOR_CONFIG } from '../core/config.js';
import { SpriteCacheManager, AssetManager } from './SpriteCacheManager.js';
import { getScoreSprite, createScoreCanvas, drawString, measureString, measureScoreData, drawScoreData } from './ScoreRenderer.js';
import { particleManager } from './effects.js';

export class ScreenEffects {
    constructor() {
        this.floatingTexts = [];
        this.chainPopupState = { active: false, count: 0, color: '', scoreCanvas: null, startTime: 0, duration: 1500 };
        this.levelUpState = { active: false, oldLevel: 0, newLevel: 0, r1Str: '', r2Str: '', oldCost: 0, newCost: 0, startTime: 0, duration: 2500 };
        this.shakeState = { active: false, endTime: 0, magnitude: 5 };
        
        // ヴィネット用（ピンチ、ステイシス）
        this.isPinch = false;
        this.pinchAlpha = 0;
        this.isStasis = false;
        this.stasisAlpha = 0;

        // トライバルエフェクト用
        this.tribalEffects = [];

        // プリズムリンク用
        this.prismLinkState = { active: false, steps: [], fadeOutStart: null, isGlitching: false, glitchStartTime: null };
        this.tempCanvas = document.createElement('canvas');
        this.tempCtx = this.tempCanvas.getContext('2d');
        this.outlineCanvas = document.createElement('canvas');
        this.outlineCtx = this.outlineCanvas.getContext('2d');
    }

    triggerPrismLinkStep(step, baseColorId = 0) {
        if (!this.prismLinkState.active) {
            this.prismLinkState.active = true;
            this.prismLinkState.steps = [];
            this.prismLinkState.fadeOutStart = null;
            this.prismLinkState.isGlitching = false;
            this.prismLinkState.glitchStartTime = null;
            this.prismLinkState.baseColorId = baseColorId;
        }
        this.prismLinkState.steps.push({
            step: step,
            startTime: performance.now(),
            hasLanded: false
        });
    }

    showChainPopup(count, color, depth = 1) {
        if (!this.chainPopupState.active || this.chainPopupState.scoreCanvas !== null) {
            this.chainPopupState.startTime = performance.now();
        }
        this.chainPopupState.active = true;
        this.chainPopupState.count = count;
        this.chainPopupState.depth = depth;
        this.chainPopupState.color = color;
        this.chainPopupState.scoreCanvas = null; // scorePopupで上書きされるまでnull
        this.chainPopupState.popStartTime = performance.now(); // 数値更新時のアニメーション用
        this.chainPopupState.duration = (performance.now() - this.chainPopupState.startTime) + 1500; // 長い連鎖でもタイムアウトしないように延長

        if (count >= 3) {
            const bigChainBase = BigInt(count - 2);
            const rate = BigInt(Math.floor(getScoreRate(GameState.level)));
            const depthDivisor = BigInt(CORE_MATH_CONFIG.DEPTH_BONUS_DIVISOR);
            const depthBonusMul = depthDivisor + BigInt(depth);
            const currentScore = (rate * (bigChainBase * bigChainBase) * depthBonusMul) / depthDivisor;
            this.chainPopupState.realtimeScoreCanvas = createScoreCanvas(currentScore);
        } else {
            this.chainPopupState.realtimeScoreCanvas = null;
        }
    }

    hideChainPopup() {
        if (this.chainPopupState.active) {
            // フェードアウト開始時間に設定して消す
            this.chainPopupState.popStartTime = performance.now() - 1000;
            this.chainPopupState.duration = (performance.now() - this.chainPopupState.startTime) + 500;
        }
        if (this.prismLinkState.active) {
            this.prismLinkState.isGlitching = true;
            this.prismLinkState.glitchStartTime = performance.now();
        }
    }

    showScorePopup(points) {
        if (this.chainPopupState.active) {
            this.chainPopupState.scoreCanvas = createScoreCanvas(points);
            this.chainPopupState.startTime = performance.now(); // タイマーリセット
            this.chainPopupState.duration = 1500; // 確定後の表示時間をリセット
        }
        if (this.prismLinkState.active) {
            this.prismLinkState.isGlitching = true;
            this.prismLinkState.glitchStartTime = performance.now();
        }
    }

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        const isMobile = window.innerWidth <= 600;
        const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_RATE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_RATE;

        // Html生成用の関数を使っているが、Canvas描画用に文字列化する
        // createScoreCanvasを活用できない場合は単純な文字列で表現
        const r1Str = oldRate >= 10000 ? (oldRate.toExponential(2)) : (oldRate % 1 === 0 ? oldRate : oldRate.toFixed(1));
        const r2Str = newRate >= 10000 ? (newRate.toExponential(2)) : (newRate % 1 === 0 ? newRate : newRate.toFixed(1));

        this.levelUpState = {
            active: true,
            oldLevel, newLevel,
            r1Str, r2Str,
            oldCost: Math.floor(oldCost), newCost: Math.floor(newCost),
            startTime: performance.now(),
            duration: 2500
        };
    }

    triggerScreenShake(magnitude = 5) {
        this.shakeState.active = true;
        this.shakeState.endTime = performance.now() + EFFECT_MATH_CONFIG.SHAKE_DURATION_MS;
        this.shakeState.magnitude = magnitude;
    }

    applyShake(ctx) {
        if (!this.shakeState.active) return;
        const now = performance.now();
        if (now > this.shakeState.endTime) {
            this.shakeState.active = false;
            return;
        }

        // 強度を減衰させる
        const remaining = this.shakeState.endTime - now;
        const progress = remaining / EFFECT_MATH_CONFIG.SHAKE_DURATION_MS;
        const currentMagnitude = this.shakeState.magnitude * progress;

        const dx = (Math.random() - 0.5) * 2 * currentMagnitude;
        const dy = (Math.random() - 0.5) * 2 * currentMagnitude;

        ctx.translate(dx, dy);
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
            startTime: performance.now() + delay,
            duration: EFFECT_MATH_CONFIG.FLOAT_TEXT_DURATION_MS
        });
    }

    showTribalUnlockEffect(colorStr) {
        const found = COLOR_CONFIG.find(c => c.color.toUpperCase() === colorStr.toUpperCase());
        if (found && found.symbolKey) {
            const rawSprite = AssetManager.images[found.symbolKey];
            let effectSprite = null;
            
            if (rawSprite) {
                const mode = EFFECT_MATH_CONFIG.TRIBAL_UNLOCK.FILL_MODE || 0;
                if (mode === 0) {
                    effectSprite = rawSprite;
                } else {
                    const fillStyle = (mode === 2) 
                        ? (EFFECT_MATH_CONFIG.TRIBAL_UNLOCK.FILL_CUSTOM_COLOR || '#FFFFFF')
                        : colorStr;
                        
                    effectSprite = document.createElement('canvas');
                    effectSprite.width = rawSprite.width || 512;
                    effectSprite.height = rawSprite.height || 512;
                    const eCtx = effectSprite.getContext('2d');
                    eCtx.drawImage(rawSprite, 0, 0);
                    eCtx.globalCompositeOperation = 'source-in';
                    eCtx.fillStyle = fillStyle;
                    eCtx.fillRect(0, 0, effectSprite.width, effectSprite.height);
                }
            }

            const faction = found.faction || 'UNKNOWN';
            const logText = `- Infusion ${found.name.toUpperCase()} palette : faction '${faction}' -`;

            this.tribalEffects.push({
                symbolKey: found.symbolKey,
                colorStr: colorStr,
                sprite: effectSprite,
                text: logText,
                startTime: performance.now(),
                duration: EFFECT_MATH_CONFIG.TRIBAL_UNLOCK.DURATION_MS
            });
        }
    }

    togglePinchEffect(isPinch) {
        this.isPinch = !!isPinch;
    }

    toggleStasisEffect(isStasis) {
        this.isStasis = !!isStasis;
    }

    drawInGamePostEffects(ctx) {
        const now = performance.now();
        
        // トライバル拡散演出
        for (let i = this.tribalEffects.length - 1; i >= 0; i--) {
            const effect = this.tribalEffects[i];
            const elapsed = now - effect.startTime;
            
            if (elapsed >= effect.duration) {
                this.tribalEffects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.duration;
            const sprite = effect.sprite;
            const config = EFFECT_MATH_CONFIG.TRIBAL_UNLOCK;
            
            if (sprite) {
                ctx.save();
                ctx.translate(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2);
                
                // スケール計算
                const scale = config.SCALE_START + (config.SCALE_ADD * Math.pow(progress, config.SCALE_POWER));
                ctx.scale(scale, scale);
                
                // アルファ計算（フェードイン -> キープ -> フェードアウト）
                let alpha = config.MAX_ALPHA;
                if (progress < config.FADE_IN_END) {
                    alpha = config.MAX_ALPHA * (progress / config.FADE_IN_END);
                } else if (progress > config.FADE_OUT_START) {
                    const remain = 1.0 - config.FADE_OUT_START;
                    alpha = config.MAX_ALPHA * (1.0 - ((progress - config.FADE_OUT_START) / remain));
                }
                ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
                
                // 合成と発光設定
                ctx.globalCompositeOperation = config.COMPOSITE_OP;
                ctx.shadowColor = effect.colorStr;
                ctx.shadowBlur = config.SHADOW_BLUR * (alpha / config.MAX_ALPHA);
                
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
                
                ctx.restore();

                // テキストログ＆グリッチ描画
                if (effect.text && progress < config.FACTION_TEXT_HIDE_START) {
                    ctx.save();
                    ctx.translate(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2);
                    ctx.font = config.FACTION_TEXT_FONT;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const textY = config.FACTION_TEXT_Y_OFFSET; // シンボルのやや下
                    
                    let isGlitch = false;
                    let drawNormal = true;
                    
                    if (progress < config.FACTION_GLITCH_IN_END || (progress >= config.FACTION_GLITCH_OUT_START && progress < config.FACTION_TEXT_HIDE_START)) {
                        isGlitch = true;
                        if (Math.random() < 0.3) drawNormal = false;
                    }
                    
                    if (isGlitch) {
                        ctx.globalCompositeOperation = 'lighter';
                        const shiftX1 = (Math.random() - 0.5) * 10;
                        const shiftX2 = (Math.random() - 0.5) * 10;
                        
                        if (Math.random() < 0.8) {
                            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                            ctx.fillText(effect.text, shiftX1, textY);
                        }
                        if (Math.random() < 0.8) {
                            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
                            ctx.fillText(effect.text, shiftX2, textY);
                        }
                        ctx.globalCompositeOperation = 'source-over';
                    }
                    
                    if (drawNormal) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillText(effect.text, 0, textY);
                    }
                    ctx.restore();
                }
            }
        }

        // 4. ヴィネット（ピンチ、ステイシス）
        // ピンチ（赤）
        const targetPinch = this.isPinch ? 1 : 0;
        this.pinchAlpha += (targetPinch - this.pinchAlpha) * 0.1; // lerp
        
        // ピンチ時はさらに明滅（パルス）させる
        let currentPinch = this.pinchAlpha;
        if (currentPinch > 0.01) {
            currentPinch *= (0.8 + 0.2 * Math.sin(now / 150)); // 150ms周期で明滅
            
            ctx.save();
            const grad = ctx.createRadialGradient(
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, 0,
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, LAYOUT_CONFIG.BASE.HEIGHT / 1.5
            );
            grad.addColorStop(0.5, 'rgba(255,0,0,0)');
            grad.addColorStop(1.0, `rgba(255,0,0,${0.4 * currentPinch})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            
            // 内側の影のような表現
            ctx.lineWidth = 50;
            ctx.strokeStyle = `rgba(255,0,0,${0.3 * currentPinch})`;
            ctx.strokeRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            ctx.restore();
        }

        // ステイシス（白）
        const targetStasis = this.isStasis ? 1 : 0;
        this.stasisAlpha += (targetStasis - this.stasisAlpha) * 0.2; // 少し速めにlerp
        
        if (this.stasisAlpha > 0.01) {
            ctx.save();
            const grad = ctx.createRadialGradient(
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, 0,
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, LAYOUT_CONFIG.BASE.HEIGHT / 1.5
            );
            grad.addColorStop(0.5, 'rgba(255,255,255,0)');
            grad.addColorStop(1.0, `rgba(255,255,255,${0.6 * this.stasisAlpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            
            ctx.lineWidth = 50;
            ctx.strokeStyle = `rgba(255,255,255,${0.4 * this.stasisAlpha})`;
            ctx.strokeRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            ctx.restore();
        }
    }

    drawPopups(ctx) {
        const now = performance.now();

        // 1. フローティングテキスト
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            if (now < ft.startTime) continue;
            
            const elapsed = now - ft.startTime;
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

        // ヴィネットは drawInGamePostEffects に移動済み

        // 2. Prism Link UI
        if (this.prismLinkState.active) {
            const state = this.prismLinkState;
            let globalAlpha = 1.0;
            const mathConf = EFFECT_MATH_CONFIG.PRISM_LINK;

            if (state.isGlitching) {
                const glitchElapsed = now - state.glitchStartTime;
                if (glitchElapsed > mathConf.GLITCH_DURATION_MS) {
                    state.active = false;
                    state.isGlitching = false;
                    state.glitchStartTime = null;
                }
            } else if (state.fadeOutStart) {
                const fadeElapsed = now - state.fadeOutStart;
                if (fadeElapsed > 500) {
                    state.active = false;
                    state.fadeOutStart = null;
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
                const baseColorId = state.baseColorId || 0;

                for (let depth = 0; depth < 7; depth++) {
                    const colorIndex = (baseColorId + depth) % 7;
                    const colorData = COLOR_CONFIG[colorIndex];
                    if (!colorData) continue;

                    const iconX = startX + depth * (conf.ICON_SIZE + conf.ICON_SPACING);
                    const iconY = conf.Y_OFFSET;

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
                            const elapsed = now - stepData.startTime;
                            if (elapsed < mathConf.DROP_DURATION_MS) {
                                const p = elapsed / mathConf.DROP_DURATION_MS;
                                scale = mathConf.MAX_SCALE - (mathConf.MAX_SCALE - 1.0) * (p * p);
                                alpha = 0.3 + 0.7 * p;
                            } else {
                                if (!stepData.hasLanded) {
                                    stepData.hasLanded = true;
                                    this.triggerScreenShake(8);
                                    if (particleManager && AppConfig.EFFECT_LEVEL === 'FULL') {
                                        particleManager.spawnBurstSparks(iconX + conf.ICON_SIZE/2, iconY + conf.ICON_SIZE/2, colorData.color, 1.5, 15, 1.5);
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
                            if (mathConf.SHOW_UNLIT_BASE === false) {
                                continue;
                            }
                            alpha = 0.15; // 未到達はワイヤーフレーム風に表示
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
                            this.outlineCtx.globalCompositeOperation = 'source-in';
                            const outFillMode = mathConf.BASE_OUTLINE_FILL_MODE || 0;
                            const outCustomColor = mathConf.BASE_OUTLINE_CUSTOM_COLOR || 'white';
                            this.outlineCtx.fillStyle = (outFillMode === 1) ? colorData.color : outCustomColor;
                            if (outFillMode !== 0) {
                                this.outlineCtx.fillRect(0, 0, cvSize, cvSize);
                            }
                            this.outlineCtx.globalCompositeOperation = 'source-over';
                        }

                        this.tempCanvas.width = conf.ICON_SIZE;
                        this.tempCanvas.height = conf.ICON_SIZE;
                        this.tempCtx.clearRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                        
                        if (fillMode === 0) {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                        } else {
                            this.tempCtx.drawImage(sprite, 0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = 'source-in';
                            this.tempCtx.fillStyle = (fillMode === 1) ? colorData.color : customColor;
                            this.tempCtx.fillRect(0, 0, conf.ICON_SIZE, conf.ICON_SIZE);
                            this.tempCtx.globalCompositeOperation = 'source-over';
                        }

                        const drawX = -conf.ICON_SIZE / 2;
                        const drawY = -conf.ICON_SIZE / 2;
                        const outDrawX = drawX - lw;
                        const outDrawY = drawY - lw;

                        if (state.isGlitching) {
                            ctx.globalCompositeOperation = 'lighter';
                            const shiftX = (Math.random() - 0.5) * 15;
                            const shiftY = (Math.random() - 0.5) * 15;
                            ctx.translate(shiftX, shiftY);
                            
                            ctx.scale(scale, scale);
                            ctx.globalAlpha = 0.8;
                            
                            if (lw > 0) {
                                ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                                ctx.shadowBlur = 5;
                                ctx.drawImage(this.outlineCanvas, outDrawX - 5, outDrawY);
                                ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
                                ctx.drawImage(this.outlineCanvas, outDrawX + 5, outDrawY);
                            }
                            
                            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                            ctx.shadowBlur = 5;
                            ctx.drawImage(this.tempCanvas, drawX - 5, drawY);
                            
                            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
                            ctx.drawImage(this.tempCanvas, drawX + 5, drawY);
                            
                            if (Math.random() < 0.5) {
                                ctx.globalCompositeOperation = 'destination-out';
                                ctx.fillStyle = 'black';
                                ctx.fillRect(-conf.ICON_SIZE, (Math.random() - 0.5) * conf.ICON_SIZE, conf.ICON_SIZE * 2, 10);
                            }
                        } else {
                            ctx.scale(scale, scale);
                            ctx.globalAlpha = globalAlpha * alpha;

                            if (lw > 0) {
                                ctx.globalCompositeOperation = mathConf.BASE_OUTLINE_COMPOSITE_OP || 'source-over';
                                ctx.shadowColor = 'transparent';
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

        // 3. Chain & Score Popup
        if (this.chainPopupState.active) {
            const cp = this.chainPopupState;
            const elapsed = now - cp.startTime;
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
                    const timeSinceUpdate = now - cp.popStartTime;
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
                if (cp.popStartTime && !cp.scoreCanvas) {
                    const popElapsed = now - cp.popStartTime;
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
                    
                    // スコア描画
                    const scaleScale = conf.SCORE_CANVAS_SCALE || 1.5;
                    const sw = displayCanvas.width * scaleScale;
                    const sh = displayCanvas.height * scaleScale;
                    
                    ctx.drawImage(displayCanvas, -sw / 2, conf.SCORE_REALTIME_Y - sh / 2, sw, sh);

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

                        ctx.font = conf.FONT_CHAIN; 
                        const mathTextRest = `\u00D7 ${chainBase}\u00B2 \u00D7 ${depthBonusStr}`; // 先頭の空白を削除しGAPで制御する
                        const mathRestWidth = ctx.measureText(mathTextRest).width;

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
                        ctx.fillStyle = '#FFD700';
                        ctx.shadowColor = '#000';
                        ctx.shadowBlur = 4;
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 4;
                        ctx.textAlign = 'left';
                        ctx.strokeText(mathTextRest, mathStartX, conf.MATH_TEXT_Y);
                        ctx.shadowBlur = 0;
                        ctx.fillText(mathTextRest, mathStartX, conf.MATH_TEXT_Y);

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
                    ctx.fillRect(-LAYOUT_CONFIG.BASE.WIDTH/2, -100, LAYOUT_CONFIG.BASE.WIDTH, 200);
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
            const elapsed = now - lu.startTime;
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
