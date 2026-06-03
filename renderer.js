// renderer.js
import { SHAPE_CONFIG, COLOR_CONFIG } from './config.js';

const canvasCache = new Map();

// キャンバスキャッシュの生成（プレレンダリング）
export function initCanvasCache() {
    const activeShapes = SHAPE_CONFIG.filter(s => s.enabled).map(s => s.type);
    const activeColors = COLOR_CONFIG.filter(c => c.enabled);

    for (const shape of activeShapes) {
        for (let i = 0; i < activeColors.length; i++) {
            const colorDef = activeColors[i];
            const cacheKey = `${shape}-${i}`; // 形状-色ID
            
            // 基準サイズ（少し大きめのキャンバスを作成してはみ出し防止）
            const size = 120; 
            const baseRadius = 50; // キャッシュ内の描画基準半径
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            drawRichGem(ctx, size / 2, size / 2, baseRadius, shape, colorDef.color);
            
            canvasCache.set(cacheKey, canvas);
        }
    }
}

// リッチな宝石描画ロジック
function drawRichGem(ctx, x, y, radius, shape, color) {
    ctx.save();
    
    // 1. ベースとなるグラデーション（立体感）
    const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, radius*0.1, x, y, radius);
    grad.addColorStop(0, '#ffffff'); // ハイライト寄り
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, '#000000'); // シャドウ寄り
    
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
    } else if (shape === 'triangle') {
        const r = radius + 2;
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r * Math.cos(Math.PI/6), y + r * Math.sin(Math.PI/6));
        ctx.lineTo(x - r * Math.cos(Math.PI/6), y + r * Math.sin(Math.PI/6));
        ctx.closePath();
    } else if (shape === 'square') {
        const sqSize = radius * 2 * 0.8;
        if(ctx.roundRect) {
            ctx.roundRect(x - sqSize/2, y - sqSize/2, sqSize, sqSize, radius * 0.2);
        } else {
            ctx.rect(x - sqSize/2, y - sqSize/2, sqSize, sqSize);
        }
    } else if (shape === 'rectangle') {
        const w = radius * 1.5;
        const h = w * 2;
        if(ctx.roundRect) {
            ctx.roundRect(x - w/2, y - h/2, w, h, radius * 0.2);
        } else {
            ctx.rect(x - w/2, y - h/2, w, h);
        }
    }
    
    ctx.fill();
    ctx.clip(); // 内側にファセットを描画するためのクリッピング
    
    // 2. ファセット（カット面）の線
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    if (shape === 'circle') {
        ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        for(let i=0; i<8; i++) {
            const angle = (Math.PI / 4) * i;
            ctx.moveTo(x + Math.cos(angle)*radius*0.6, y + Math.sin(angle)*radius*0.6);
            ctx.lineTo(x + Math.cos(angle)*radius, y + Math.sin(angle)*radius);
        }
    } else if (shape === 'triangle') {
        const r = radius + 2;
        for(let i=0; i<3; i++) {
            const angle = -Math.PI/2 + (Math.PI * 2 / 3) * i;
            ctx.moveTo(x, y);
            ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
    } else if (shape === 'square') {
        const sqSize = radius * 2 * 0.8;
        ctx.moveTo(x - sqSize/2, y - sqSize/2); ctx.lineTo(x + sqSize/2, y + sqSize/2);
        ctx.moveTo(x + sqSize/2, y - sqSize/2); ctx.lineTo(x - sqSize/2, y + sqSize/2);
    } else if (shape === 'rectangle') {
        const w = radius * 1.5;
        const h = w * 2;
        ctx.moveTo(x - w/2, y - h/2); ctx.lineTo(x + w/2, y + h/2);
        ctx.moveTo(x + w/2, y - h/2); ctx.lineTo(x - w/2, y + h/2);
    }
    ctx.stroke();
    
    // 3. ハイライト（左上）
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(x - radius*0.3, y - radius*0.3, radius*0.3, 0, Math.PI*2);
    } else {
        ctx.arc(x - radius*0.2, y - radius*0.2, radius*0.3, 0, Math.PI*2);
    }
    ctx.fill();

    ctx.restore();
}

// Matter.jsのレンダリングループへのフック
export function hookCustomRenderer(Events, render, GEMS) {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        
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
                const scale = radius / baseRadius; 
                
                ctx.save();
                ctx.translate(gem.position.x, gem.position.y);
                ctx.rotate(gem.angle);
                ctx.scale(scale, scale);
                
                // 中央を原点として描画
                const size = cachedCanvas.width;
                ctx.drawImage(cachedCanvas, -size/2, -size/2);
                
                ctx.restore();
            }
        }
    });
}
