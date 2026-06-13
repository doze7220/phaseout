// ResultRenderer.js
import { GameState, COLOR_CONFIG, AppConfig, activeColors } from '../core/config.js';
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
        this.resultStartTime = 0;
        this.statsLines = [];
        this.totalDisrupt = 0;
        
        // Animation States
        this.phase = 'INIT'; // INIT -> DRUMROLL -> DONE
        this.skipRequested = false;
        this.animDuration = 2000; // Drumroll takes 2s
        this.blockInputTime = 0; 
    }

    startResult() {
        this.resetState();
        this.resultStartTime = performance.now();
        
        let totalCount = 0;
        this.statsLines = [];
        
        COLOR_CONFIG.forEach(cConfig => {
            const color = cConfig.color;
            if (!activeColors.includes(color) && !GameState.stats[color]) return;
            
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

    draw(ctx) {
        if (GameState.currentScene !== 'RESULT') {
            UIManager.deactivateButton('resultTapAnywhere');
            return;
        }

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;
        const now = performance.now();
        const elapsed = now - this.resultStartTime;
        
        const isAnimEnabled = AppConfig.RESULT_ANIMATION;
        
        // --- State Management ---
        if (this.phase === 'INIT') {
            if (!isAnimEnabled) {
                this.phase = 'DONE';
                this.blockInputTime = now;
                effects.triggerScreenShake(15, 300);
                soundManager.playSE('BREAK_BURST');
            } else {
                this.phase = 'DRUMROLL';
            }
        }
        
        if (this.phase === 'DRUMROLL') {
            if (this.skipRequested || elapsed > this.animDuration) {
                this.phase = 'DONE';
                this.blockInputTime = now;
                effects.triggerScreenShake(15, 300);
                soundManager.playSE('BREAK_BURST');
            }
        }

        // --- Calculate Progress ---
        let progress = 1.0;
        if (this.phase === 'DRUMROLL') {
            progress = Math.min(1.0, Math.max(0, elapsed / this.animDuration));
            // Ease out quad
            progress = 1 - (1 - progress) * (1 - progress);
        }

        const frameW = width * 0.9;
        const centerX = width / 2;
        const centerY = height / 2;

        const scoreWallInfo = this.calculateScoreWallHeight(frameW - 80);
        
        const topGap = 60;
        const gap3 = 50;
        const summaryHeight = 135; 
        const gap4 = 50;
        const rowHeight = 45;
        const tableHeight = rowHeight * 8 + 40; // Always reserve space for 7 colors + TOTAL
        const bottomGap = 50;

        const contentHeight = topGap + 10 + scoreWallInfo.drawHeight + gap3 + summaryHeight + gap4 + tableHeight + bottomGap;
        const frameH = Math.min(height * 0.85, contentHeight);

        const frameX = centerX - frameW / 2;
        const frameY = centerY - frameH / 2;

        const topStartY = frameY + topGap;
        const scoreWallStartY = topStartY + 10;
        const summaryStartY = scoreWallStartY + scoreWallInfo.drawHeight + gap3;
        const tableStartY = summaryStartY + summaryHeight + gap4;

        // --- Render Background ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        this.drawCyberFrame(ctx, frameX, frameY, frameW, frameH);
        
        // 要素ごとの表示遅延（フェードイン）
        const drawWithFade = (drawFunc, delayMs) => {
            let alpha = 1;
            if (isAnimEnabled && this.phase === 'DRUMROLL') {
                alpha = Math.max(0, Math.min(1, (elapsed - delayMs) / 300));
            }
            if (alpha > 0) {
                ctx.save();
                ctx.globalAlpha = alpha;
                drawFunc();
                ctx.restore();
            }
        };

        // --- Render Top Section ---
        drawWithFade(() => {
            ctx.fillStyle = '#aaa';
            ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('FINAL SCORE :', centerX + 10, topStartY);

            this.drawHugeScoreWall(ctx, centerX, scoreWallInfo, progress, topStartY + 10);
        }, 0);

        // --- Render Middle Section ---
        drawWithFade(() => {
            this.drawSummary(ctx, centerX, summaryStartY, progress);
        }, 200);

        // --- Render Bottom Section ---
        drawWithFade(() => {
            this.drawStatsTable(ctx, centerX, frameW, tableStartY, progress);
        }, 400);

        // --- Render Tap to Title ---
        if (this.phase === 'DONE') {
            const timeSinceDone = now - this.blockInputTime;
            if (timeSinceDone > 800) {
                const blink = Math.floor(now / 500) % 2 === 0 ? 0.7 : 0.2;
                ctx.globalAlpha = blink;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('[ TAP TO TITLE ]', centerX, frameY + frameH);
                ctx.textBaseline = 'alphabetic';
                ctx.globalAlpha = 1.0;
            }
        }

        // --- Interaction ---
        UIManager.updateButtonRect('resultTapAnywhere', 8, 0, 0, width, height);
        UIManager.setButtonCallback('resultTapAnywhere', () => {
            if (this.phase === 'DRUMROLL') {
                this.skipRequested = true;
            } else if (this.phase === 'DONE') {
                if (now - this.blockInputTime > 800) {
                    soundManager.playSE('TAP');
                    GameState.reset();
                    SceneManager.changeScene(new TitleScene());
                }
            }
        });
    }

    drawCyberFrame(ctx, x, y, w, h) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('[ RESULT ]', x + 20, y);
        ctx.textBaseline = 'alphabetic';
        
        const bl = 20; 
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

        let scale = 1.15;
        if (maxLineWidth * scale > availableWidth && availableWidth > 0) {
            scale = availableWidth / maxLineWidth;
        }

        const lineHeight = 38;
        const drawHeight = 3 * lineHeight * scale;

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
        ctx.fillStyle = '#aaa';
        ctx.font = '24px monospace';
        ctx.textAlign = 'right';
        
        const labelX = centerX + 10;
        const valueX = centerX + 20;
        
        let yPos = y;
        // Level
        ctx.fillText('LEVEL :', labelX, yPos);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0ff';
        ctx.fillText(`${this.level}`, valueX, yPos);

        yPos += 45;
        // Time
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('TIME :', labelX, yPos);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0ff';
        const totalSec = Math.floor(this.playTimeMs / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        ctx.fillText(`${m}:${s}`, valueX, yPos);

        yPos += 45;
        // Max Chain
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('MAX CHAIN :', labelX, yPos);
        ctx.textAlign = 'left';
        
        let xOffsetChain = 0;
        if (this.maxChainColor) {
            ctx.fillStyle = this.maxChainColor;
            ctx.shadowColor = this.maxChainColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(valueX + 12, yPos - 6, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            xOffsetChain = 30;
        }
        ctx.fillStyle = '#0ff';
        ctx.fillText(`${Math.floor(this.maxChain * progress)}`, valueX + xOffsetChain, yPos);

        yPos += 45;
        // Max Score
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('1 TAP MAX SCORE :', labelX, yPos);
        
        let xOffsetScore = 0;
        if (this.maxScoreColor) {
            ctx.fillStyle = this.maxScoreColor;
            ctx.shadowColor = this.maxScoreColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(valueX + 12, yPos - 8, 8, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
            xOffsetScore = 30;
        }

        const maxScoreVal = this.maxScorePerTap * BigInt(Math.floor(progress * 1000)) / 1000n;
        const scoreData = generateScoreData(maxScoreVal, 16);
        
        ctx.save();
        ctx.translate(valueX + xOffsetScore, yPos - 26); 
        drawScoreData(ctx, scoreData, 0, 0, 0.68);
        ctx.restore();
    }

    drawStatsTable(ctx, centerX, frameW, startY, progress) {
        const rowHeight = 45;
        
        // Column X positions
        const xTitle = centerX - 250;
        const xDisruptCenter = centerX - 120;
        const xScoreCenter = centerX + 50;
        const xSkillCenter = centerX + 230;
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DISRUPT', xDisruptCenter, startY);
        ctx.fillText('TOTAL SCORE', xScoreCenter, startY);
        ctx.fillText('SKILL', xSkillCenter, startY);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(xTitle - 20, startY + 12);
        ctx.lineTo(xSkillCenter + 60, startY + 12);
        ctx.stroke();

        let currentY = startY + rowHeight + 10;
        
        const drawRow = (color, count, score, skill, isTotal) => {
            if (!isTotal && this.totalScore > 0n) {
                const ratio = Number((score * 10000n) / this.totalScore) / 10000;
                const maxWidth = (xSkillCenter + 60) - (xTitle - 20);
                const bgWidth = maxWidth * ratio;
                
                const rectHeight = rowHeight - 8;
                const gaugeY = currentY - 26;
                const gaugeStartX = (xSkillCenter + 60) - bgWidth;
                
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.25;
                
                const slitWidth = 4;
                const slitGap = 2;
                let drawnWidth = 0;
                while (drawnWidth < bgWidth) {
                    const drawW = Math.min(slitWidth, bgWidth - drawnWidth);
                    ctx.fillRect(gaugeStartX + drawnWidth, gaugeY, drawW, rectHeight);
                    drawnWidth += slitWidth + slitGap;
                }
                ctx.globalAlpha = 1.0;
            }

            ctx.fillStyle = isTotal ? '#fff' : color;
            ctx.textAlign = 'left';
            if (!isTotal) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(xTitle - 10, currentY - 6, 8, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('TOTAL', xTitle - 20, currentY);
            }
            const currCount = Math.floor(count * progress);
            const currScore = score * BigInt(Math.floor(progress * 1000)) / 1000n;
            
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = isTotal ? 'bold 24px monospace' : '22px monospace';
            ctx.fillText(currCount.toString(), xDisruptCenter, currentY);
            
            const scoreData = generateScoreData(currScore, 8);
            const scoreScale = isTotal ? 0.95 : 0.85;
            const sw = this.measureScoreData(scoreData, scoreScale);
            
            ctx.save();
            ctx.translate(xScoreCenter - sw / 2, currentY - 24);
            drawScoreData(ctx, scoreData, 0, 0, scoreScale);
            ctx.restore();
            
            const currSkill = BigInt(skill) * BigInt(Math.floor(progress * 1000)) / 1000n;
            const skillData = generateScoreData(currSkill, 8);
            const skillScale = isTotal ? 0.95 : 0.85;
            const skillW = this.measureScoreData(skillData, skillScale);
            
            ctx.save();
            ctx.translate(xSkillCenter - skillW / 2, currentY - 24);
            drawScoreData(ctx, skillData, 0, 0, skillScale);
            ctx.restore();
            
            currentY += rowHeight;
        };

        drawRow('#fff', this.totalDisrupt, this.totalScore, 0n, true);
        
        ctx.beginPath();
        ctx.moveTo(xTitle - 20, currentY - rowHeight + 14);
        ctx.lineTo(xSkillCenter + 60, currentY - rowHeight + 14);
        ctx.stroke();
        currentY += 16;

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
        return width;
    }
}

export const ResultRenderer = new ResultRendererClass();
