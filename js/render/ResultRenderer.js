// ResultRenderer.js
import { GameState, COLOR_CONFIG, AppConfig, EFFECT_MATH_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UIManager } from '../core/UIManager.js';
import { generateScoreData } from '../core/score.js';
import { drawScoreData } from './ScoreRenderer.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { soundManager } from './SoundManager.js';
import { SceneManager } from '../core/SceneManager.js';
import { TitleScene } from '../scene/TitleScene.js';
import * as effects from './effects.js';

class ResultRendererClass {
    constructor() {
        this.resetState();
    }

    resetState() {
        this.elapsed = 0;
        this.statsLines = [];
        this.totalDisrupt = 0;
        
        // Animation States
        this.phase = 'INIT'; // INIT -> DRUMROLL -> DONE
        this.skipRequested = false;
        this.animDuration = 2000; // Drumroll takes 2s
        this.timeSinceDone = 0;
        this.isGlitching = false;
        this.glitchElapsed = 0;
    }

    startResult() {
        this.resetState();
        
        let totalCount = 0;
        this.statsLines = [];
        
        COLOR_CONFIG.forEach(cConfig => {
            const color = cConfig.color;
            if (!GameState.activeColors.includes(color) && !GameState.stats[color]) return;
            
            const count = GameState.stats[color] || 0;
            const score = GameState.totalScorePerColor[color] || 0n;
            totalCount += count;
            
            this.statsLines.push({
                color: color,
                count: count,
                score: score,
                skill: 0n // +0
            });
        });

        this.totalDisrupt = totalCount;
        this.totalScore = GameState.actualScore;
        this.maxChain = GameState.maxChain;
        this.maxChainColor = GameState.maxChainColor;
        this.maxScorePerTap = GameState.maxScorePerTap;
        this.maxScoreColor = GameState.maxScoreColor;
        this.level = GameState.level;
        this.playTimeMs = GameState.playTimeMs;
    }

    update(realDelta, gameDelta) {
        if (GameState.currentScene !== 'RESULT') return;
        
        this.elapsed += gameDelta;
        
        if (this.phase === 'DONE') {
            this.timeSinceDone += gameDelta;
        }
        if (this.isGlitching) {
            this.glitchElapsed += gameDelta;
        }
        
        const isAnimEnabled = AppConfig.RESULT_ANIMATION;
        
        if (this.phase === 'INIT') {
            if (!isAnimEnabled) {
                this.phase = 'DONE';
                this.timeSinceDone = 0;
                this.isGlitching = true;
                this.glitchElapsed = 0;
                soundManager.playSE('BREAK_BURST');
            } else {
                this.phase = 'DRUMROLL';
            }
        }
        
        if (this.phase === 'DRUMROLL') {
            if (this.skipRequested || this.elapsed > this.animDuration) {
                this.phase = 'DONE';
                this.timeSinceDone = 0;
                this.isGlitching = true;
                this.glitchElapsed = 0;
                soundManager.playSE('BREAK_BURST');
            }
        }
    }

    draw(ctx) {
        if (GameState.currentScene !== 'RESULT') {
            UIManager.deactivateButton('resultTapAnywhere');
            return;
        }

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;
        const elapsed = this.elapsed;
        
        const isAnimEnabled = AppConfig.RESULT_ANIMATION;
        
        // --- Calculate Progress ---
        let progress = 1.0;
        if (this.phase === 'DRUMROLL') {
            progress = Math.min(1.0, Math.max(0, elapsed / this.animDuration));
            // Ease out quad
            progress = 1 - (1 - progress) * (1 - progress);
        }

        const conf = LAYOUT_CONFIG.RESULT_SCENE;
        const frameW = width * conf.FRAME_WIDTH_RATIO;
        const centerX = width / 2;
        const centerY = height / 2;

        const scoreWallInfo = this.calculateScoreWallHeight(frameW - 80);
        
        const topGap = conf.FRAME_TOP_GAP;
        const gap3 = conf.GAP_WALL_TO_SUMMARY;
        const summaryHeight = conf.SUMMARY_HEIGHT; 
        const gap4 = conf.GAP_SUMMARY_TO_TABLE;
        const rowHeight = conf.TABLE_ROW_HEIGHT;
        const tableHeight = rowHeight * conf.TABLE_RESERVED_ROWS + conf.TABLE_PADDING; 
        const bottomGap = conf.FRAME_BOTTOM_GAP;

        const contentHeight = topGap + conf.TITLE_FINAL_SCORE_Y_OFFSET + scoreWallInfo.drawHeight + gap3 + summaryHeight + gap4 + tableHeight + bottomGap;
        const frameH = Math.min(height * conf.FRAME_MAX_HEIGHT_RATIO, contentHeight);

        const frameX = centerX - frameW / 2;
        const frameY = centerY - frameH / 2;

        const topStartY = frameY + topGap;
        const scoreWallStartY = topStartY + conf.TITLE_FINAL_SCORE_Y_OFFSET;
        const summaryStartY = scoreWallStartY + scoreWallInfo.drawHeight + gap3;
        const tableStartY = summaryStartY + summaryHeight + gap4;

        let targetCtx = ctx;
        if (this.isGlitching) {
            if (!this.glitchCanvas) {
                this.glitchCanvas = document.createElement('canvas');
            }
            this.glitchCanvas.width = width;
            this.glitchCanvas.height = height;
            targetCtx = this.glitchCanvas.getContext('2d');
            targetCtx.clearRect(0, 0, width, height);
        }

        // --- Render Background ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        this.drawCyberFrame(targetCtx, frameX, frameY, frameW, frameH);
        
        // 要素ごとの表示遅延（フェードイン）
        const drawWithFade = (drawFunc, delayMs) => {
            let alpha = 1;
            if (isAnimEnabled && this.phase === 'DRUMROLL') {
                alpha = Math.max(0, Math.min(1, (elapsed - delayMs) / 300));
            }
            if (alpha > 0) {
                targetCtx.save();
                targetCtx.globalAlpha = alpha;
                drawFunc();
                targetCtx.restore();
            }
        };

        // --- Render Top Section ---
        drawWithFade(() => {
            targetCtx.fillStyle = '#aaa';
            targetCtx.font = conf.FONT_TITLE_FINAL_SCORE;
            targetCtx.textAlign = 'right';
            targetCtx.fillText('FINAL SCORE :', centerX + conf.TITLE_FINAL_SCORE_X_OFFSET, topStartY);

            this.drawHugeScoreWall(targetCtx, centerX, scoreWallInfo, progress, scoreWallStartY);
        }, 0);

        // --- Render Middle Section ---
        drawWithFade(() => {
            this.drawSummary(targetCtx, centerX, summaryStartY, progress);
        }, 200);

        // --- Render Bottom Section ---
        drawWithFade(() => {
            this.drawStatsTable(targetCtx, centerX, frameW, tableStartY, progress);
        }, 400);

        // --- Render Tap to Title ---
        if (this.phase === 'DONE' && !this.isGlitching) {
            if (this.timeSinceDone > 800) {
                // blink effect based on timeSinceDone
                const blink = Math.floor(this.timeSinceDone / 500) % 2 === 0 ? 0.7 : 0.2;
                ctx.globalAlpha = blink;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = conf.FONT_TAP_TO_TITLE;
                ctx.fillText('[ TAP TO TITLE ]', centerX, frameY + frameH);
                ctx.textBaseline = 'alphabetic';
                ctx.globalAlpha = 1.0;
            }
        }

        if (this.isGlitching) {
            const glitchElapsed = this.glitchElapsed;
            const glitchConf = EFFECT_MATH_CONFIG.RESULT_GLITCH;
            
            if (glitchElapsed >= glitchConf.DURATION_MS) {
                this.isGlitching = false;
                ctx.drawImage(this.glitchCanvas, 0, 0);
            } else {
                if (!this.tempCanvas) {
                    this.tempCanvas = document.createElement('canvas');
                }
                this.tempCanvas.width = width;
                this.tempCanvas.height = height;
                const tempCtx = this.tempCanvas.getContext('2d');

                const drawSliced = (tCtx, source, offsetX) => {
                    const sliceHeight = glitchConf.SLICE_HEIGHT;
                    const yCount = Math.ceil(height / sliceHeight);
                    for (let i = 0; i < yCount; i++) {
                        let sy = i * sliceHeight;
                        let dx = offsetX + (Math.random() - 0.5) * glitchConf.BASE_OFFSET_AMP;
                        if (Math.random() < glitchConf.NOISE_PROBABILITY) {
                            dx += (Math.random() - 0.5) * glitchConf.NOISE_OFFSET_AMP;
                        }
                        tCtx.drawImage(source, 0, sy, width, sliceHeight, dx, sy, width, sliceHeight);
                    }
                };

                ctx.save();
                ctx.globalCompositeOperation = 'lighter';

                // RED
                tempCtx.globalCompositeOperation = 'source-over';
                tempCtx.clearRect(0, 0, width, height);
                drawSliced(tempCtx, this.glitchCanvas, glitchConf.COLOR_SHIFT_R);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = glitchConf.COLOR_R;
                tempCtx.fillRect(0, 0, width, height);
                ctx.drawImage(this.tempCanvas, 0, 0);

                // CYAN
                tempCtx.globalCompositeOperation = 'source-over';
                tempCtx.clearRect(0, 0, width, height);
                drawSliced(tempCtx, this.glitchCanvas, glitchConf.COLOR_SHIFT_C);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillStyle = glitchConf.COLOR_C;
                tempCtx.fillRect(0, 0, width, height);
                ctx.drawImage(this.tempCanvas, 0, 0);

                // ORIGINAL
                tempCtx.globalCompositeOperation = 'source-over';
                tempCtx.clearRect(0, 0, width, height);
                drawSliced(tempCtx, this.glitchCanvas, 0);
                ctx.drawImage(this.tempCanvas, 0, 0);

                ctx.restore();
            }
        }

        // --- Interaction ---
        UIManager.updateButtonRect('resultTapAnywhere', 8, 0, 0, width, height);
        UIManager.setButtonCallback('resultTapAnywhere', () => {
            if (this.phase === 'DRUMROLL') {
                this.skipRequested = true;
            } else if (this.phase === 'DONE') {
                if (this.timeSinceDone > 800) {
                    soundManager.playSE('TAP');
                    GameState.reset();
                    SceneManager.changeScene(new TitleScene());
                }
            }
        });
    }

    drawCyberFrame(ctx, x, y, w, h) {
        const conf = LAYOUT_CONFIG.RESULT_SCENE;
        ctx.strokeStyle = conf.COLOR_CYBER_FRAME;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();

        ctx.fillStyle = conf.COLOR_CYBER_FRAME_TEXT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = conf.FRAME_FONT_TEXT;
        ctx.fillText('[ RESULT ]', x + conf.FRAME_TEXT_X_OFFSET, y);
        ctx.textBaseline = 'alphabetic';
        
        const bl = conf.FRAME_CORNER_LENGTH; 
        ctx.beginPath();
        ctx.moveTo(x, y + bl); ctx.lineTo(x, y); ctx.lineTo(x + bl, y);
        ctx.moveTo(x + w - bl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bl);
        ctx.moveTo(x, y + h - bl); ctx.lineTo(x, y + h); ctx.lineTo(x + bl, y + h);
        ctx.moveTo(x + w - bl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bl);
        ctx.stroke();
    }

    calculateScoreWallHeight(availableWidth) {
        const scoreData = generateScoreData(this.totalScore, 0);

        let lines = [];
        let currentLine = [];
        let kTracker = scoreData.filter(d => d.type === 'char').length;

        for (let i = 0; i < scoreData.length; i++) {
            const item = scoreData[i];
            if (item.type === 'char') {
                kTracker--;
                if (kTracker < scoreData.filter(d => d.type === 'char').length - 1 && (kTracker + 1) % 20 === 0) {
                    lines.push(currentLine);
                    currentLine = [];
                }
            }
            currentLine.push(item);
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        const dummySprite = SpriteCacheManager.get('unit-万-0');
        const dummyWidth = dummySprite ? (dummySprite.advanceWidth || dummySprite.width) + 1 : 18;

        let lineWidths = [];
        let maxLineWidth = 0;
        let charOnlyWidths = [];
        let maxCharOnlyWidth = 0;

        for (const line of lines) {
            let lw = 0;
            let simX = 0;
            let charSimX = 0;
            let endsWithChar = line.length > 0 && line[line.length - 1].type === 'char';

            for (const item of line) {
                const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
                const sprite = SpriteCacheManager.get(key);
                if (sprite) {
                    lw = Math.max(lw, simX + sprite.width);
                    simX += (sprite.advanceWidth || sprite.width);
                    if (item.type === 'char') {
                        charSimX += (sprite.advanceWidth || sprite.width);
                    }
                    if (item.type !== 'char') simX += 1;
                }
            }

            if (endsWithChar) {
                lw = Math.max(lw, simX + dummyWidth);
            }

            lineWidths.push(lw);
            charOnlyWidths.push(charSimX);
            if (lw > maxLineWidth) maxLineWidth = lw;
            if (charSimX > maxCharOnlyWidth) maxCharOnlyWidth = charSimX;
        }

        const conf = LAYOUT_CONFIG.RESULT_SCENE;
        let scale = conf.SCORE_WALL_BASE_SCALE;
        if (maxLineWidth * scale > availableWidth && availableWidth > 0) {
            scale = availableWidth / maxLineWidth;
        }

        const lineHeight = conf.SCORE_WALL_LINE_HEIGHT;
        const drawHeight = conf.SCORE_WALL_MAX_LINES * lineHeight * scale;

        return {
            lines,
            lineWidths,
            maxLineWidth,
            maxCharOnlyWidth,
            scale,
            drawHeight,
            lineHeight
        };
    }

    drawHugeScoreWall(ctx, centerX, info, progress, startY) {
        const scoreVal = this.totalScore * BigInt(Math.floor(progress * 1000)) / 1000n;
        const currentData = generateScoreData(scoreVal, 0);

        let lines = [];
        let currentLine = [];
        let kTracker = currentData.filter(d => d.type === 'char').length;

        for (let i = 0; i < currentData.length; i++) {
            const item = currentData[i];
            if (item.type === 'char') {
                kTracker--;
                if (kTracker < currentData.filter(d => d.type === 'char').length - 1 && (kTracker + 1) % 20 === 0) {
                    lines.push(currentLine);
                    currentLine = [];
                }
            }
            currentLine.push(item);
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        const dummySprite = SpriteCacheManager.get('unit-万-0');
        const dummyWidth = dummySprite ? (dummySprite.advanceWidth || dummySprite.width) + 1 : 18;

        let lineWidths = [];
        for (const line of lines) {
            let lw = 0;
            let simX = 0;
            let endsWithChar = line.length > 0 && line[line.length - 1].type === 'char';

            for (const item of line) {
                const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
                const sprite = SpriteCacheManager.get(key);
                if (sprite) {
                    lw = Math.max(lw, simX + sprite.width);
                    simX += (sprite.advanceWidth || sprite.width);
                    if (item.type !== 'char') simX += 1;
                }
            }
            if (endsWithChar) {
                lw = Math.max(lw, simX + dummyWidth);
            }
            lineWidths.push(lw);
        }

        const scale = info.scale;
        const scaledMaxCharWidth = info.maxCharOnlyWidth * scale;
        const scaledMaxTotalWidth = info.maxLineWidth * scale;
        
        const diffUnitWidth = scaledMaxTotalWidth - scaledMaxCharWidth;
        const rightAlignX = centerX + (scaledMaxCharWidth / 2) + diffUnitWidth;
        
        ctx.save();
        ctx.translate(0, startY);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lw = lineWidths[i] * scale;
            
            let currentX = rightAlignX - lw;
            const currentY = i * info.lineHeight * scale;
            
            ctx.save();
            ctx.translate(currentX, currentY);
            ctx.scale(scale, scale);
            
            let cx = 0;
            for (const item of line) {
                const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
                const sprite = SpriteCacheManager.get(key);
                if (sprite) {
                    ctx.drawImage(sprite, cx, 0);
                    cx += (sprite.advanceWidth || sprite.width);
                    if (item.type !== 'char') cx += 1;
                }
            }
            ctx.restore();
        }
        ctx.restore();
    }

    drawSummary(ctx, centerX, y, progress) {
        const conf = LAYOUT_CONFIG.RESULT_SCENE;
        ctx.fillStyle = conf.COLOR_TEXT_SECONDARY;
        ctx.font = conf.SUMMARY_LABEL_FONT;
        ctx.textAlign = 'right';
        
        const labelX = centerX + conf.SUMMARY_LABEL_X_OFFSET;
        const valueX = centerX + conf.SUMMARY_VALUE_X_OFFSET;
        
        let yPos = y;
        // Level
        ctx.fillText('LEVEL :', labelX, yPos);
        ctx.textAlign = 'left';
        ctx.fillStyle = conf.COLOR_TEXT_HIGHLIGHT;
        ctx.fillText(`${this.level}`, valueX, yPos);

        yPos += conf.SUMMARY_ROW_HEIGHT;
        // Time
        ctx.fillStyle = conf.COLOR_TEXT_SECONDARY;
        ctx.textAlign = 'right';
        ctx.fillText('TIME :', labelX, yPos);
        ctx.textAlign = 'left';
        ctx.fillStyle = conf.COLOR_TEXT_HIGHLIGHT;
        const totalSec = Math.floor(this.playTimeMs / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        ctx.fillText(`${m}:${s}`, valueX, yPos);

        yPos += conf.SUMMARY_ROW_HEIGHT;
        // Max Chain
        ctx.fillStyle = conf.COLOR_TEXT_SECONDARY;
        ctx.textAlign = 'right';
        ctx.fillText('MAX CHAIN :', labelX, yPos);
        ctx.textAlign = 'left';
        
        let xOffsetChain = 0;
        if (this.maxChainColor) {
            ctx.fillStyle = this.maxChainColor;
            ctx.shadowColor = this.maxChainColor;
            ctx.shadowBlur = conf.SUMMARY_ICON_SHADOW_BLUR;
            ctx.beginPath();
            ctx.arc(valueX + conf.SUMMARY_ICON_X_OFFSET, yPos + conf.SUMMARY_ICON_CHAIN_Y_OFFSET, conf.SUMMARY_ICON_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            xOffsetChain = conf.SUMMARY_VALUE_X_SHIFT_WITH_ICON;
        }
        ctx.fillStyle = conf.COLOR_TEXT_HIGHLIGHT;
        ctx.fillText(`${Math.floor(this.maxChain * progress)}`, valueX + xOffsetChain, yPos);

        yPos += conf.SUMMARY_ROW_HEIGHT;
        // Max Score
        ctx.fillStyle = conf.COLOR_TEXT_SECONDARY;
        ctx.textAlign = 'right';
        ctx.fillText('1 TAP MAX SCORE :', labelX, yPos);
        
        let xOffsetScore = 0;
        if (this.maxScoreColor) {
            ctx.fillStyle = this.maxScoreColor;
            ctx.shadowColor = this.maxScoreColor;
            ctx.shadowBlur = conf.SUMMARY_ICON_SHADOW_BLUR;
            ctx.beginPath();
            ctx.arc(valueX + conf.SUMMARY_ICON_X_OFFSET, yPos + conf.SUMMARY_ICON_SCORE_Y_OFFSET, conf.SUMMARY_ICON_RADIUS, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            xOffsetScore = conf.SUMMARY_VALUE_X_SHIFT_WITH_ICON;
        }

        const maxScoreVal = this.maxScorePerTap * BigInt(Math.floor(progress * 1000)) / 1000n;
        const scoreData = generateScoreData(maxScoreVal, 16);
        
        ctx.save();
        ctx.translate(valueX + xOffsetScore, yPos + conf.SUMMARY_MAX_SCORE_Y_OFFSET); 
        drawScoreData(ctx, scoreData, 0, 0, conf.SUMMARY_MAX_SCORE_SCALE);
        ctx.restore();
    }

    drawStatsTable(ctx, centerX, frameW, startY, progress) {
        const conf = LAYOUT_CONFIG.RESULT_SCENE;
        const rowHeight = conf.TABLE_ROW_HEIGHT;
        
        // Column X positions
        const xTitle = centerX + conf.TABLE_COL_TITLE_X;
        const xDisruptCenter = centerX + conf.TABLE_COL_DISRUPT_X;
        const xScoreCenter = centerX + conf.TABLE_COL_SCORE_X;
        const xSkillCenter = centerX + conf.TABLE_COL_SKILL_X;
        
        ctx.fillStyle = conf.COLOR_TABLE_HEADER;
        ctx.font = conf.TABLE_HEADER_FONT;
        ctx.textAlign = 'center';
        ctx.fillText('DISRUPT', xDisruptCenter, startY);
        ctx.fillText('TOTAL SCORE', xScoreCenter, startY);
        ctx.fillText('SKILL', xSkillCenter, startY);
        
        ctx.strokeStyle = conf.COLOR_TABLE_LINE;
        ctx.beginPath();
        ctx.moveTo(xTitle + conf.TABLE_LINE_START_X_OFFSET, startY + conf.TABLE_LINE_Y_OFFSET_TOP);
        ctx.lineTo(xSkillCenter + conf.TABLE_LINE_END_X_OFFSET, startY + conf.TABLE_LINE_Y_OFFSET_TOP);
        ctx.stroke();

        let currentY = startY + rowHeight + conf.TABLE_ROW_START_Y_OFFSET;
        
        const drawRow = (color, count, score, skill, isTotal) => {
            if (!isTotal && this.totalScore > 0n) {
                const ratio = Number((score * 10000n) / this.totalScore) / 10000;
                const maxWidth = (xSkillCenter + conf.TABLE_LINE_END_X_OFFSET) - (xTitle + conf.TABLE_LINE_START_X_OFFSET);
                const bgWidth = maxWidth * ratio;
                
                const rectHeight = rowHeight - conf.TABLE_GAUGE_HEIGHT_OFFSET;
                const gaugeY = currentY + conf.TABLE_GAUGE_Y_OFFSET;
                const gaugeStartX = (xSkillCenter + conf.TABLE_LINE_END_X_OFFSET) - bgWidth;
                
                ctx.fillStyle = color;
                ctx.globalAlpha = conf.TABLE_GAUGE_ALPHA;
                
                const slitWidth = conf.TABLE_GAUGE_SLIT_WIDTH;
                const slitGap = conf.TABLE_GAUGE_SLIT_GAP;
                let drawnWidth = 0;
                while (drawnWidth < bgWidth) {
                    const drawW = Math.min(slitWidth, bgWidth - drawnWidth);
                    ctx.fillRect(gaugeStartX + drawnWidth, gaugeY, drawW, rectHeight);
                    drawnWidth += slitWidth + slitGap;
                }
                ctx.globalAlpha = 1.0;
            }

            ctx.fillStyle = isTotal ? conf.COLOR_TEXT_PRIMARY : color;
            ctx.textAlign = 'left';
            if (!isTotal) {
                ctx.shadowColor = color;
                ctx.shadowBlur = conf.TABLE_COLOR_ICON_SHADOW_BLUR;
                ctx.beginPath();
                ctx.arc(xTitle + conf.TABLE_COLOR_ICON_X_OFFSET, currentY + conf.TABLE_COLOR_ICON_Y_OFFSET, conf.SUMMARY_ICON_RADIUS, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.font = conf.TABLE_TOTAL_LABEL_FONT;
                ctx.fillText('TOTAL', xTitle + conf.TABLE_TOTAL_LABEL_X_OFFSET, currentY);
            }
            const currCount = Math.floor(count * progress);
            const currScore = score * BigInt(Math.floor(progress * 1000)) / 1000n;
            
            ctx.fillStyle = conf.COLOR_TEXT_PRIMARY;
            ctx.textAlign = 'right';
            ctx.font = isTotal ? conf.TABLE_ROW_FONT_TOTAL : conf.TABLE_ROW_FONT;
            ctx.fillText(currCount.toString(), xDisruptCenter + conf.TABLE_DISRUPT_RIGHT_OFFSET, currentY);
            
            const scoreData = generateScoreData(currScore, 8);
            const scoreScale = isTotal ? conf.TABLE_SCORE_SCALE_TOTAL : conf.TABLE_SCORE_SCALE_NORMAL;
            const sw = this.measureScoreData(scoreData, scoreScale);
            
            ctx.save();
            ctx.translate(xScoreCenter + conf.TABLE_SCORE_RIGHT_OFFSET - sw, currentY + conf.TABLE_SPRITE_Y_OFFSET);
            drawScoreData(ctx, scoreData, 0, 0, scoreScale);
            ctx.restore();
            
            const currSkill = BigInt(skill) * BigInt(Math.floor(progress * 1000)) / 1000n;
            const skillData = generateScoreData(currSkill, 8);
            const skillScale = isTotal ? conf.TABLE_SCORE_SCALE_TOTAL : conf.TABLE_SCORE_SCALE_NORMAL;
            const skillW = this.measureScoreData(skillData, skillScale);
            
            ctx.save();
            ctx.translate(xSkillCenter + conf.TABLE_SKILL_RIGHT_OFFSET - skillW, currentY + conf.TABLE_SPRITE_Y_OFFSET);
            drawScoreData(ctx, skillData, 0, 0, skillScale);
            ctx.restore();
            
            currentY += rowHeight;
        };

        drawRow(conf.COLOR_TEXT_PRIMARY, this.totalDisrupt, this.totalScore, 0n, true);
        
        ctx.beginPath();
        ctx.moveTo(xTitle + conf.TABLE_LINE_START_X_OFFSET, currentY - rowHeight + conf.TABLE_LINE_Y_OFFSET_BOTTOM);
        ctx.lineTo(xSkillCenter + conf.TABLE_LINE_END_X_OFFSET, currentY - rowHeight + conf.TABLE_LINE_Y_OFFSET_BOTTOM);
        ctx.stroke();
        currentY += conf.TABLE_BOTTOM_PADDING;

        this.statsLines.forEach(line => {
            drawRow(line.color, line.count, line.score, line.skill, false);
        });
    }

    measureScoreData(data, scale) {
        let width = 0;
        let simX = 0;
        for (const item of data) {
            const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
            const sprite = SpriteCacheManager.get(key);
            if (sprite) {
                width = Math.max(width, simX + sprite.width * scale);
                simX += (sprite.advanceWidth || sprite.width) * scale;
                if (item.type !== 'char') simX += 1 * scale;
            }
        }
        
        // 末尾が数字(char)で終わる＝「万」などの単位がない場合、
        // 右寄せ時の位置が揃うようにダミーの単位分の幅をパディングする
        let endsWithChar = data.length > 0 && data[data.length - 1].type === 'char';
        if (endsWithChar) {
            const dummySprite = SpriteCacheManager.get('unit-万-0');
            const dummyWidth = dummySprite ? (dummySprite.advanceWidth || dummySprite.width) + 1 : 18;
            width = Math.max(width, simX + dummyWidth * scale);
        }
        
        return width;
    }
}

export const ResultRenderer = new ResultRendererClass();
