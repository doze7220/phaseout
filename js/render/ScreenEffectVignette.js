import { COLOR_CONFIG, GameState, AppConfig, getScoreRate } from '../core/config.js';
import { TRIBAL_EFFECT_CONFIG, BLACK_PHASE_EFFECT_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';
import { PhaseManager, PHASE_WHITE, PHASE_BLACK_ENTER, PHASE_BLACK, PHASE_BLACK_EXIT } from '../core/PhaseManager.js';
import { generateScoreData } from '../core/score.js';
import { drawScoreData, measureScoreData, drawString, measureString } from './ScoreRenderer.js';

export class ScreenEffectVignette {
    constructor() {
        this.isPinch = false;
        this.pinchAlpha = 0;
        this.isStasis = false;
        this.stasisAlpha = 0;
        this.isBlackStasis = false;
        this.blackStasisAlpha = 0;
        this.tribalEffects = [];
        this.blackPopup = { active: false, score: 0n, chainCount: 0, elapsed: 0 };
    }



    update(realDelta, gameDelta) {
        for (let i = this.tribalEffects.length - 1; i >= 0; i--) {
            const effect = this.tribalEffects[i];
            effect.elapsed += gameDelta;
            if (effect.elapsed >= effect.duration) {
                this.tribalEffects.splice(i, 1);
            }
        }

        const phase = PhaseManager.getCurrentPhaseName();
        if (phase === PHASE_BLACK) {
            this.blackPopup.active = true;
            this.blackPopup.score = GameState.blackHolePooledScore || 0n;
            this.blackPopup.chainCount = GameState.blackHoleChainCount || 0;
            this.blackPopup.elapsed = 0; // 確定待ち
        } else if (this.blackPopup.active) {
            this.blackPopup.elapsed += gameDelta;
            const uiConf = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.COUNTER_UI;
            const totalDuration = (uiConf.HOLD_MS || 1000) + (uiConf.FADEOUT_MS || 500);
            if (this.blackPopup.elapsed >= totalDuration) {
                this.blackPopup.active = false;
            }
        }
    }

    showTribalUnlockEffect(colorStr) {
        const found = COLOR_CONFIG.find(c => c.color.toUpperCase() === colorStr.toUpperCase());
        if (found && found.symbolKey) {
            const rawSprite = AssetManager.images[found.symbolKey];
            let effectSprite = null;
            
            if (rawSprite) {
                const mode = TRIBAL_EFFECT_CONFIG.TRIBAL_UNLOCK.FILL_MODE || 0;
                if (mode === 0) {
                    effectSprite = rawSprite;
                } else {
                    const fillStyle = (mode === 2) 
                        ? (TRIBAL_EFFECT_CONFIG.TRIBAL_UNLOCK.FILL_CUSTOM_COLOR || '#FFFFFF')
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
                elapsed: 0,
                duration: TRIBAL_EFFECT_CONFIG.TRIBAL_UNLOCK.DURATION_MS
            });
        }
    }

    togglePinchEffect(isPinch) {
        this.isPinch = !!isPinch;
    }

    toggleStasisEffect(isStasis, fadeMs = 500) {
        this.isStasis = !!isStasis;
        this.stasisFadeSpeed = 16.666 / Math.max(16.666, fadeMs);
    }

    toggleBlackStasisEffect(isBlackStasis, fadeMs = 500) {
        this.isBlackStasis = !!isBlackStasis;
        this.blackStasisFadeSpeed = 16.666 / Math.max(16.666, fadeMs);
    }

    drawInGamePostEffects(ctx, gameTime) {
        // トライバル拡散演出
        for (let i = this.tribalEffects.length - 1; i >= 0; i--) {
            const effect = this.tribalEffects[i];
            const elapsed = effect.elapsed;
            
            if (elapsed >= effect.duration) {
                this.tribalEffects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.duration;
            const sprite = effect.sprite;
            const config = TRIBAL_EFFECT_CONFIG.TRIBAL_UNLOCK;
            
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

        // ヴィネット（ピンチ、ステイシス）
        // ピンチ（赤）
        const targetPinch = this.isPinch ? 1 : 0;
        this.pinchAlpha += (targetPinch - this.pinchAlpha) * 0.1; // lerp
        
        // ピンチ時はさらに明滅（パルス）させる
        let currentPinch = this.pinchAlpha;
        if (currentPinch > 0.01) {
            currentPinch *= (0.8 + 0.2 * Math.sin(gameTime / 150)); // 150ms周期で明滅
            
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
        const stasisSpeed = this.stasisFadeSpeed || 0.2;
        this.stasisAlpha += (targetStasis - this.stasisAlpha) * stasisSpeed;
        
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

        // ブラックステイシス（黒ずみ）
        const targetBlackStasis = this.isBlackStasis ? 1 : 0;
        const blackStasisSpeed = this.blackStasisFadeSpeed || 0.2;
        this.blackStasisAlpha += (targetBlackStasis - this.blackStasisAlpha) * blackStasisSpeed;
        
        if (this.blackStasisAlpha > 0.01) {
            ctx.save();
            const grad = ctx.createRadialGradient(
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, 0,
                LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, LAYOUT_CONFIG.BASE.HEIGHT / 1.5
            );
            grad.addColorStop(0.5, 'rgba(0,0,0,0)');
            grad.addColorStop(1.0, `rgba(0,0,0,${0.8 * this.blackStasisAlpha})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            
            ctx.lineWidth = 50;
            ctx.strokeStyle = `rgba(0,0,0,${0.6 * this.blackStasisAlpha})`;
            ctx.strokeRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            ctx.restore();
        }

        // ブラックフェイズ専用恒常UIの描画
        if (this.blackPopup && this.blackPopup.active) {
            const config = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.COUNTER_UI;
            const cx = LAYOUT_CONFIG.BASE.WIDTH / 2;
            const cy = LAYOUT_CONFIG.BASE.HEIGHT / 2;

            ctx.save();
            
            let baseScale = 1.0;
            let opacity = 1.0;
            const phase = PhaseManager.getCurrentPhaseName();
            if (phase !== PHASE_BLACK && this.blackPopup.elapsed > 0) {
                const el = this.blackPopup.elapsed;
                const popDur = config.POP_DURATION_MS || 150;
                const popAdd = config.POP_SCALE_ADD || 0.15;
                const hold = config.HOLD_MS || 1000;
                const fadeDur = config.FADEOUT_MS || 500;
                const fadeAdd = config.FADEOUT_SCALE_ADD || 0.3;
                
                if (el < popDur) {
                    const p = Math.sin((el / popDur) * Math.PI);
                    baseScale = 1.0 + popAdd * p;
                } else if (el > hold) {
                    const p = (el - hold) / fadeDur;
                    baseScale = 1.0 + fadeAdd * p;
                    opacity = 1.0 - p;
                }
            }
            
            ctx.translate(cx, cy);
            ctx.scale(baseScale, baseScale);
            ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

            ctx.shadowColor = config.GLOW_COLOR;
            ctx.shadowBlur = config.GLOW_BLUR;
            
            // スコア（スプライト）
            const scoreValue = this.blackPopup.score || 0n;
            const isMobile = window.innerWidth <= 600;
            const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_SCORE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_SCORE;
            const scoreData = generateScoreData(scoreValue, maxDigits);
            const scoreWidth = measureScoreData(scoreData, config.SCORE_SCALE);
            const scoreX = -scoreWidth / 2;
            const scoreY = config.SCORE_Y_OFFSET;
            drawScoreData(ctx, scoreData, scoreX, scoreY, config.SCORE_SCALE);
            
            // 計算式（数式）スプライト
            const chainCount = this.blackPopup.chainCount || 0;
            const conf = LAYOUT_CONFIG.POPUPS;
            const uiConf = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE.COUNTER_UI;
            
            const rInnerW = uiConf.MATH_ROOT_INNER_WIDTH || 75;
            const rOffX = uiConf.MATH_ROOT_OFFSET_X || 0;
            const rOffY = uiConf.MATH_ROOT_OFFSET_Y || 0;
            const rH1 = uiConf.MATH_ROOT_H1 !== undefined ? uiConf.MATH_ROOT_H1 : 8;
            const rH2 = uiConf.MATH_ROOT_H2 !== undefined ? uiConf.MATH_ROOT_H2 : 26;
            const cOffX = uiConf.MATH_CHAIN_OFFSET_X || 0;
            const cOffY = uiConf.MATH_CHAIN_OFFSET_Y || 0;
            const pOffX = uiConf.MATH_POWER_OFFSET_X || 0;
            const pOffY = uiConf.MATH_POWER_OFFSET_Y || 0;
            
            // 実RATEの取得とパース
            const rateValue = BigInt(Math.floor(getScoreRate(GameState.level)));
            const rateTokens = generateScoreData(rateValue, 7);
            const rateLabelPrefix = 'char';
            const rateLabelStr = "RATE";
            const rateLabelWidth = measureString(rateLabelStr, rateLabelPrefix, conf.RATE_LABEL.SCALE_X);
            const rateValueWidth = measureScoreData(rateTokens, conf.RATE_VALUE.SCALE_X);
            const rateBlockWidth = conf.RATE_VALUE.OFFSET_X + rateValueWidth;

            // 数式テキスト
            const mathText1 = `\u00D7 `;
            const mathText2 = `${chainCount}`;
            const mathText3 = `\u00B2`;
            
            ctx.font = conf.FONT_CHAIN;
            const w1 = ctx.measureText(mathText1).width;
            const w3 = ctx.measureText(mathText3).width;
            
            const rootW1 = 6;
            const rootW2 = 12;
            const rootSymbolWidth = rootW1 + rootW2;
            const rootSymbolMargin = 5;
            
            // 全体の幅計算（ルート内は固定幅 rInnerW を使用）
            const mathRestWidth = w1 + rootSymbolWidth + rootSymbolMargin + rInnerW + w3;
            const margin = conf.MATH_GAP !== undefined ? conf.MATH_GAP : 10;
            const totalWidth = rateBlockWidth + margin + mathRestWidth;
            const startX = -totalWidth / 2;

            // RATE数値の描画
            const valX = startX + conf.RATE_VALUE.OFFSET_X;
            const mathY = config.MATH_Y_OFFSET;
            const valY = mathY + conf.RATE_VALUE.OFFSET_Y;
            drawScoreData(ctx, rateTokens, valX, valY, conf.RATE_VALUE.SCALE_X, conf.RATE_VALUE.SCALE_Y);

            // RATEラベルの描画
            const labelX = valX + rateValueWidth + conf.RATE_LABEL.OFFSET_X;
            const labelY = valY + conf.RATE_LABEL.OFFSET_Y;
            drawString(ctx, rateLabelStr, rateLabelPrefix, labelX, labelY, conf.RATE_LABEL.SCALE_X, conf.RATE_LABEL.SCALE_Y);

            // 続く数式文字列を描画
            const mathStartX = startX + rateBlockWidth + margin;
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            let curX = mathStartX;
            
            // "x "
            ctx.fillStyle = '#FFD700';
            ctx.strokeText(mathText1, curX, mathY);
            ctx.fillText(mathText1, curX, mathY);
            curX += w1;

            // √ ベクター描画
            const rootBaseY = mathY + 12 + rOffY;
            const rootDrawX = curX + rOffX;
            
            ctx.beginPath();
            ctx.moveTo(rootDrawX, rootBaseY - rH1);
            ctx.lineTo(rootDrawX + rootW1, rootBaseY);
            ctx.lineTo(rootDrawX + rootW1 + rootW2, rootBaseY - rH2);
            ctx.lineTo(rootDrawX + rootW1 + rootW2 + rInnerW + 5, rootBaseY - rH2); // 固定幅の横線

            ctx.lineJoin = 'miter';
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#000';
            ctx.stroke();
            
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#FFD700';
            ctx.stroke();
            
            curX += rootSymbolWidth + rootSymbolMargin;

            // チェイン数（ルートの中身）
            const chainDrawX = curX + (rInnerW / 2) + cOffX;
            const chainDrawY = mathY + cOffY;
            ctx.textAlign = 'center';
            ctx.strokeText(mathText2, chainDrawX, chainDrawY);
            ctx.fillText(mathText2, chainDrawX, chainDrawY);
            ctx.textAlign = 'left';
            
            curX += rInnerW; // 固定幅分進める

            // "²"
            const powerDrawX = curX + pOffX;
            const powerDrawY = mathY + pOffY;
            ctx.strokeText(mathText3, powerDrawX, powerDrawY);
            ctx.fillText(mathText3, powerDrawX, powerDrawY);

            // チェイン（Canvasテキスト）
            ctx.font = conf.FONT_CHAIN;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;

            const chainStr = `${chainCount} Chain`;
            const chainY = config.CHAIN_Y_OFFSET;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(chainStr, 0, chainY);
            ctx.shadowBlur = 40;
            ctx.fillText(chainStr, 0, chainY);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText(chainStr, 0, chainY);
            ctx.fillText(chainStr, 0, chainY);
            
            ctx.restore();
        }
    }

    drawFrontEffects(ctx) {
        const phase = PhaseManager.getCurrentPhaseName();
        let ratio = 0;
        let globalAlpha = 1.0;
        
        if (phase === PHASE_WHITE) {
            ratio = Math.max(0.0, Math.min(1.0, (PhaseManager.breakGauge || 0) / 1000));
        } else if (phase === PHASE_BLACK_ENTER) {
            ratio = 1.0;
        } else if (phase === PHASE_BLACK || phase === PHASE_BLACK_EXIT) {
            // ブラックアウト以降は亀裂を完全に描画しない
            ratio = 0.0;
        }

        if (ratio > 0 && globalAlpha > 0 && GameState.currentCrackSetKey && BLACK_PHASE_EFFECT_CONFIG.CRACK_SETS) {
            const set = BLACK_PHASE_EFFECT_CONFIG.CRACK_SETS[GameState.currentCrackSetKey];
            if (set) {
                // ゼロ除算ガード付きの動的ステップ計算
                const step = (set.maxThreshold - set.minThreshold) / Math.max(1, set.sequenceCount - 1);
                let seqNum = 0;
                
                if (ratio >= set.minThreshold) {
                    seqNum = 1 + Math.floor((ratio - set.minThreshold) / step);
                    if (seqNum > set.sequenceCount) seqNum = set.sequenceCount;
                }
                
                if (seqNum > 0) {
                    const imgKey = `${GameState.currentCrackSetKey}_${String(seqNum).padStart(2, '0')}`;
                    const img = AssetManager.images[imgKey];
                    if (img) {
                        ctx.save();
                        ctx.globalAlpha = globalAlpha;
                        ctx.globalCompositeOperation = set.compositeOp || 'multiply';
                        ctx.drawImage(img, 0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
                        ctx.restore();
                    }
                }
            }
        }
    }
}
