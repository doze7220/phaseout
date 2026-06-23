import { COLOR_CONFIG } from '../core/config.js';
import { TRIBAL_EFFECT_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';

export class ScreenEffectVignette {
    constructor() {
        this.isPinch = false;
        this.pinchAlpha = 0;
        this.isStasis = false;
        this.stasisAlpha = 0;
        this.tribalEffects = [];
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
    }
}
