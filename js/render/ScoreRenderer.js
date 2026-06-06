// ScoreRenderer.js
import { FLOATING_TEXT_CONFIG } from '../core/config.js';
import { parseScoreData } from '../core/score.js';

const scoreSpriteCache = new Map();

// スコア表示用スプライトの事前生成
export function initScoreSpriteCache() {
    scoreSpriteCache.clear();
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ':', '-', 's', '/', ' '];
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

export function createScoreCanvas(scoreValue, isFull) {
    const scoreData = parseScoreData(scoreValue, isFull);
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

export function drawScoreToCanvas(scoreValue, isFull) {
    const canvas = document.getElementById('score-canvas');
    if (!canvas) return;
    const board = document.getElementById('score-board');
    if (!board) return;

    const scoreData = parseScoreData(scoreValue, isFull);
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
                simX += 1; // 単位マージン
            }
        }
    }

    // スコアベース枠の余白など
    const containerWidth = board.clientWidth;
    const containerHeight = board.clientHeight || 42;

    // キャンバスの内部解像度をコンテナ幅に合わせる（スケール用）
    if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paddingRight = 16; // 桁文字1つ入れるだけのマージン
    let scale = 1;
    if ((totalWidth + paddingRight) > containerWidth && containerWidth > 0) {
        scale = containerWidth / (totalWidth + paddingRight);
    }

    ctx.save();
    const drawWidth = totalWidth * scale;
    const drawX = containerWidth - paddingRight * scale - drawWidth;

    // 右寄せ、垂直方向は中央合わせ
    const drawY = (containerHeight - maxHeight) / 2; // スケール後も高さは変わらないため maxHeight をそのまま使用
    ctx.translate(drawX, drawY);
    if (scale < 1) {
        ctx.scale(scale, 1); // X軸のみ縮小（長体）
    }

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

export function drawTextToCanvas(canvasId, text, prefix = 'char', letterSpacing = 0) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let totalWidth = 0;
    const maxHeight = 42;
    const sprites = [];

    let simX = 0;
    for (const c of text) {
        const sprite = scoreSpriteCache.get(`${prefix}-${c}`);
        if (sprite) {
            sprites.push(sprite);
            totalWidth = Math.max(totalWidth, simX + sprite.width);
            simX += (sprite.advanceWidth || sprite.width) + letterSpacing;
        }
    }

    if (totalWidth <= 0) return;

    if (canvas.width !== totalWidth || canvas.height !== maxHeight) {
        canvas.width = totalWidth;
        canvas.height = maxHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let currentX = 0;
    for (const sprite of sprites) {
        ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, currentX, 0, sprite.width, sprite.height);
        currentX += (sprite.advanceWidth || sprite.width) + letterSpacing;
    }
}
