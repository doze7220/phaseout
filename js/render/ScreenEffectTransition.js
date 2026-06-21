import { EFFECT_MATH_CONFIG, THEME_COLORS } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { PhaseManager } from '../core/PhaseManager.js';

export class ScreenEffectTransition {
    constructor() {
        this.whiteFlashState = { active: false, elapsed: 0, duration: 2000 };
    }

    update(realDelta, gameDelta) {
        if (this.whiteFlashState.active) {
            this.whiteFlashState.elapsed += gameDelta;
            if (this.whiteFlashState.elapsed >= this.whiteFlashState.duration) {
                this.whiteFlashState.active = false;
            }
        }
    }

    triggerWhiteFlash() {
        this.whiteFlashState.active = true;
        this.whiteFlashState.elapsed = 0;
    }

    drawGlobalPostEffects(ctx) {
        if (PhaseManager.getCurrentPhaseName() === 'ホワイト突入演出中') {
            this.drawPhaseWhiteEnter(ctx, PhaseManager.stateTimer);
        } else if (PhaseManager.getCurrentPhaseName() === 'ホワイト解除演出中') {
            this.drawPhaseWhiteExit(ctx, PhaseManager.stateTimer);
        }

        // PhaseShift - White Flash
        if (this.whiteFlashState.active) {
            const elapsed = this.whiteFlashState.elapsed;
            if (elapsed < this.whiteFlashState.duration) {
                let progress = elapsed / this.whiteFlashState.duration;
                let flashAlpha = 0;
                // Fade in (0 -> 1) in first 10%, Fade out (1 -> 0) in rest 90%
                if (progress < 0.1) {
                    flashAlpha = progress / 0.1;
                } else {
                    flashAlpha = 1.0 - ((progress - 0.1) / 0.9);
                }
                
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
                ctx.restore();
            }
        }
    }

    drawPhaseWhiteEnter(ctx, elapsed) {
        const conf = EFFECT_MATH_CONFIG.PHASE_WHITE;
        const centerX = LAYOUT_CONFIG.BASE.WIDTH / 2;
        const centerY = LAYOUT_CONFIG.BASE.HEIGHT / 2;

        const timeStasis = conf.STASIS_DELAY_MS;
        const timeTribal = timeStasis + conf.TRIBAL_TOTAL_MS;
        const timeIn = timeTribal + conf.TRANSITION_IN_EXPAND_MS;
        const timeOut = timeIn + conf.TRANSITION_OUT_WIPE_MS;

        const weights = conf.TRIBAL_WEIGHTS;
        const totalWeight = weights.DRAW + weights.THICKEN + weights.WAIT + weights.FADE;
        const dDraw = conf.TRIBAL_TOTAL_MS * (weights.DRAW / totalWeight);
        const dThick = conf.TRIBAL_TOTAL_MS * (weights.THICKEN / totalWeight);
        const dWait = conf.TRIBAL_TOTAL_MS * (weights.WAIT / totalWeight);
        const dFade = conf.TRIBAL_TOTAL_MS * (weights.FADE / totalWeight);

        const timeDrawEnd = timeStasis + dDraw;
        const timeThickEnd = timeDrawEnd + dThick;
        const timeWaitEnd = timeThickEnd + dWait;

        const outerR = conf.TRIBAL_RADIUS_OUTER !== undefined ? conf.TRIBAL_RADIUS_OUTER : 150;
        const innerR = conf.TRIBAL_RADIUS_INNER !== undefined ? conf.TRIBAL_RADIUS_INNER : 54;
        const radiusStep = (outerR - innerR) / 6;

        // 赤・橙・黄・緑・水・青・紫の順
        const spectralColors = [
            THEME_COLORS.RED, THEME_COLORS.ORANGE, THEME_COLORS.YELLOW,
            THEME_COLORS.GREEN, THEME_COLORS.CYAN, THEME_COLORS.BLUE, THEME_COLORS.PURPLE
        ];

        ctx.save();

        if (elapsed < timeStasis) {
            // 無音・タメ
        } else if (elapsed < timeTribal) {
            // [2] トライバル展開・定着・発光
            let expandProgress = 0;
            let thickProgress = 0;
            let fadeProgress = 0;

            if (elapsed < timeDrawEnd) {
                const p = (elapsed - timeStasis) / dDraw;
                expandProgress = 1.0 - Math.pow(1.0 - p, 3); // Ease-out
            } else {
                expandProgress = 1.0;
                if (elapsed < timeThickEnd) {
                    thickProgress = (elapsed - timeDrawEnd) / dThick;
                } else {
                    thickProgress = 1.0;
                    if (elapsed >= timeWaitEnd) {
                        fadeProgress = Math.min(1.0, (elapsed - timeWaitEnd) / dFade);
                    }
                }
            }

            const colorBlend = Math.pow(fadeProgress, 4);

            for (let i = 0; i < 7; i++) {
                // 開始位置は0度(-Math.PI / 2)を基準に51.4度ずつずれる（頂点が赤(i=0)、時計回り）
                const startAngle = -Math.PI / 2 + (Math.PI * 2 / 7) * i;
                
                // 左右両方に向かってラインを引く
                const drawSpread = Math.PI * expandProgress;
                const currentStart = startAngle - drawSpread;
                const currentEnd = startAngle + drawSpread;

                // 隙間を2px保つための最大線幅
                const maxLineWidth = Math.max(1, radiusStep - 2);

                const circleRadius = outerR - i * radiusStep;
                const currentLineWidth = 4 + (maxLineWidth - 4) * thickProgress;

                const baseColorStr = spectralColors[i];
                const rBase = parseInt(baseColorStr.slice(1,3), 16);
                const gBase = parseInt(baseColorStr.slice(3,5), 16);
                const bBase = parseInt(baseColorStr.slice(5,7), 16);

                const r = Math.floor(rBase + (255 - rBase) * colorBlend);
                const g = Math.floor(gBase + (255 - gBase) * colorBlend);
                const b = Math.floor(bBase + (255 - bBase) * colorBlend);
                const drawColor = `rgb(${r}, ${g}, ${b})`;

                if (drawSpread > 0) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, circleRadius, currentStart, currentEnd);
                    ctx.lineWidth = currentLineWidth;
                    ctx.strokeStyle = drawColor;
                    
                    if (fadeProgress > 0) {
                        ctx.shadowColor = drawColor;
                        ctx.shadowBlur = 15 * fadeProgress;
                    } else {
                        ctx.shadowBlur = 0;
                    }
                    ctx.stroke();
                }
            }
        } else if (elapsed < timeIn) {
            // 大膨張トランジション・イン
            const p = (elapsed - timeTribal) / conf.TRANSITION_IN_EXPAND_MS;
            // 徐々に遅くなる加速度
            const expP = 1.0 - Math.pow(1.0 - p, 3);
            
            for (let i = 0; i < 7; i++) {
                // 外側が最も早く、内側が最も遅い
                const speedFactor = 1.0 - (i * 0.1); 
                
                const baseRadius = outerR - i * radiusStep;
                const maxLineWidth = Math.max(1, radiusStep - 2);
                
                const circleRadius = baseRadius + 1500 * expP * speedFactor;
                const currentLineWidth = maxLineWidth + 1000 * expP * speedFactor;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, Math.max(0, circleRadius), 0, Math.PI * 2);
                ctx.lineWidth = currentLineWidth;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                if (i === 6) {
                    // 一番内側の円は内縁を縮小させて内側を塗りつぶす
                    const fillR = Math.max(0, circleRadius - currentLineWidth / 2);
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, fillR, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                }
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, p * 2)})`;
            ctx.fillRect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);

        } else if (elapsed < timeOut) {
            // 透明ワイプ・波紋トランジション・アウト
            const p = (elapsed - timeIn) / conf.TRANSITION_OUT_WIPE_MS;
            const expP = 1.0 - Math.pow(1.0 - p, 3);
            
            const maxR = 1200;
            const currentR = maxR * expP;
            
            // 画面全体を白く塗りつつ、中央に透明な穴を開ける（下層のパズル画面を露出させる）
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            // 矩形を時計回りに描画
            ctx.rect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            // 穴を反時計回りに描画して切り抜く
            ctx.arc(centerX, centerY, Math.max(0, currentR), 0, Math.PI * 2, true);
            ctx.fill();
            
            const ripples = [
                { offset: 0, width: 20 },
                { offset: 50, width: 10 },
                { offset: 120, width: 5 }
            ];
            
            for (const r of ripples) {
                const rR = currentR - r.offset;
                if (rR > 0) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, rR, 0, Math.PI * 2);
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = r.width;
                    ctx.stroke();
                }
            }
        }

        ctx.restore();

        // --- ログの独立描画（トライバル開始からLOG_TOTAL_MSの間） ---
        if (elapsed >= 0 && elapsed <= conf.LOG_TOTAL_MS) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.font = '16px monospace, "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const glitchDuration = 200;
            const glitchStart = conf.LOG_TOTAL_MS - glitchDuration;
            let isGlitch = false;
            
            if (elapsed >= glitchStart) {
                isGlitch = true;
                // X軸のみシェイク
                ctx.translate((Math.random() - 0.5) * 15, 0);
            }

            const logBaseY = conf.LOG_POS_Y !== undefined ? conf.LOG_POS_Y : centerY - 40;

            conf.LOG_TIMINGS.forEach((log, index) => {
                const targetTime = conf.LOG_TOTAL_MS * log.weight;
                if (elapsed >= targetTime) {
                    let alphaProgress = Math.min(1.0, (elapsed - targetTime) / 200);
                    let fontColor = `rgba(255, 255, 255, ${alphaProgress})`;
                    
                    if (isGlitch) {
                        alphaProgress *= 1.0 - ((elapsed - glitchStart) / glitchDuration);
                        const r = Math.random();
                        if (r > 0.6) fontColor = `rgba(0, 255, 255, ${alphaProgress})`;
                        else if (r > 0.3) fontColor = `rgba(255, 0, 255, ${alphaProgress})`;
                        else fontColor = `rgba(255, 255, 255, ${alphaProgress})`;
                    }
                    
                    const yOffset = log.offsetY !== undefined ? log.offsetY : index * 24;

                    // 黒縁取り
                    ctx.strokeStyle = `rgba(0, 0, 0, ${alphaProgress})`;
                    ctx.lineWidth = 4;
                    ctx.strokeText(log.text, centerX, logBaseY + yOffset);

                    ctx.fillStyle = fontColor;
                    ctx.fillText(log.text, centerX, logBaseY + yOffset);
                }
            });
            ctx.restore();
        }
    }

    drawPhaseWhiteExit(ctx, elapsed) {
        const conf = EFFECT_MATH_CONFIG.PHASE_WHITE_EXIT;
        if (!conf) return;

        const centerX = LAYOUT_CONFIG.BASE.WIDTH / 2;
        const centerY = LAYOUT_CONFIG.BASE.HEIGHT / 2;

        const timeStasis = conf.STASIS_DELAY_MS;
        const timeTribal = timeStasis + conf.TRIBAL_TOTAL_MS;
        const timeOut = timeTribal + conf.TRANSITION_OUT_WIPE_MS;

        const weights = conf.TRIBAL_WEIGHTS;
        const totalWeight = weights.FADE + (weights.WAIT_1 || 0) + weights.THICKEN + (weights.WAIT_2 || 0) + weights.DRAW + (weights.WAIT_3 || 0);
        const dFade = conf.TRIBAL_TOTAL_MS * (weights.FADE / totalWeight);
        const dWait1 = conf.TRIBAL_TOTAL_MS * ((weights.WAIT_1 || 0) / totalWeight);
        const dThick = conf.TRIBAL_TOTAL_MS * (weights.THICKEN / totalWeight);
        const dWait2 = conf.TRIBAL_TOTAL_MS * ((weights.WAIT_2 || 0) / totalWeight);
        const dDraw = conf.TRIBAL_TOTAL_MS * (weights.DRAW / totalWeight);
        const dWait3 = conf.TRIBAL_TOTAL_MS * ((weights.WAIT_3 || 0) / totalWeight);

        const timeFadeEnd = timeStasis + dFade;
        const timeWait1End = timeFadeEnd + dWait1;
        const timeThickEnd = timeWait1End + dThick;
        const timeWait2End = timeThickEnd + dWait2;
        const timeDrawEnd = timeWait2End + dDraw;

        const outerR = conf.TRIBAL_RADIUS_OUTER !== undefined ? conf.TRIBAL_RADIUS_OUTER : 150;
        const innerR = conf.TRIBAL_RADIUS_INNER !== undefined ? conf.TRIBAL_RADIUS_INNER : 54;
        const radiusStep = (outerR - innerR) / 6;

        const spectralColors = [
            THEME_COLORS.RED, THEME_COLORS.ORANGE, THEME_COLORS.YELLOW,
            THEME_COLORS.GREEN, THEME_COLORS.CYAN, THEME_COLORS.BLUE, THEME_COLORS.PURPLE
        ];

        ctx.save();

        if (elapsed < timeStasis) {
            // ステイシス待機
        } else if (elapsed < timeTribal) {
            // トライバル逆再生
            let wipeProgress = 0;   // 0.0 -> 1.0 (外から定位置へのワイプイン進行度)
            let thinProgress = 0;   // 0.0 -> 1.0 (太いドーナツから細いラインへの進行度)
            let shrinkProgress = 0; // 0.0 -> 1.0 (ラインが縮んで消失する進行度)
            let colorBlend = 1.0;   // 1.0(白) -> 0.0(本来の色)

            if (elapsed < timeFadeEnd) {
                // ワイプイン
                wipeProgress = (elapsed - timeStasis) / dFade;
            } else if (elapsed < timeWait1End) {
                // 待機1
                wipeProgress = 1.0;
            } else if (elapsed < timeThickEnd) {
                // ライン化＆色戻り
                wipeProgress = 1.0;
                thinProgress = (elapsed - timeWait1End) / dThick;
                colorBlend = 1.0 - thinProgress;
            } else if (elapsed < timeWait2End) {
                // 待機2
                wipeProgress = 1.0;
                thinProgress = 1.0;
                colorBlend = 0.0;
            } else if (elapsed < timeDrawEnd) {
                // 消失
                wipeProgress = 1.0;
                thinProgress = 1.0;
                colorBlend = 0.0;
                shrinkProgress = (elapsed - timeWait2End) / dDraw;
            } else {
                // 待機3
                wipeProgress = 1.0;
                thinProgress = 1.0;
                colorBlend = 0.0;
                shrinkProgress = 1.0;
            }
            
            // shrinkProgress にイージング(ease-in)
            shrinkProgress = Math.pow(shrinkProgress, 3);
            
            // colorBlend は少し強めに白が残るように調整
            colorBlend = Math.pow(colorBlend, 2);

            for (let i = 0; i < 7; i++) {
                const startAngle = -Math.PI / 2 + (Math.PI * 2 / 7) * i;
                
                // 描画角度: 1.0(完全円) から 0.0(消失) へ
                const drawSpread = Math.PI * (1.0 - shrinkProgress);
                const currentStart = startAngle - drawSpread;
                const currentEnd = startAngle + drawSpread;

                const maxLineWidth = Math.max(1, radiusStep - 2);
                let currentR = outerR - i * radiusStep;
                
                // ワイプインの個別計算：内側(i=6)ほど早く定位置に到達する
                // 到達に必要な進行度を 0.6(内側) 〜 1.0(外側) とする
                const durationP = 0.6 + (0.4 * (6 - i) / 6);
                let localWipeP = Math.min(1.0, wipeProgress / durationP);
                
                // 加速度違いでワイプイン (Ease Out Cubic)
                const easeOutP = 1.0 - Math.pow(1.0 - localWipeP, 3);
                const wipeIn = 1.0 - easeOutP; // 1.0(外) -> 0.0(定位置)
                
                currentR += 2000 * wipeIn;
                
                const baseLineWidth = 4 + (maxLineWidth - 4) * (1.0 - thinProgress);
                const currentLineWidth = baseLineWidth + 1000 * wipeIn;

                const baseColorStr = spectralColors[i];
                const rBase = parseInt(baseColorStr.slice(1,3), 16);
                const gBase = parseInt(baseColorStr.slice(3,5), 16);
                const bBase = parseInt(baseColorStr.slice(5,7), 16);

                const r = Math.floor(rBase + (255 - rBase) * colorBlend);
                const g = Math.floor(gBase + (255 - gBase) * colorBlend);
                const b = Math.floor(bBase + (255 - bBase) * colorBlend);
                const drawColor = `rgb(${r}, ${g}, ${b})`;

                if (drawSpread > 0) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, currentR, currentStart, currentEnd);
                    ctx.lineWidth = currentLineWidth;
                    ctx.strokeStyle = drawColor;
                    
                    if (colorBlend < 1.0 && colorBlend > 0.0) {
                        ctx.shadowColor = drawColor;
                        ctx.shadowBlur = 15 * colorBlend;
                    } else if (colorBlend === 1.0) {
                        ctx.shadowColor = '#ffffff';
                        ctx.shadowBlur = 20;
                    } else {
                        ctx.shadowBlur = 0;
                    }
                    ctx.stroke();
                    
                    // 描画のみ（穴埋めによる白フラッシュを防止）
                }
            }
            
            // ワイプイン時の画面全体の白飛びは仕様変更により削除

        } else if (elapsed < timeOut) {
            // トランジションアウト（ステイシスエフェクトを中心から円形に抜く）
            const p = (elapsed - timeTribal) / conf.TRANSITION_OUT_WIPE_MS;
            const expP = 1.0 - Math.pow(1.0 - p, 3);
            
            const maxR = 1200;
            const currentR = maxR * expP;
            
            ctx.save();
            // 下層（カラー描画された宝石）をグレースケール化するオーバーレイ
            ctx.globalCompositeOperation = 'color';
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.rect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            // 中心を抜く（逆時計回りでパスを作成）
            ctx.arc(centerX, centerY, Math.max(0, currentR), 0, Math.PI * 2, true);
            ctx.fill();
            
            // 明るさを上げる効果（brightness 1.2 相当）も同様に適用
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'rgba(50, 50, 50, 1.0)';
            ctx.beginPath();
            ctx.rect(0, 0, LAYOUT_CONFIG.BASE.WIDTH, LAYOUT_CONFIG.BASE.HEIGHT);
            ctx.arc(centerX, centerY, Math.max(0, currentR), 0, Math.PI * 2, true);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();

        // --- ログの独立描画（トライバル逆再生の期間） ---
        if (elapsed >= 0 && elapsed <= conf.LOG_TOTAL_MS) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.font = '16px monospace, "Courier New"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const glitchDuration = 200;
            const glitchStart = conf.LOG_TOTAL_MS - glitchDuration;
            let isGlitch = false;
            
            if (elapsed >= glitchStart) {
                isGlitch = true;
                ctx.translate((Math.random() - 0.5) * 15, 0);
            }

            const logBaseY = conf.LOG_POS_Y !== undefined ? conf.LOG_POS_Y : centerY - 40;

            conf.LOG_TIMINGS.forEach((log, index) => {
                const targetTime = conf.LOG_TOTAL_MS * log.weight;
                if (elapsed >= targetTime) {
                    let alphaProgress = Math.min(1.0, (elapsed - targetTime) / 200);
                    let fontColor = `rgba(255, 255, 255, ${alphaProgress})`;
                    
                    if (isGlitch) {
                        alphaProgress *= 1.0 - ((elapsed - glitchStart) / glitchDuration);
                        const r = Math.random();
                        if (r > 0.6) fontColor = `rgba(0, 255, 255, ${alphaProgress})`;
                        else if (r > 0.3) fontColor = `rgba(255, 0, 255, ${alphaProgress})`;
                        else fontColor = `rgba(255, 255, 255, ${alphaProgress})`;
                    }
                    
                    const yOffset = log.offsetY !== undefined ? log.offsetY : index * 24;

                    ctx.strokeStyle = `rgba(0, 0, 0, ${alphaProgress})`;
                    ctx.lineWidth = 4;
                    ctx.strokeText(log.text, centerX, logBaseY + yOffset);

                    ctx.fillStyle = fontColor;
                    ctx.fillText(log.text, centerX, logBaseY + yOffset);
                }
            });
            ctx.restore();
        }
    }
}
