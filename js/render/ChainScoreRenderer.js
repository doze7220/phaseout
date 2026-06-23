import { generateScoreData, calculateChainScore } from '../core/score.js';
import { AppConfig, GameState, getScoreRate, CORE_MATH_CONFIG } from '../core/config.js';
import { EFFECT_MATH_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { createScoreCanvas, drawString, measureString, measureScoreData, drawScoreData } from './ScoreRenderer.js';
import { PhaseManager } from '../core/PhaseManager.js';

export class ChainScoreRenderer {
    constructor() {
        this.chainPopupState = { 
            active: false, 
            count: 0, 
            color: '', 
            scoreCanvas: null, 
            elapsed: 0, 
            duration: 1500, 
            popElapsed: null 
        };
    }

    update(gameDelta) {
        if (this.chainPopupState.active) {
            this.chainPopupState.elapsed += gameDelta;
            if (this.chainPopupState.popElapsed !== null) {
                this.chainPopupState.popElapsed += gameDelta;
            }
        }
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
    }

    showScorePopup(points) {
        if (this.chainPopupState.active) {
            this.chainPopupState.scoreCanvas = createScoreCanvas(points);
            this.chainPopupState.elapsed = 0;
            this.chainPopupState.duration = 1500;
        }
    }

    draw(ctx) {
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
    }
}
