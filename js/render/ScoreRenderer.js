// ScoreRenderer.js
import { FLOATING_TEXT_CONFIG, AppConfig, LAYOUT_CONFIG } from '../core/config.js';
import { generateScoreData } from '../core/score.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';

export function getScoreSprite(key) {
    return SpriteCacheManager.get(key);
}

export function createScoreCanvas(scoreValue) {
    const isMobile = window.innerWidth <= 600;
    const maxDigits = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.POPUP_SCORE : AppConfig.SCORE_DIGIT_LIMITS.PC.POPUP_SCORE;
    const scoreData = generateScoreData(scoreValue, maxDigits);
    let totalWidth = 0;
    const maxHeight = 42;

    let simX = 0;
    for (const item of scoreData) {
        const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
        const sprite = SpriteCacheManager.get(key);
        if (sprite) {
            totalWidth = Math.max(totalWidth, simX + sprite.width);
            simX += (sprite.advanceWidth || sprite.width);
            if (item.type !== 'char') {
                simX += 1;
            }
        }
    }

    if (totalWidth <= 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = maxHeight;
    const ctx = canvas.getContext('2d');

    let currentX = 0;
    for (const item of scoreData) {
        const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
        const sprite = SpriteCacheManager.get(key);
        if (sprite) {
            ctx.drawImage(sprite, currentX, 0);
            currentX += (sprite.advanceWidth || sprite.width);
            if (item.type !== 'char') {
                currentX += 1;
            }
        }
    }
    return canvas;
}

let configBtnImage = null;
const btnImg = new Image();
btnImg.src = './assets/img/ui/btn_config.png';
btnImg.onload = () => { configBtnImage = btnImg; };

export function drawHeaderUI(ctx, timerStr, decayStr, tapCostValue, scoreValue, rateValue, levelValue = 1) {
    const headerHeight = LAYOUT_CONFIG.HEADER_HEIGHT;
    const width = LAYOUT_CONFIG.APP_WIDTH;
    const cssWidth = width; // 以前のDOM幅に依存せず論理幅に固定

    ctx.save();

    // 0. コンフィグボタンとレベル表示の描画
    // コンフィグボタン (width 40x40)
    const configBtnSize = 40;
    const configBtnMargin = 15;
    const configBtnY = headerHeight - configBtnSize - configBtnMargin + 5; // 5px下げる
    if (configBtnImage) {
        ctx.drawImage(configBtnImage, width - 45, configBtnY, configBtnSize, configBtnSize);
    }

    // レベル表示
    ctx.save();
    const levelText = `Lv. ${levelValue}`;
    ctx.font = 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    const textMetrics = ctx.measureText(levelText);
    const boxWidth = textMetrics.width + 30;
    const boxHeight = 40;
    const boxX = width / 2 - boxWidth / 2;
    const boxY = headerHeight - boxHeight / 2 + 10; // 10px下げる

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText(levelText, width / 2, headerHeight + 10); // 10px下げる
    ctx.restore();

    const drawString = (str, prefix, startX, startY, scale, letterSpacing = 0, scaleXOverride = null) => {
        let scaleX = scaleXOverride !== null ? scaleXOverride : scale;
        let scaleY = scale;
        let currentX = startX;
        for (const c of str) {
            const sprite = SpriteCacheManager.get(`${prefix}-${c}`);
            if (sprite) {
                ctx.save();
                ctx.translate(currentX, startY);
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(sprite, 0, 0);
                ctx.restore();
                currentX += (sprite.advanceWidth || sprite.width) * scaleX + letterSpacing;
            }
        }
        return currentX - startX;
    };

    const measureString = (str, prefix, scale, letterSpacing = 0) => {
        let width = 0;
        for (const c of str) {
            const sprite = SpriteCacheManager.get(`${prefix}-${c}`);
            if (sprite) {
                width += (sprite.advanceWidth || sprite.width) * scale + letterSpacing;
            }
        }
        return width;
    };

    const measureScoreData = (data, scale) => {
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
    };

    const drawScoreData = (data, startX, startY, scale) => {
        let currentX = startX;
        for (const item of data) {
            const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
            const sprite = SpriteCacheManager.get(key);
            if (sprite) {
                ctx.save();
                ctx.translate(currentX, startY);
                ctx.scale(scale, scale);
                ctx.drawImage(sprite, 0, 0);
                ctx.restore();
                currentX += (sprite.advanceWidth || sprite.width) * scale;
                if (item.type !== 'char') currentX += 1 * scale;
            }
        }
        return currentX - startX;
    };

    const isMobile = cssWidth <= 600;
    const mobileScale = isMobile ? 0.8 : 1.0;

    // ボトムアップ（下寄せ）配置のY座標計算
    const uiMarginBottom = 15; // ヘッダ下端からの余白
    const row2Y = headerHeight - uiMarginBottom - (14 * mobileScale) + 10; // 下段2行目
    const row1Y = row2Y - (14 * mobileScale); // 下段1行目 (TIME COST等のタイトル行)
    const topRowY = row1Y - (30 * mobileScale) - 10; // 上段 (タイマー・スコア)

    // 1. Timer (60% width experiment)
    let timerScaleY = 1.0 * mobileScale; // スコアと同じ縦幅
    let timerScaleX = 0.6 * mobileScale; // 横幅だけ60%
    let timerY = topRowY + 5;
    let timerX = 10;
    drawString(timerStr, 'char', timerX, timerY, timerScaleY, -1, timerScaleX);

    // 2. Decay Rate (TIME COST)
    let decayScale = 0.6 * 0.8 * mobileScale;
    let decayY = row1Y;
    let decayTitleWidth = measureString("TIME COST:", 'char-orange', decayScale, -1);
    let decayValWidth = measureString(decayStr, 'char-orange', decayScale, -1);
    let decayValX = timerX + decayTitleWidth - decayValWidth;
    drawString("TIME COST:", 'char-orange', timerX, decayY, decayScale, -1);
    drawString(decayStr, 'char-orange', decayValX, row2Y, decayScale, -1);

    // 3. Tap Cost
    let tapCostScale = decayScale;
    let tapCostX = timerX + decayTitleWidth + 10;
    let tapCostY = decayY;

    let tapCostValStr = "- " + Math.floor(tapCostValue);
    let tapCostTitleWidth = measureString("TAP COST:", 'char-orange', tapCostScale, -1);
    let tapCostValWidth = measureString(tapCostValStr, 'char-orange', tapCostScale, -1);
    let tapCostValX = tapCostX + tapCostTitleWidth - tapCostValWidth;

    drawString("TAP COST:", 'char-orange', tapCostX, tapCostY, tapCostScale, -1);
    drawString(tapCostValStr, 'char-orange', tapCostValX, row2Y, tapCostScale, -1);

    // 4. Score
    const maxDigitsScore = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.SCORE : AppConfig.SCORE_DIGIT_LIMITS.PC.SCORE;
    const scoreData = generateScoreData(scoreValue, maxDigitsScore);
    const scorePaddingRight = 60; // Space for config button
    let scoreTotalWidth = measureScoreData(scoreData, 1);
    let scoreMaxAvailWidth = isMobile ? (cssWidth * 0.55 - 10) : (cssWidth * 0.65 - 50);
    let scoreScale = mobileScale;
    if (scoreTotalWidth * scoreScale > scoreMaxAvailWidth && scoreMaxAvailWidth > 0) {
        scoreScale = scoreMaxAvailWidth / scoreTotalWidth;
    }
    const scoreX = cssWidth - scorePaddingRight - (scoreTotalWidth * scoreScale);
    const scoreY = topRowY + 5; // 5px下げる
    drawScoreData(scoreData, scoreX, scoreY, scoreScale);

    // 5. Rate
    let rateData = [];
    if (rateValue < 10000) {
        let str = rateValue % 1 === 0 ? rateValue.toString() : rateValue.toFixed(1);
        for (let c of str) rateData.push({ type: 'char', value: c });
    } else {
        const maxDigitsRate = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.RATE : AppConfig.SCORE_DIGIT_LIMITS.PC.RATE;
        rateData = generateScoreData(BigInt(Math.floor(rateValue)), maxDigitsRate);
    }

    let rateScale = tapCostScale;

    // PCもスマホもRATEを2段組みにし、右揃え（SCOREの真下）に統一
    let ratePrefix1 = ['S', 'C', 'O', 'R', 'E', ' ', 'R', 'A', 'T', 'E', ':'];
    let ratePrefix2 = ['x'];
    let fullRateData1 = ratePrefix1.map(c => ({ type: 'char', value: c }));
    let fullRateData2 = ratePrefix2.map(c => ({ type: 'char', value: c })).concat(rateData);

    let rateTotalWidth1 = measureScoreData(fullRateData1, rateScale);
    let rateTotalWidth2 = measureScoreData(fullRateData2, rateScale);

    let rateX1 = cssWidth - scorePaddingRight - rateTotalWidth1;
    let rateX2 = cssWidth - scorePaddingRight - rateTotalWidth2;
    let rateY1 = row1Y; // 左側のTIME COST/TAP COSTと完全に高さを揃える
    let rateY2 = row2Y;

    drawScoreData(fullRateData1, rateX1, rateY1, rateScale);
    drawScoreData(fullRateData2, rateX2, rateY2, rateScale);

    ctx.restore();
}

export function drawResultScoreToCanvas(scoreValue) {
    const canvas = document.getElementById('final-score-canvas');
    if (!canvas) return;
    const container = canvas.parentElement;

    const str = scoreValue.toString();
    const length = str.length;
    // 無制限桁数でパース
    const scoreData = generateScoreData(scoreValue, 0);

    let lines = [];
    let currentLine = [];
    let kTracker = length;

    // 1行20桁で分割する
    for (let i = 0; i < scoreData.length; i++) {
        const item = scoreData[i];
        if (item.type === 'char') {
            kTracker--;
            if (kTracker < length - 1 && (kTracker + 1) % 20 === 0) {
                lines.push(currentLine);
                currentLine = [];
            }
        }
        currentLine.push(item);
    }
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    // ダミー単位の幅を取得（1の位用）
    const dummySprite = SpriteCacheManager.get('unit-万-0');
    const dummyWidth = dummySprite ? (dummySprite.advanceWidth || dummySprite.width) + 1 : 18;

    let lineWidths = [];
    let maxLineWidth = 0;
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
        if (lw > maxLineWidth) maxLineWidth = lw;
    }

    const containerWidth = container.clientWidth;
    const padding = 20;
    const availableWidth = containerWidth - padding * 2;

    let scale = 1;
    if (maxLineWidth > availableWidth && availableWidth > 0) {
        scale = availableWidth / maxLineWidth;
    }

    const lineHeight = 42; // 行の高さ
    const totalHeight = lines.length * lineHeight;
    const drawHeight = totalHeight * scale;

    // 実解像度の設定
    canvas.width = containerWidth;
    canvas.height = drawHeight;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${drawHeight}px`;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // 全体ブロックのセンタリング
    const blockDrawWidth = maxLineWidth * scale;
    const drawX = (containerWidth - blockDrawWidth) / 2;

    ctx.translate(drawX, 0);
    if (scale < 1) {
        ctx.scale(scale, scale);
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lw = lineWidths[i];

        // ブロック内で右詰め
        let currentX = maxLineWidth - lw;
        const currentY = i * lineHeight;

        for (const item of line) {
            const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
            const sprite = SpriteCacheManager.get(key);
            if (sprite) {
                ctx.drawImage(sprite, currentX, currentY);
                currentX += (sprite.advanceWidth || sprite.width);
                if (item.type !== 'char') currentX += 1;
            }
        }
    }

    ctx.restore();
}

