import { AppConfig, activeColors } from '../core/config.js';

export class BackgroundVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.amplitudes = {};
        this.time = 0;
        
        for (const color of activeColors) {
            this.amplitudes[color] = 1.0;
        }

        window.addEventListener('resize', () => this.resize());
    }

    getCanvas() {
        if (!this.canvas) {
            this.canvas = document.getElementById('visualizer-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resize();
            }
        }
        return this.canvas;
    }

    resize() {
        if (!this.canvas) return;
        const header = document.getElementById('puzzle-header');
        if (header) {
            this.canvas.width = header.clientWidth;
            this.canvas.height = header.clientHeight;
        }
    }

    triggerSpike(color) {
        if (this.amplitudes[color] !== undefined) {
            this.amplitudes[color] = 5.0; // スパイク状態
        }
    }

    updateAndDraw(GameState) {
        if (!this.getCanvas() || !this.ctx) return;

        if (AppConfig.VISUALIZER_MODE === 'OFF') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // 振幅の減衰 (1.0に向けてイージング)
        for (const color of activeColors) {
            if (this.amplitudes[color] > 1.0) {
                this.amplitudes[color] += (1.0 - this.amplitudes[color]) * 0.1;
                // 1.0に十分近づいたら1.0に丸める
                if (this.amplitudes[color] < 1.01) {
                    this.amplitudes[color] = 1.0;
                }
            }
        }

        this.time += 0.05;

        // 最大破壊数の取得（割合計算用）
        let maxCount = 1; // 0割回避
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 0;
            if (count > maxCount) maxCount = count;
        }

        if (AppConfig.VISUALIZER_MODE === 'WAVE') {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            for (let i = 0; i < activeColors.length; i++) {
                const color = activeColors[i];
                const count = GameState.colorDestroyCounts[color] || 0;
                let proportion = count / maxCount;
                
                // 初期状態など全く破壊されていない場合
                if (maxCount === 1) {
                    proportion = 0;
                }
                
                // 振幅 = ベースの高さ(30%) * 割合 * スパイク倍率
                const amplitude = (height * 0.3) * proportion * this.amplitudes[color];
                // 色ごとに波長や位相をずらす
                const frequency = 0.02 + i * 0.005;
                const phase = this.time + i * Math.PI / 4;
                
                ctx.beginPath();
                // 描画開始位置は下部
                ctx.moveTo(0, height);
                for (let x = 0; x <= width; x += 5) {
                    // 波形の基本Y座標はヘッダー高さの80%あたり
                    const y = height - (height * 0.1) - Math.sin(x * frequency + phase) * amplitude;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, height);
                ctx.closePath();
                
                ctx.globalAlpha = 0.6; 
                
                // グラデーションを作成して上部を透明に、下部を色濃く
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, color);
                grad.addColorStop(1, color);
                
                ctx.fillStyle = grad;
                ctx.fill();
            }
            ctx.restore();

        } else if (AppConfig.VISUALIZER_MODE === 'BLOCK') {
            ctx.save();
            
            const numColors = activeColors.length;
            const blockWidth = (width - 20) / numColors - 10;
            const maxBlocks = 8;
            const blockHeight = (height - 20) / maxBlocks - 2;
            
            for (let i = 0; i < numColors; i++) {
                const color = activeColors[i];
                const count = GameState.colorDestroyCounts[color] || 0;
                let proportion = count / maxCount;
                if (maxCount === 1) proportion = 0;
                
                const spike = this.amplitudes[color]; // 1.0 ~ 5.0
                
                // 破壊割合に応じたブロック数に、スパイク時のボーナスを加算
                let activeBlocks = Math.floor(proportion * maxBlocks);
                if (spike > 1.5) {
                    activeBlocks += Math.floor((spike - 1.0) * 1.5);
                }
                if (activeBlocks > maxBlocks) activeBlocks = maxBlocks;
                
                const x = 15 + i * (blockWidth + 10);
                
                for (let b = 0; b < activeBlocks; b++) {
                    const y = height - 10 - (b + 1) * (blockHeight + 2);
                    ctx.globalAlpha = (b / maxBlocks > 0.6) ? 1.0 : 0.6; // 高い位置ほど不透明度を上げる
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, blockWidth, blockHeight);
                }
            }
            ctx.restore();
        }
    }
}
