// renderer.js
import { GameState, SHAPE_CONFIG, COLOR_CONFIG, GRAPHICS_CONFIG, AppConfig, FLOATING_TEXT_CONFIG } from '../core/config.js';
import { formatScore, parseScoreData } from '../core/score.js';
import * as effects from './effects.js';

const canvasCache = new Map();
const scoreSpriteCache = new Map();

// スコア表示用スプライトの事前生成
export function initScoreSpriteCache() {
    scoreSpriteCache.clear();
    const chars = ['0','1','2','3','4','5','6','7','8','9','.', ':', '-', 's', '/', ' '];
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
            let astMetrics = {width: 0};
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
    const floatChars = ['0','1','2','3','4','5','6','7','8','9','+','-'];
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

export const AssetManager = {
    images: {},
    async loadAssets() {
        const shapes = ['circle', 'triangle', 'square', 'rectangle'];
        const promises = shapes.map(shape => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `./assets/img/gem/gem_${shape}.png`;
                img.onload = () => {
                    this.images[shape] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: gem_${shape}.png`);
                    resolve();
                };
            });
        });
        await Promise.all(promises);
    }
};

// キャンバスキャッシュの生成（プレレンダリング）
export function initCanvasCache() {
    const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
    const activeColors = COLOR_CONFIG.filter(c => c.enabled);

    for (const shape of activeShapes) {
        for (let i = 0; i < activeColors.length; i++) {
            const colorDef = activeColors[i];
            const cacheKey = `${shape}-${i}`; // 形状-色ID

            // 基準サイズ（少し大きめのキャンバスを作成してはみ出し防止）
            const size = 200; // 長方形(h=150)がはみ出さないように120から200に拡大
            const baseRadius = 50; // キャッシュ内の描画基準半径
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            drawRichGem(ctx, size / 2, size / 2, baseRadius, shape, colorDef.color);

            canvasCache.set(cacheKey, canvas);
        }
    }
    
    initScoreSpriteCache();
}

// キャッシュされた宝石スプライトの取得
export function getCachedGemSprite(shape, colorId) {
    return canvasCache.get(`${shape}-${colorId}`);
}

// 宝石描画ロジック
function drawRichGem(ctx, x, y, radius, shape, color) {
    ctx.save();

    const isFlat = GRAPHICS_CONFIG.GEM_STYLE === 'flat';

    // まずベースとなるシルエットを単色で描画
    ctx.fillStyle = color;
    ctx.beginPath();
    let drawW, drawH, drawX, drawY;

    if (shape === 'circle') {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        drawW = radius * 2; drawH = radius * 2;
        drawX = x - radius; drawY = y - radius;
    } else if (shape === 'triangle') {
        const r = radius + 2;
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
        ctx.lineTo(x - r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
        ctx.closePath();
        drawW = r * 2.2; drawH = r * 2.2; // 少し余裕を持たせる
        drawX = x - drawW / 2; drawY = y - r;
    } else if (shape === 'square') {
        const sqSize = radius * 2 * 0.8;
        if (ctx.roundRect) {
            ctx.roundRect(x - sqSize / 2, y - sqSize / 2, sqSize, sqSize, radius * 0.2);
        } else {
            ctx.rect(x - sqSize / 2, y - sqSize / 2, sqSize, sqSize);
        }
        drawW = sqSize; drawH = sqSize;
        drawX = x - sqSize / 2; drawY = y - sqSize / 2;
    } else if (shape === 'rectangle') {
        const w = radius * 1.5;
        const h = w * 2;
        if (ctx.roundRect) {
            ctx.roundRect(x - w / 2, y - h / 2, w, h, radius * 0.2);
        } else {
            ctx.rect(x - w / 2, y - h / 2, w, h);
        }
        drawW = w; drawH = h;
        drawX = x - w / 2; drawY = y - h / 2;
    }
    ctx.fill();

    // 縁取り（アウトライン）
    if (isFlat) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
    } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
    }
    ctx.stroke();

    if (!isFlat) {
        ctx.clip(); // シルエットの内側だけに画像を適用
        const img = AssetManager.images[shape];
        if (img) {
            // AI生成画像に含まれる周囲の余白を相殺するため、少し大きめに描画してはみ出させる
            let padScale = 1.35; 
            if (shape === 'triangle') padScale = 1.5; // 三角は少し小さめになりがちなので強めに
            if (shape === 'circle') padScale = 1.3;

            const finalW = drawW * padScale;
            const finalH = drawH * padScale;
            const finalX = drawX - (finalW - drawW) / 2;
            const finalY = drawY - (finalH - drawH) / 2;

            // overlay などの合成モードで、グレースケール画像の明暗をベース色にブレンドする
            ctx.globalCompositeOperation = 'overlay'; // overlay または hard-light など
            ctx.drawImage(img, finalX, finalY, finalW, finalH);
            
            // 明るさを補うためにスクリーン合成で少し乗せるのも効果的
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img, finalX, finalY, finalW, finalH);
        }
    }

    ctx.restore();
}

// Matter.jsのレンダリングループへのフック
export function hookCustomRenderer(Events, render, GEMS) {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const levelMultiplier = 1 + (GameState.level - 1) * 0.1;

        // フェーズ2: 完全停止時の脱色フィルター
        if (GameState.engine && GameState.engine.timing.timeScale === 0 && !GameState.disableStasisFilter) {
            ctx.filter = 'grayscale(100%) brightness(1.2)';
        }

        // Drum roll for displayScore
        if (GameState.displayScore !== GameState.actualScore) {
            let diff = GameState.actualScore - GameState.displayScore;
            let step = diff / 5n;
            if (step === 0n) step = (diff > 0n) ? 1n : -1n;
            
            GameState.displayScore += step;
            
            // オーバーシュート防止
            if ((diff > 0n && GameState.displayScore > GameState.actualScore) || 
                (diff < 0n && GameState.displayScore < GameState.actualScore)) {
                GameState.displayScore = GameState.actualScore;
            }
        }
        
        // スコアのCanvas描画を毎フレーム実行（DOMのオーバーヘッドはないので高速）
        drawScoreToCanvas(GameState.displayScore, AppConfig.TOTAL_SCORE_FORMAT_FULL);

        // 生成済みのキャッシュ画像を各宝石の座標・角度に合わせてスタンプ描画
        for (let i = 0; i < GEMS.length; i++) {
            const gem = GEMS[i];

            // gem.shapeKey は physics.js でオブジェクト生成時に付与する
            const cacheKey = `${gem.shapeKey}-${gem.colorId}`;
            const cachedCanvas = canvasCache.get(cacheKey);

            if (cachedCanvas) {
                const radius = gem.customRadius;
                const baseRadius = 50; // initCanvasCacheで指定した基準半径

                // 基準キャンバスに対するスケール比率
                let scale = radius / baseRadius;
                let isFlashing = false;
                let flashAlpha = 0.6;

                if (gem.render && gem.render.isTapOrigin) {
                    // 脈打ち（パルス）表現
                    const pulse = Math.sin(performance.now() / 100);
                    scale *= 1 + (0.05 * levelMultiplier * pulse);

                    // パーティクル発生
                    const spawnCount = Math.floor(1 * levelMultiplier);
                    effects.spawnSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, spawnCount);

                    // バースト発生（レーザー到達時）
                    if (effects.laserEffect.hasBurst(gem)) {
                        const burstCount = Math.floor(10 * levelMultiplier);
                        effects.spawnBurstSparks(gem.position.x, gem.position.y, gem.colorStr, levelMultiplier, burstCount, levelMultiplier);
                    }
                } else if (effects.laserEffect.getShrinkTimer(gem) > 0) {
                    // 沈み込み表現（縮小） - 限界は0.5
                    const shrink = Math.max(0.5, 0.85 - (levelMultiplier - 1) * 0.05);
                    scale *= shrink;
                    isFlashing = true;
                    // フラッシュの強度 - 上限0.9
                    flashAlpha = Math.min(0.9, 0.6 + (levelMultiplier - 1) * 0.1);
                }

                ctx.save();
                ctx.translate(gem.position.x, gem.position.y);
                ctx.rotate(gem.angle);
                ctx.scale(scale, scale);

                // 中央を原点として描画
                const size = cachedCanvas.width;
                ctx.drawImage(cachedCanvas, -size / 2, -size / 2);

                // フラッシュ表現
                if (isFlashing) {
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                    ctx.fillRect(-size / 2, -size / 2, size, size);
                }

                ctx.restore();
            }
        }

        // 描画終了時にフィルターをリセット
        if (GameState.engine && GameState.engine.timing.timeScale === 0 && !GameState.disableStasisFilter) {
            ctx.filter = 'none';
        }
    });
}
