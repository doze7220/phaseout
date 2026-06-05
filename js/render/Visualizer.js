import { AppConfig, activeColors } from '../core/config.js';

export class BackgroundVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.amplitudes = {};
        this.efficiencies = {};
        this.time = 0;
        
        for (const color of activeColors) {
            this.amplitudes[color] = 1.0;
            this.efficiencies[color] = 1.0;
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

        // 最小・最大破壊数の取得（効率および割合計算用）
        let minCount = Infinity;
        let maxCount = 0;
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 0;
            if (count < minCount) minCount = count;
            if (count > maxCount) maxCount = count;
        }
        if (minCount === Infinity) minCount = 0;
        if (maxCount === 0) maxCount = 1;

        // 色ごとの効率と割合を事前計算してイージングを適用
        const visualData = {};
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 0;
            let targetEfficiency = 1.0;
            if (count > 0) {
                targetEfficiency = minCount / count;
            }
            
            // 加速度付きの追従（イージング）
            if (this.efficiencies[color] === undefined) {
                this.efficiencies[color] = targetEfficiency;
            }
            this.efficiencies[color] += (targetEfficiency - this.efficiencies[color]) * 0.05;
            
            const proportion = count / maxCount;
            
            visualData[color] = {
                efficiency: this.efficiencies[color],
                proportion: proportion
            };
        }

        if (AppConfig.VISUALIZER_MODE === 'WAVE') {
            const waveData = [];
            const maxWaveX = width * 0.9; // 波の最大X座標（100%時）
            
            for (let i = 0; i < activeColors.length; i++) {
                const color = activeColors[i];
                const { efficiency, proportion } = visualData[color];
                
                // 振幅 = ベースの幅(5%) * 割合 * スパイク倍率
                const amplitude = (width * 0.05) * proportion * this.amplitudes[color];
                
                // 縦領域で1.5〜2周期になるよう動的に周波数を計算
                const loops = 1.5 + (i * 0.5) / activeColors.length;
                const frequency = (loops * 2 * Math.PI) / height;
                
                const phase = this.time + i * Math.PI / 4;
                const baseX = maxWaveX * efficiency;
                
                waveData.push({ color, amplitude, frequency, phase, baseX });
            }

            // 【A. 塗りフェーズ（グラデーション/背景）】
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const data of waveData) {
                ctx.beginPath();
                ctx.moveTo(data.baseX, 0);
                
                // 縦波のパスを生成
                for (let y = 0; y <= height; y += 5) {
                    const x = data.baseX + Math.sin(y * data.frequency + data.phase) * data.amplitude;
                    ctx.lineTo(x, y);
                }
                
                // 右端の領域を閉じる
                ctx.lineTo(width, height);
                ctx.lineTo(width, 0);
                ctx.closePath();
                
                ctx.globalAlpha = 0.2; 
                ctx.fillStyle = data.color;
                ctx.fill();
            }
            ctx.restore();

            // 【B. 実線フェーズ（最前面の波線）】
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = 2;
            for (const data of waveData) {
                ctx.beginPath();
                let first = true;
                for (let y = 0; y <= height; y += 5) {
                    const x = data.baseX + Math.sin(y * data.frequency + data.phase) * data.amplitude;
                    if (first) {
                        ctx.moveTo(x, y);
                        first = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.globalAlpha = 0.8;
                ctx.strokeStyle = data.color;
                ctx.stroke();
            }
            ctx.restore();

        } else if (AppConfig.VISUALIZER_MODE === 'BLOCK') {
            ctx.save();
            const numColors = activeColors.length;
            const meterHeight = height / numColors;
            const maxWaveX = width * 0.9;

            for (let i = 0; i < numColors; i++) {
                const color = activeColors[i];
                const { efficiency } = visualData[color];
                
                // 常時の脈動（±5%程度のランダムな揺らぎ）
                const pulsation = Math.sin(this.time * 2 + i) * 0.025 + Math.sin(this.time * 3.5 - i) * 0.025;
                
                // スパイクによる右への跳ね上がり（WAVEと同様にヘッド位置を加算）
                const spikeBonus = (this.amplitudes[color] - 1.0) * 0.05; 
                
                let targetProportion = efficiency + pulsation + spikeBonus;
                targetProportion = Math.max(0, Math.min(1.0, targetProportion));
                
                // WAVEモードと同じく、ヘッド（左端）のX座標を算出
                const baseX = maxWaveX * targetProportion;
                
                const yOffset = i * meterHeight;
                const meterCenterY = yOffset + meterHeight / 2;
                const barThickness = meterHeight * 0.6;
                const barTop = meterCenterY - barThickness / 2;
                
                ctx.fillStyle = color;
                
                // スリット入りバーの描画（固定位置のLED点灯・消灯方式）
                const slitWidth = 4;
                const slitGap = 2;
                const step = slitWidth + slitGap;
                const maxSlits = Math.floor(width / step);
                
                let headFound = false;
                
                for (let s = 0; s < maxSlits; s++) {
                    const x = s * step;
                    
                    // ブロックの中心位置が baseX を超えていれば点灯
                    if (x + slitWidth / 2 >= baseX) {
                        if (!headFound) {
                            ctx.globalAlpha = 0.9; // ヘッド部分（最も左側）のハイライト
                            headFound = true;
                        } else {
                            ctx.globalAlpha = 0.5; // 点灯状態
                        }
                    } else {
                        ctx.globalAlpha = 0.05; // 消灯状態（レトロ感を出すためのうっすらとした下地）
                    }
                    
                    ctx.fillRect(x, barTop, slitWidth, barThickness);
                }
            }
            ctx.restore();
        }
    }
}
