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
        // COLOR_CONFIGの順に処理する
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
                skill: 0 // +0
            });
        });

        this.totalDisrupt = totalCount;
        this.totalScore = GameState.actualScore;
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
            } else {
                this.phase = 'DRUMROLL';
            }
        }
        
        if (this.phase === 'DRUMROLL') {
            if (this.skipRequested || elapsed > this.animDuration) {
                this.phase = 'DONE';
                this.blockInputTime = now;
                effects.triggerScreenShake(15, 300); // 画面揺れ
                soundManager.playSE('BREAK_BURST'); // SE
            }
        }

        // --- Calculate Progress ---
        let progress = 1.0;
        if (this.phase === 'DRUMROLL') {
            progress = Math.min(1.0, elapsed / this.animDuration);
            // Ease out quad
            progress = 1 - (1 - progress) * (1 - progress);
        }

        // --- Render Background ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;

        this.drawCyberFrame(ctx, width, height);
        
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

        // UIの縦のレイアウト計算
        const scoreWallInfo = this.calculateScoreWallHeight(width - 40);
        const summaryStartY = scoreWallInfo.drawHeight + 80;
        const tableStartY = summaryStartY + 100;

        // --- Render Top Section ---
        drawWithFade(() => {
            this.drawHugeScoreWall(ctx, centerX, scoreWallInfo, progress);
        }, 0);

        // --- Render Middle Section ---
        drawWithFade(() => {
            this.drawSummary(ctx, centerX, summaryStartY, progress);
        }, 200);

        // --- Render Bottom Section ---
        drawWithFade(() => {
            this.drawStatsTable(ctx, centerX, width, tableStartY, progress);
        }, 400);

        // --- Render Tap to Title ---
        if (this.phase === 'DONE') {
            const timeSinceDone = now - this.blockInputTime;
            if (timeSinceDone > 800) {
                const blink = Math.floor(now / 500) % 2 === 0 ? 0.7 : 0.2;
                ctx.globalAlpha = blink;
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText('[ TAP TO TITLE ]', centerX, height - 40);
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

    drawCyberFrame(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(10, 10, width - 20, height - 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('[ RESULT ]', width / 2, 25);
        
        // コーナーブラケット
        const bl = 20; // bracket length
        ctx.beginPath();
        ctx.moveTo(10, 10 + bl); ctx.lineTo(10, 10); ctx.lineTo(10 + bl, 10);
        ctx.moveTo(width - 10 - bl, 10); ctx.lineTo(width - 10, 10); ctx.lineTo(width - 10, 10 + bl);
        ctx.moveTo(10, height - 10 - bl); ctx.lineTo(10, height - 10); ctx.lineTo(10 + bl, height - 10);
        ctx.moveTo(width - 10 - bl, height - 10); ctx.lineTo(width - 10, height - 10); ctx.lineTo(width - 10, height - 10 - bl);
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

        let scale = 1;
        if (maxLineWidth > availableWidth && availableWidth > 0) {
            scale = availableWidth / maxLineWidth;
        }

        const lineHeight = 42;
        const drawHeight = lines.length * lineHeight * scale;

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

    drawHugeScoreWall(ctx, centerX, info, progress) {
        const scoreVal = this.totalScore * BigInt(Math.floor(progress * 1000)) / 1000n;
        const drawDataInfo = this.calculateScoreWallHeight(1000); // Only for string structure matching, but wait, progress changes string length!
        // The instructions ask for the structure to be based on the final score. 
        // If we generate score data dynamically, the alignment jumps around.
        // It's better to format the string padded with invisible characters, OR just let it grow right-aligned.
        
        // Actually, if we just use drawDataInfo on the current scoreVal, the width will grow.
        // BUT to keep the unit columns steady, maybe we just use right-align based on the final maxCharOnlyWidth.
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
        const startY = 60;
        ctx.translate(0, startY);
        
        // Since lines are generated bottom-up in logic? Wait, generateScoreData returns highest unit first.
        // So the first line is the highest magnitude. We need to push them to the BOTTOM.
        // We have `info.lines.length` which is the final number of lines.
        // If `lines.length` is less, we must add vertical offset so they stay at the bottom.
        const lineOffset = info.lines.length - lines.length;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lw = lineWidths[i] * scale;
            
            let currentX = rightAlignX - lw;
            const currentY = (i + lineOffset) * info.lineHeight * scale;
            
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
        ctx.font = '20px monospace';
        ctx.textAlign = 'right';
        
        const labelX = centerX - 10;
        const valueX = centerX + 10;
        
        // Level
        ctx.fillText('LEVEL :', labelX, y);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0ff';
        ctx.fillText(`${this.level}`, valueX, y);

        // Time
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('TIME :', labelX, y + 30);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0ff';
        const totalSec = Math.floor(this.playTimeMs / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        ctx.fillText(`${m}:${s}`, valueX, y + 30);

        // Max Score
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'right';
        ctx.fillText('1 TAP MAX SCORE :', labelX, y + 60);
        
        // Color icon
        if (this.maxScoreColor) {
            ctx.fillStyle = this.maxScoreColor;
            ctx.shadowColor = this.maxScoreColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            const textWidth = ctx.measureText('1 TAP MAX SCORE :').width;
            ctx.arc(labelX - textWidth - 15, y + 54, 6, 0, Math.PI * 2); 
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'left';
        const maxScoreVal = this.maxScorePerTap * BigInt(Math.floor(progress * 1000)) / 1000n;
        const scoreData = generateScoreData(maxScoreVal, 0);
        
        ctx.save();
        ctx.translate(valueX, y + 60 - 20); // adjust y for sprite drawing
        drawScoreData(ctx, scoreData, 0, 0, 0.6);
        ctx.restore();
    }

    drawStatsTable(ctx, centerX, width, startY, progress) {
        const rowHeight = 30;
        
        // Column X positions
        const xTitle = centerX - 120;
        const xDisrupt = centerX - 60;
        const xScore = centerX + 120;
        const xSkill = centerX + 190;
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('DISRUPT', xDisrupt, startY);
        ctx.fillText('TOTAL SCORE', xScore, startY);
        ctx.fillText('SKILL', xSkill, startY);
        
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(xTitle - 20, startY + 8);
        ctx.lineTo(xSkill + 20, startY + 8);
        ctx.stroke();

        let currentY = startY + rowHeight;
        
        // Helper to draw row
        const drawRow = (color, count, score, skill, isTotal) => {
            // Block meter background for score
            if (!isTotal && this.totalScore > 0n) {
                // To display nicely, scale meter from right edge of table
                const ratio = Number((score * 10000n) / this.totalScore) / 10000;
                const maxWidth = (xSkill + 20) - (xTitle - 20);
                const bgWidth = maxWidth * ratio;
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect((xSkill + 20) - bgWidth, currentY - 20, bgWidth, rowHeight - 4);
            }

            ctx.fillStyle = isTotal ? '#fff' : color;
            ctx.textAlign = 'left';
            if (!isTotal) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(xTitle - 10, currentY - 5, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText('TOTAL', xTitle - 20, currentY);
            }

            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.font = isTotal ? 'bold 18px monospace' : '16px monospace';
            
            const currCount = Math.floor(count * progress);
            const currScore = score * BigInt(Math.floor(progress * 1000)) / 1000n;
            
            ctx.fillText(currCount.toString(), xDisrupt, currentY);
            
            // Score formatting
            const scoreStr = this.formatShortScore(currScore);
            ctx.fillText(scoreStr, xScore, currentY);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '14px monospace';
            ctx.fillText('+0', xSkill, currentY);
            
            currentY += rowHeight;
        };

        // TOTAL row
        drawRow('#fff', this.totalDisrupt, this.totalScore, 0, true);
        
        ctx.beginPath();
        ctx.moveTo(xTitle - 20, currentY - rowHeight + 10);
        ctx.lineTo(xSkill + 20, currentY - rowHeight + 10);
        ctx.stroke();
        currentY += 12;

        // Colors
        this.statsLines.forEach(line => {
            drawRow(line.color, line.count, line.score, line.skill, false);
        });
    }

    formatShortScore(val) {
        if (val === 0n) return "0";
        let s = val.toString();
        if (s.length <= 6) return s;
        
        const units = ['', '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数'];
        const unitIndex = Math.floor((s.length - 1) / 4);
        if (unitIndex >= units.length) return "INF";
        
        const topDigits = s.substring(0, s.length - unitIndex * 4);
        const lowerDigits = s.substring(s.length - unitIndex * 4, s.length - unitIndex * 4 + 2); 
        
        if (unitIndex === 0) return s;
        return `${topDigits}.${lowerDigits}${units[unitIndex]}`;
    }
}

export const ResultRenderer = new ResultRendererClass();
