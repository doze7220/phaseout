// ScoreRenderer.js
import { FLOATING_TEXT_CONFIG, AppConfig, GameState, LEVEL_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UIManager } from '../core/UIManager.js';
import { generateScoreData } from '../core/score.js';
import { SpriteCacheManager } from './SpriteCacheManager.js';
import { PhaseManager, PHASE_BLACK_ENTER, PHASE_BLACK, PHASE_BLACK_EXIT } from '../core/PhaseManager.js';
import { BLACK_PHASE_EFFECT_CONFIG } from '../core/effectConfig.js';

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

export function drawScoreData(ctx, data, startX, startY, scaleX, scaleY = scaleX) {
    let currentX = startX;
    for (const item of data) {
        const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
        const sprite = SpriteCacheManager.get(key);
        if (sprite) {
            ctx.save();
            ctx.translate(currentX, startY);
            ctx.scale(scaleX, scaleY);
            ctx.drawImage(sprite, 0, 0);
            ctx.restore();
            currentX += (sprite.advanceWidth || sprite.width) * scaleX;
            if (item.type !== 'char') currentX += 1 * scaleX;
        }
    }
    return currentX - startX;
}

export function drawString(ctx, str, prefix, startX, startY, scaleX, scaleY = scaleX, letterSpacing = 0) {
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
}

export function measureString(str, prefix, scaleX, letterSpacing = 0) {
    let width = 0;
    for (const c of str) {
        const sprite = SpriteCacheManager.get(`${prefix}-${c}`);
        if (sprite) {
            width += (sprite.advanceWidth || sprite.width) * scaleX + letterSpacing;
        }
    }
    return width;
}

export function measureScoreData(data, scaleX) {
    let width = 0;
    let simX = 0;
    for (const item of data) {
        const key = item.type === 'char' ? `char-${item.value}` : `unit-${item.value}-${Math.min(item.tier, 3)}`;
        const sprite = SpriteCacheManager.get(key);
        if (sprite) {
            width = Math.max(width, simX + sprite.width * scaleX);
            simX += (sprite.advanceWidth || sprite.width) * scaleX;
            if (item.type !== 'char') simX += 1 * scaleX;
        }
    }
    return width;
}

let configBtnImage = null;
const btnImg = new Image();
btnImg.src = './assets/img/ui/btn_config.png';
btnImg.onload = () => { configBtnImage = btnImg; };

export function drawHeaderUI(ctx, timerStr, decayStr, tapCostValue, scoreValue, rateValue, levelValue = 1) {
    const headerHeight = LAYOUT_CONFIG.BASE.HEADER_HEIGHT;
    const width = LAYOUT_CONFIG.BASE.WIDTH;
    const cssWidth = width; // 以前のDOM幅に依存せず論理幅に固定

    ctx.save();

    // 0. コンフィグボタンとレベル表示の描画
    // コンフィグボタン
    const configBtnSize = LAYOUT_CONFIG.HEADER.CONFIG_BTN_SIZE;
    const configBtnMargin = LAYOUT_CONFIG.HEADER.CONFIG_BTN_MARGIN;
    const configBtnY = headerHeight - configBtnSize - configBtnMargin + LAYOUT_CONFIG.HEADER.CONFIG_BTN_OFFSET_Y;
    const configBtnX = width - LAYOUT_CONFIG.HEADER.CONFIG_BTN_RIGHT;
    
    if (configBtnImage) {
        ctx.drawImage(configBtnImage, configBtnX, configBtnY, configBtnSize, configBtnSize);
    }
    
    // UI Manager にコンフィグボタンの領域を登録 (第7層相当)
    UIManager.updateButtonRect('configBtn', 7, configBtnX, configBtnY, configBtnSize, configBtnSize);

    // レベル表示 (3段非対称レイアウト)
    ctx.save();
    const lbc = LAYOUT_CONFIG.LEVEL_BOX;
    const boxWidth = lbc.WIDTH;
    const boxHeight = lbc.HEIGHT;
    const boxX = width / 2 - boxWidth / 2;
    const boxY = headerHeight - boxHeight / 2 + lbc.BOX_Y_OFFSET;

    ctx.fillStyle = lbc.BG_COLOR;
    ctx.strokeStyle = lbc.BORDER_COLOR;
    ctx.lineWidth = lbc.BORDER_WIDTH;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, lbc.BORDER_RADIUS);
    ctx.fill();
    ctx.stroke();

    const centerX = width / 2;
    const centerY = headerHeight + lbc.BOX_Y_OFFSET;

    // ダイアゴナルラインの描画 (テキストの背後)
    ctx.beginPath();
    ctx.moveTo(boxX + lbc.DIAGONAL_LINE_START_X_OFFSET, centerY + lbc.DIAGONAL_LINE_START_Y_OFFSET);
    ctx.lineTo(boxX + boxWidth + lbc.DIAGONAL_LINE_END_X_OFFSET, centerY + lbc.DIAGONAL_LINE_END_Y_OFFSET);
    ctx.strokeStyle = lbc.DIAGONAL_LINE_COLOR;
    ctx.lineWidth = lbc.DIAGONAL_LINE_WIDTH;
    ctx.stroke();

    // 1段目: Lv (中央基準)
    ctx.fillStyle = lbc.LV_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = lbc.LV_SHADOW_COLOR;
    ctx.shadowBlur = lbc.LV_SHADOW_BLUR;
    ctx.font = lbc.LV_FONT_SIZE;
    ctx.fillText(`Lv. ${levelValue}`, centerX, centerY + lbc.LV_Y_OFFSET);

    // EXP計算
    const currentNextLevelExp = Math.floor(LEVEL_CONFIG.BASE_REQUIRE_EXP * Math.pow(LEVEL_CONFIG.EXP_CURVE_MULTIPLIER, GameState.displayLevel - 1));

    // 2段目: 現在の経験値 (ボックス左下基準、左揃え)
    ctx.shadowBlur = 0;
    ctx.fillStyle = lbc.EXP_CURRENT_COLOR;
    ctx.textAlign = 'left';
    ctx.font = lbc.EXP_CURRENT_FONT_SIZE;
    ctx.fillText(Math.floor(GameState.displayExp).toString(), boxX + lbc.EXP_CURRENT_X_OFFSET, centerY + lbc.EXP_CURRENT_Y_OFFSET);

    // 3段目: 次レベルまでの必要経験値 (ボックス右下基準、右揃え)
    ctx.fillStyle = lbc.EXP_NEXT_COLOR;
    ctx.textAlign = 'right';
    ctx.font = lbc.EXP_NEXT_FONT_SIZE;
    ctx.fillText(currentNextLevelExp.toString(), boxX + boxWidth + lbc.EXP_NEXT_X_OFFSET, centerY + lbc.EXP_NEXT_Y_OFFSET);

    ctx.restore();



    const isMobile = cssWidth <= 600;
    const mobileScale = isMobile ? 0.8 : 1.0;

    // ボトムアップ（下寄せ）配置のY座標計算
    const uiMarginBottom = LAYOUT_CONFIG.HEADER.UI_MARGIN_BOTTOM;
    const row2Y = headerHeight - uiMarginBottom - (LAYOUT_CONFIG.HEADER.ROW2_BASE_HEIGHT * mobileScale) + LAYOUT_CONFIG.HEADER.ROW2_OFFSET_Y;
    const row1Y = row2Y - (LAYOUT_CONFIG.HEADER.ROW1_BASE_HEIGHT * mobileScale);
    const topRowY = row1Y - (LAYOUT_CONFIG.HEADER.TOP_ROW_BASE_HEIGHT * mobileScale) - LAYOUT_CONFIG.HEADER.TOP_ROW_OFFSET_Y;

    // 1. Timer
    let timerScaleY = LAYOUT_CONFIG.HEADER.TIMER_SCALE_Y * mobileScale;
    let timerScaleX = LAYOUT_CONFIG.HEADER.TIMER_SCALE_X * mobileScale;
    let timerY = topRowY + LAYOUT_CONFIG.HEADER.TIMER_OFFSET_Y;
    let timerX = LAYOUT_CONFIG.HEADER.TIMER_X;
    drawString(ctx, timerStr, 'char', timerX, timerY, timerScaleX, timerScaleY, -1);

    // 2. Decay Rate (TIME COST)
    let decayScale = LAYOUT_CONFIG.HEADER.DECAY_SCALE * mobileScale;
    let decayY = row1Y;
    let decayTitleWidth = measureString("TIME COST:", 'char-orange', decayScale, -1);
    let decayValWidth = measureString(decayStr, 'char-orange', decayScale, -1);
    let decayValX = timerX + decayTitleWidth - decayValWidth;
    drawString(ctx, "TIME COST:", 'char-orange', timerX, decayY, decayScale, decayScale, -1);
    drawString(ctx, decayStr, 'char-orange', decayValX, row2Y, decayScale, decayScale, -1);

    // 3. Tap Cost
    let tapCostScale = decayScale;
    let tapCostX = timerX + decayTitleWidth + LAYOUT_CONFIG.HEADER.TAP_COST_GAP;
    let tapCostY = decayY;

    let tapCostValStr = "- " + Math.floor(tapCostValue);
    let tapCostTitleWidth = measureString("TAP COST:", 'char-orange', tapCostScale, -1);
    let tapCostValWidth = measureString(tapCostValStr, 'char-orange', tapCostScale, -1);
    let tapCostValX = tapCostX + tapCostTitleWidth - tapCostValWidth;

    drawString(ctx, "TAP COST:", 'char-orange', tapCostX, tapCostY, tapCostScale, tapCostScale, -1);
    drawString(ctx, tapCostValStr, 'char-orange', tapCostValX, row2Y, tapCostScale, tapCostScale, -1);

    // 4. Score
    const maxDigitsScore = isMobile ? AppConfig.SCORE_DIGIT_LIMITS.MOBILE.SCORE : AppConfig.SCORE_DIGIT_LIMITS.PC.SCORE;
    const scoreData = generateScoreData(scoreValue, maxDigitsScore);
    const scorePaddingRight = LAYOUT_CONFIG.HEADER.SCORE_PADDING_RIGHT;
    
    let scoreBaseScaleX = LAYOUT_CONFIG.HEADER.SCORE_SCALE_X * mobileScale;
    let scoreBaseScaleY = LAYOUT_CONFIG.HEADER.SCORE_SCALE_Y * mobileScale;

    let scoreTotalWidth = measureScoreData(scoreData, scoreBaseScaleX);
    let scoreMaxAvailWidth = isMobile ? (cssWidth * LAYOUT_CONFIG.HEADER.SCORE_MAX_WIDTH_RATIO_MOBILE - LAYOUT_CONFIG.HEADER.SCORE_MAX_WIDTH_OFFSET_MOBILE) : (cssWidth * LAYOUT_CONFIG.HEADER.SCORE_MAX_WIDTH_RATIO_PC - LAYOUT_CONFIG.HEADER.SCORE_MAX_WIDTH_OFFSET_PC);
    
    let currentScoreScaleX = scoreBaseScaleX;
    let currentScoreScaleY = scoreBaseScaleY;

    if (scoreTotalWidth > scoreMaxAvailWidth && scoreMaxAvailWidth > 0) {
        let shrinkRatio = scoreMaxAvailWidth / scoreTotalWidth;
        currentScoreScaleX *= shrinkRatio;
        currentScoreScaleY *= shrinkRatio;
        scoreTotalWidth = scoreMaxAvailWidth;
    }
    const scoreX = cssWidth - scorePaddingRight - scoreTotalWidth;
    const scoreY = topRowY + LAYOUT_CONFIG.HEADER.SCORE_OFFSET_Y;
    drawScoreData(ctx, scoreData, scoreX, scoreY, currentScoreScaleX, currentScoreScaleY);

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

    drawScoreData(ctx, fullRateData1, rateX1, rateY1, rateScale);
    drawScoreData(ctx, fullRateData2, rateX2, rateY2, rateScale);



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

