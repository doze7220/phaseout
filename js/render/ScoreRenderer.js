// ScoreRenderer.js
import { FLOATING_TEXT_CONFIG } from '../core/config.js';
import { parseScoreData } from '../core/score.js';

const scoreSpriteCache = new Map();

// スコア表示用スプライトの事前生成
export function initScoreSpriteCache() {
    scoreSpriteCache.clear();
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ':', '-', 's', '/', ' ', 'R', 'A', 'T', 'E', 'P', 'C', 'O', 'S', 'x', 'I', 'M'];
    const SCORE_UNITS = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極'];

    // 数字・記号用スプライト (白とオレンジ)
    const colorSets = [
        { prefix: 'char', color: '#fff' },
        { prefix: 'char-orange', color: '#FF9500' }
    ];

    for (const set of colorSets) {
        for (const c of chars) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            const metrics = ctx.measureText(c);
            const padding = 6; // 黒縁の太さ分を加算
            canvas.width = Math.max(Math.ceil(metrics.width), 16) + padding;
            canvas.height = 42;

            ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            ctx.textBaseline = 'alphabetic';

            // ドロップシャドウを黒縁にかける
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetY = 4;
            ctx.shadowBlur = 6;

            // 黒縁
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.strokeText(c, padding / 2, 36);

            // 塗りつぶし（シャドウなし）
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = set.color;
            ctx.fillText(c, padding / 2, 36);

            canvas.advanceWidth = canvas.width - padding;
            scoreSpriteCache.set(`${set.prefix}-${c}`, canvas);
        }
    }

    // 単位漢字用スプライト (tier: 0~3)
    for (const unit of SCORE_UNITS) {
        for (let tier = 0; tier <= 3; tier++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const asterisks = '*'.repeat(tier);
            let astMetrics = { width: 0 };
            if (asterisks) {
                ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                astMetrics = ctx.measureText(asterisks);
            }

            ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            const unitMetrics = ctx.measureText(unit);

            const padding = 6;
            const w = Math.max(Math.ceil(unitMetrics.width), Math.ceil(astMetrics.width)) + padding;
            canvas.width = w;
            canvas.height = 42;

            let color = '#FFD700';
            let glowColor = 'transparent';
            let glowBlur = 0;
            if (tier === 1) { color = '#00FFFF'; glowColor = '#00FFFF'; glowBlur = 5; }
            if (tier === 2) { color = '#FF3B30'; glowColor = '#FF3B30'; glowBlur = 5; }
            if (tier >= 3) { color = '#FF00FF'; glowColor = '#FF00FF'; glowBlur = 5; }

            // ドロップシャドウを黒縁にかける
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetY = 4;
            ctx.shadowBlur = 6;

            // 黒縁
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';

            if (asterisks) {
                ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.textBaseline = 'alphabetic';
                ctx.strokeText(asterisks, (w - astMetrics.width) / 2, 16);
            }

            ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            ctx.textBaseline = 'alphabetic';
            ctx.strokeText(unit, (w - unitMetrics.width) / 2, 36);

            // 塗りつぶし（ティアごとのグロウがあれば適用）
            ctx.shadowOffsetY = 0;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowBlur;
            ctx.fillStyle = color;

            if (asterisks) {
                ctx.font = 'bold 12.8px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
                ctx.fillText(asterisks, (w - astMetrics.width) / 2, 16);
            }

            ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            ctx.fillText(unit, (w - unitMetrics.width) / 2, 36);

            canvas.advanceWidth = canvas.width - padding;
            scoreSpriteCache.set(`unit-${unit}-${tier}`, canvas);
        }
    }

    // フローティングテキスト用スプライト (スコアと共通化しつつ色・記号を追加)
    const floatChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-'];
    for (const type of Object.keys(FLOATING_TEXT_CONFIG.COLORS)) {
        const color = FLOATING_TEXT_CONFIG.COLORS[type];
        const label = FLOATING_TEXT_CONFIG.LABELS[type];

        const canvasL = document.createElement('canvas');
        const ctxL = canvasL.getContext('2d');
        ctxL.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        const metricsL = ctxL.measureText(label);
        const wL = Math.ceil(metricsL.width);
        const padding = 12;
        canvasL.width = Math.max(wL + padding * 2, 16);
        canvasL.height = 54;
        ctxL.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        ctxL.fillStyle = color;
        ctxL.shadowColor = 'rgba(0,0,0,0.8)';
        ctxL.shadowOffsetY = 4;
        ctxL.shadowBlur = 6;
        ctxL.textBaseline = 'alphabetic';
        ctxL.fillText(label, padding, 40);
        canvasL.advanceWidth = wL;
        scoreSpriteCache.set(`float-label-${type}`, canvasL);

        for (const c of floatChars) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            const metrics = ctx.measureText(c);
            const wC = Math.ceil(metrics.width);
            canvas.width = Math.max(wC + padding * 2, 16);
            canvas.height = 54;
            ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
            ctx.textBaseline = 'alphabetic';

            // 縁取り（シャドウなし）
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.strokeText(c, padding, 40);

            ctx.fillStyle = color;
            ctx.fillText(c, padding, 40);
            canvas.advanceWidth = wC;
            scoreSpriteCache.set(`float-char-${type}-${c}`, canvas);
        }
    }
}

export function getScoreSprite(key) {
    return scoreSpriteCache.get(key);
}

export function createScoreCanvas(scoreValue) {
    const scoreData = parseScoreData(scoreValue);
    let totalWidth = 0;
    const maxHeight = 42;

    let simX = 0;
    for (const item of scoreData) {
        const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
        const sprite = scoreSpriteCache.get(key);
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
        const sprite = scoreSpriteCache.get(key);
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

export function drawHeaderUI(timerStr, decayStr, tapCostValue, scoreValue, rateValue) {
    const canvas = document.getElementById('ui-header-canvas');
    if (!canvas) return;
    const header = document.getElementById('puzzle-header');
    if (!header) return;

    const cssWidth = header.clientWidth;
    const cssHeight = header.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const physicalWidth = Math.floor(cssWidth * dpr);
    const physicalHeight = Math.floor(cssHeight * dpr);

    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
        canvas.width = physicalWidth;
        canvas.height = physicalHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, physicalWidth, physicalHeight);

    ctx.save();
    ctx.scale(dpr, dpr);

    const maxHeight = 42;

    const drawString = (str, prefix, startX, startY, scale, letterSpacing = 0) => {
        let currentX = startX;
        for (const c of str) {
            const sprite = scoreSpriteCache.get(`${prefix}-${c}`);
            if (sprite) {
                ctx.save();
                ctx.translate(currentX, startY);
                ctx.scale(scale, scale);
                ctx.drawImage(sprite, 0, 0);
                ctx.restore();
                currentX += (sprite.advanceWidth || sprite.width) * scale + letterSpacing;
            }
        }
        return currentX - startX;
    };

    const measureScoreData = (data, scale) => {
        let width = 0;
        let simX = 0;
        for (const item of data) {
            const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
            const sprite = scoreSpriteCache.get(key);
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
            const sprite = scoreSpriteCache.get(key);
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

    // 1. Timer
    let timerScale = (22 / maxHeight) * mobileScale;
    let timerY = 5;
    let timerX = 10;
    drawString(timerStr, 'char', timerX, timerY, timerScale, -1);

    // 2. Decay Rate (TIME COST)
    let decayScale = 0.6 * 0.8 * mobileScale;
    let decayY = isMobile ? timerY + (22 * mobileScale) + 2 : timerY + 22 + 2;
    let decayTitleWidth = drawString("TIME COST:", 'char-orange', timerX, decayY, decayScale, -1);
    drawString(decayStr, 'char-orange', timerX + (15 * mobileScale), decayY + (14 * mobileScale), decayScale, -1);

    // 3. Tap Cost
    let tapCostScale = isMobile ? decayScale : 0.6; // スマホではTIME COSTと完全一致
    let tapCostX = isMobile ? timerX + decayTitleWidth + 10 : 110;
    let tapCostY = isMobile ? decayY : cssHeight - (maxHeight * tapCostScale) - 2;
    
    if (isMobile) {
        let tapCostValStr = "- " + Math.floor(tapCostValue);
        drawString("TAP COST:", 'char-orange', tapCostX, tapCostY, tapCostScale, -1);
        drawString(tapCostValStr, 'char-orange', tapCostX + (15 * mobileScale), tapCostY + (14 * mobileScale), tapCostScale, -1);
    } else {
        let tapCostStr = "TAP COST: -" + Math.floor(tapCostValue);
        drawString(tapCostStr, 'char-orange', tapCostX, tapCostY, tapCostScale, 0);
    }

    // 4. Score
    const scoreData = parseScoreData(scoreValue);
    const scorePaddingRight = 60; // Space for config button
    let scoreTotalWidth = measureScoreData(scoreData, 1);
    let scoreMaxAvailWidth = isMobile ? (cssWidth * 0.55 - 10) : (cssWidth * 0.65 - 50); 
    let scoreScale = mobileScale;
    if (scoreTotalWidth * scoreScale > scoreMaxAvailWidth && scoreMaxAvailWidth > 0) {
        scoreScale = scoreMaxAvailWidth / scoreTotalWidth;
    }
    const scoreX = cssWidth - scorePaddingRight - (scoreTotalWidth * scoreScale);
    const scoreY = isMobile ? -5 : 0;
    drawScoreData(scoreData, scoreX, scoreY, scoreScale);

    // 5. Rate
    let rateData = [];
    if (rateValue < 10000) {
        let str = rateValue % 1 === 0 ? rateValue.toString() : rateValue.toFixed(1);
        for (let c of str) rateData.push({ type: 'char', value: c });
    } else {
        rateData = parseScoreData(BigInt(Math.floor(rateValue)), false); // ignoreMaxDigits=false
    }
    
    let rateScale = isMobile ? tapCostScale : 0.6 * mobileScale;
    
    if (isMobile) {
        // スマホなら RATE を2段組みにし、右揃え（SCOREの真下）
        let ratePrefix1 = ['R', 'A', 'T', 'E', ':'];
        let ratePrefix2 = ['x'];
        let fullRateData1 = ratePrefix1.map(c => ({ type: 'char', value: c }));
        let fullRateData2 = ratePrefix2.map(c => ({ type: 'char', value: c })).concat(rateData);
        
        let rateTotalWidth1 = measureScoreData(fullRateData1, rateScale);
        let rateTotalWidth2 = measureScoreData(fullRateData2, rateScale);
        
        let rateX1 = cssWidth - scorePaddingRight - rateTotalWidth1;
        let rateX2 = cssWidth - scorePaddingRight - rateTotalWidth2;
        let rateY1 = scoreY + (maxHeight * scoreScale) - 4; // Scoreのすぐ下
        let rateY2 = rateY1 + (14 * mobileScale); // TIME COSTと同じ行間隔
        
        drawScoreData(fullRateData1, rateX1, rateY1, rateScale);
        drawScoreData(fullRateData2, rateX2, rateY2, rateScale);
    } else {
        let ratePrefix = ['R', 'A', 'T', 'E', ':', ' ', 'x'];
        let fullRateData = ratePrefix.map(c => ({ type: 'char', value: c })).concat(rateData);
        let rateTotalWidth = measureScoreData(fullRateData, rateScale);
        
        // Position RATE to the right of level-display statically
        let rateX = cssWidth - scorePaddingRight - rateTotalWidth; // Fallback
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            const levelWidth = levelDisplay.offsetWidth || 80;
            rateX = (cssWidth / 2) + (levelWidth / 2) + 5;
        }
        let rateY = cssHeight - (maxHeight * rateScale) - 2;
        drawScoreData(fullRateData, rateX, rateY, rateScale);
    }

    ctx.restore();
}

export function drawResultScoreToCanvas(scoreValue) {
    const canvas = document.getElementById('final-score-canvas');
    if (!canvas) return;
    const container = canvas.parentElement;

    const str = scoreValue.toString();
    const length = str.length;
    // 無制限桁数でパース
    const scoreData = parseScoreData(scoreValue, true, true);

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
    const dummySprite = scoreSpriteCache.get('unit-万-0');
    const dummyWidth = dummySprite ? (dummySprite.advanceWidth || dummySprite.width) + 1 : 18;

    let lineWidths = [];
    let maxLineWidth = 0;
    for (const line of lines) {
        let lw = 0;
        let simX = 0;
        let endsWithChar = line.length > 0 && line[line.length - 1].type === 'char';

        for (const item of line) {
            const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
            const sprite = scoreSpriteCache.get(key);
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
            const sprite = scoreSpriteCache.get(key);
            if (sprite) {
                ctx.drawImage(sprite, currentX, currentY);
                currentX += (sprite.advanceWidth || sprite.width);
                if (item.type !== 'char') currentX += 1;
            }
        }
    }

    ctx.restore();
}

