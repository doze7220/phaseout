import { COLOR_CONFIG, GameState } from '../core/config.js';
import { TRIBAL_EFFECT_CONFIG, BLACK_PHASE_EFFECT_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';
import { PhaseManager, PHASE_WHITE, PHASE_BLACK_ENTER, PHASE_BLACK, PHASE_BLACK_EXIT } from '../core/PhaseManager.js';

export class ScreenEffectVignette {
    constructor() {
        this.isPinch = false;
        this.pinchAlpha = 0;
        this.isStasis = false;
        this.stasisAlpha = 0;
        this.tribalEffects = [];
        this.cracks = this.generateCracks(BLACK_PHASE_EFFECT_CONFIG.CRACK_MAX_COUNT || 10);
    }

    generateCracks(count) {
        const cracks = [];
        const w = LAYOUT_CONFIG.BASE.WIDTH;
        const h = LAYOUT_CONFIG.BASE.HEIGHT;
        const cx = w / 2;
        const cy = h / 2;

        for (let i = 0; i < count; i++) {
            const edge = Math.floor(Math.random() * 4);
            let sx, sy;
            if (edge === 0) { sx = Math.random() * w; sy = 0; }
            else if (edge === 1) { sx = w; sy = Math.random() * h; }
            else if (edge === 2) { sx = Math.random() * w; sy = h; }
            else { sx = 0; sy = Math.random() * h; }

            const points = [];
            points.push({ x: sx, y: sy });

            const config = BLACK_PHASE_EFFECT_CONFIG;
            const stepsMin = config.CRACK_SEGMENTS_MIN || 5;
            const stepsMax = config.CRACK_SEGMENTS_MAX || 9;
            const steps = stepsMin + Math.floor(Math.random() * (stepsMax - stepsMin + 1)); // segments
            
            const lengthRatio = config.CRACK_LENGTH_RATIO || 0.5;

            for (let j = 1; j <= steps; j++) {
                const t = (j / steps) * lengthRatio;
                let bx = sx + (cx - sx) * t;
                let by = sy + (cy - sy) * t;
                
                if (j === steps) {
                    // 先端を少しばらけさせる
                    const offset = config.CRACK_CENTER_OFFSET || 50;
                    bx += (Math.random() - 0.5) * offset;
                    by += (Math.random() - 0.5) * offset;
                } else {
                    const noiseMax = config.CRACK_NOISE_MAX || 30;
                    bx += (Math.random() - 0.5) * noiseMax;
                    by += (Math.random() - 0.5) * noiseMax;
                }
                points.push({ x: bx, y: by });
            }
            cracks.push(points);
        }
        return cracks;
    }

    update(realDelta, gameDelta) {
        for (let i = this.tribalEffects.length - 1; i >= 0; i--) {
            const effect = this.tribalEffects[i];
            effect.elapsed += gameDelta;
            if (effect.elapsed >= effect.duration) {
                this.tribalEffects.splice(i, 1);
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

    toggleStasisEffect(isStasis) {
        this.isStasis = !!isStasis;
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

        // ブラックフェイズ演出 (Layer 6 に描画することで、宝石を覆い隠しつつUIの下に描画される)
        const phase = PhaseManager.getCurrentPhaseName();
        if (phase === PHASE_BLACK_ENTER || phase === PHASE_BLACK || phase === PHASE_BLACK_EXIT) {
            ctx.save();
            let fadeAlpha = 1.0;
            if (phase === PHASE_BLACK_ENTER) {
                fadeAlpha = PhaseManager.stateTimer / BLACK_PHASE_EFFECT_CONFIG.ENTER_MS;
            } else if (phase === PHASE_BLACK_EXIT) {
                fadeAlpha = 1.0 - (PhaseManager.stateTimer / BLACK_PHASE_EFFECT_CONFIG.EXIT_MS);
            }
            fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));

            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);

            if (phase === PHASE_BLACK) {
                // 特異点（ブラックホール）の描画
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const gaugeRatio = Math.max(0, PhaseManager.breakGauge / 1000);
                const rMin = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE_RADIUS_MIN || 1;
                const rMax = BLACK_PHASE_EFFECT_CONFIG.BLACK_HOLE_RADIUS_MAX || 100;
                const baseRadius = rMin + (rMax - rMin) * gaugeRatio;
                const radius = baseRadius + (GameState.blackHoleVisualPulse || 0);
                ctx.arc(LAYOUT_CONFIG.BASE.WIDTH / 2, LAYOUT_CONFIG.BASE.HEIGHT / 2, Math.max(1, radius), 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    drawFrontEffects(ctx) {
        const phase = PhaseManager.getCurrentPhaseName();
        let crackLevel = 0;
        let globalAlpha = 1.0;
        const maxCracks = BLACK_PHASE_EFFECT_CONFIG.CRACK_MAX_COUNT || 10;
        
        if (phase === PHASE_WHITE) {
            crackLevel = (PhaseManager.breakGauge || 0) / (1000 / maxCracks);
        } else if (phase === PHASE_BLACK_ENTER || phase === PHASE_BLACK) {
            crackLevel = maxCracks; // 拡縮はせず維持
        } else if (phase === PHASE_BLACK_EXIT) {
            crackLevel = maxCracks;
            globalAlpha = Math.max(0.0, 1.0 - (PhaseManager.stateTimer / BLACK_PHASE_EFFECT_CONFIG.EXIT_MS));
        }

        if (crackLevel > 0 && globalAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = globalAlpha;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = BLACK_PHASE_EFFECT_CONFIG.CRACK_WIDTH_MAX;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            for (let i = 0; i < this.cracks.length; i++) {
                if (i >= crackLevel) break;

                const points = this.cracks[i];
                let drawRatio = 1.0;
                if (i + 1 > crackLevel) {
                    drawRatio = crackLevel - i; // 0.0 ~ 1.0 (先端の伸び具合)
                }

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);

                let totalSegments = points.length - 1;
                let segmentsToDraw = totalSegments * drawRatio;

                for (let j = 0; j < totalSegments; j++) {
                    if (j + 1 <= segmentsToDraw) {
                        ctx.lineTo(points[j+1].x, points[j+1].y);
                    } else if (j < segmentsToDraw) {
                        const t = segmentsToDraw - j;
                        const px = points[j].x + (points[j+1].x - points[j].x) * t;
                        const py = points[j].y + (points[j+1].y - points[j].y) * t;
                        ctx.lineTo(px, py);
                    }
                }
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}
