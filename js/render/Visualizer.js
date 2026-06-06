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

        // 最小・最大破壊数の取得
        let minCount = Infinity;
        let maxCount = 0;
        let totalCount = 0;
        let activeColorCount = activeColors.length;
        
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 1;
            totalCount += count;
            if (count < minCount) minCount = count;
            if (count > maxCount) maxCount = count;
        }
        if (minCount === Infinity) minCount = 1;
        if (maxCount === 0) maxCount = 1;
        const averageCount = totalCount / activeColorCount;

        // デバッグ表示用の文字列構築
        let debugHTML = "";
        let totalStats = 0;
        for (const color of activeColors) {
            totalStats += GameState.stats[color] || 0;
        }
        if (AppConfig.DEBUG_MODE) {
            debugHTML += `全　破壊合計 ${totalStats}個<br>`;
        }

        // 色ごとの効率と割合を事前計算してイージングを適用
        const visualData = {};
        for (const color of activeColors) {
            const count = GameState.colorDestroyCounts[color] || 1;
            
            // 実際のEXP獲得効率（ロジック計算・デバッグ用：ペナルティのみ）
            const actualEfficiency = minCount / count;
            
            // ビジュアル用のターゲット効率（平均を0.5とし、平均からの差分で表現）
            let visualTarget = 0.5 + 0.5 * ((averageCount - count) / averageCount);
            if (visualTarget > 1.0) visualTarget = 1.0;
            if (visualTarget < 0.0) visualTarget = 0.0;
            
            // 加速度付きの追従（イージング）はビジュアル用に対して行う
            if (this.efficiencies[color] === undefined) {
                this.efficiencies[color] = visualTarget;
            }
            this.efficiencies[color] += (visualTarget - this.efficiencies[color]) * 0.05;
            
            const proportion = count / maxCount;
            
            visualData[color] = {
                efficiency: this.efficiencies[color],
                proportion: proportion
            };

            if (AppConfig.DEBUG_MODE) {
                let colorName = "不明";
                if (color === '#FF3B30') colorName = "赤";
                else if (color === '#007AFF') colorName = "青";
                else if (color === '#34C759') colorName = "緑";
                else if (color === '#FFCC00') colorName = "黄";
                else if (color === '#AF52DE') colorName = "紫";
                else if (color === '#FF9500') colorName = "橙";
                else if (color === '#5AC8FA') colorName = "水";

                const actualCount = GameState.stats[color] || 0;
                const effPercent = (actualEfficiency * 100).toFixed(1);
                const actualCountStr = actualCount.toString().padStart(3, '0');
                const effStr = effPercent.padStart(5, '0');
                debugHTML += `${colorName}　破壊 ${actualCountStr}個 / 効率 ${effStr}%<br>`;
            }
        }

        if (AppConfig.DEBUG_MODE) {
            const debugOverlay = document.getElementById('debug-overlay');
            if (debugOverlay) {
                debugOverlay.innerHTML = debugHTML;
            }
        }

        if (AppConfig.VISUALIZER_MODE === 'WAVE') {
            const waveData = [];
            const maxWaveX = width * 0.9; // 最大X座標（100%時）
            
            // BGMのFFTデータを取得
            let freqData = null;
            if (window.soundManager) {
                freqData = window.soundManager.getBgmFrequencyData();
            }
            
            for (let i = 0; i < activeColors.length; i++) {
                const color = activeColors[i];
                const { efficiency } = visualData[color];
                
                const spikeLevel = this.amplitudes[color]; // 1.0(通常) 〜 5.0(破壊時)
                const isSpiking = Math.max(0, spikeLevel - 1.0); // 0.0 〜 4.0
                
                // 本質：X軸の中心座標は経験値効率に完全固定
                const baseX = maxWaveX * efficiency;
                
                // 波形の頂点（ポイント）を事前計算
                const points = [];
                
                // 動的マッピング：色の順番(i)に応じて、全音域を自動で分割して割り当てる
                let audioVol = 0;
                if (freqData && activeColors.length > 0) {
                    // 音楽のエネルギーが集中する実用的な帯域（低音〜中高音：128個分）を色数で等分
                    const usableBins = 128;
                    const binsPerColor = Math.floor(usableBins / activeColors.length);
                    const startBin = i * binsPerColor;
                    
                    let sum = 0;
                    for (let j = 0; j < binsPerColor; j++) {
                        sum += freqData[startBin + j];
                    }
                    // その帯域の平均音量を 0.0 〜 1.0 に正規化
                    audioVol = (sum / binsPerColor) / 255.0;
                }
                
                // グリッチ（衝撃）の基本更新頻度
                const timeInt = Math.floor(this.time * 5);
                
                for (let y = 0; y <= height; y += 4) {
                    // Y座標、時間、色インデックスを混ぜて一意の乱数シードを作る
                    const seed = y * 12.9898 + timeInt * 78.233 + i * 137.5;
                    const hash = Math.sin(seed) * 43758.5453;
                    const rand = hash - Math.floor(hash); // 0.0 ~ 1.0
                    
                    // 衝撃（グリッチ）の発生確率
                    // オーディオ音量が大きいほど確率が跳ね上がる。破壊時はさらに確率上昇
                    const prob = 0.02 + (audioVol * 0.15) + 0.28 * (isSpiking / 4.0);
                    
                    let offsetX = 0;
                    if (rand < prob) {
                        // 衝撃の方向と大きさ（-1.0 ~ 1.0）
                        const hash2 = Math.sin(seed * 1.5) * 43758.5453;
                        const rand2 = (hash2 - Math.floor(hash2)) * 2.0 - 1.0;
                        
                        // 衝撃の最大幅。
                        // 音量が大きいほどブレ幅が広がり、宝石破壊時にはさらに爆発的に広がる
                        const baseJitter = (width * 0.01) + (width * 0.03) * audioVol;
                        const maxAmp = baseJitter + (width * 0.08) * (isSpiking / 4.0);
                        offsetX = rand2 * maxAmp;
                    }
                    
                    points.push({ x: baseX + offsetX, y });
                }
                
                waveData.push({ color, baseX, points });
            }

            // 【A. 塗りフェーズ（右側のうっすらとした領域）】
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const data of waveData) {
                ctx.beginPath();
                ctx.moveTo(data.baseX, 0);
                
                for (const pt of data.points) {
                    ctx.lineTo(pt.x, pt.y);
                }
                
                // 右端の領域を閉じる
                ctx.lineTo(width, height);
                ctx.lineTo(width, 0);
                ctx.closePath();
                
                // 直線を際立たせるため、塗りの不透明度は低めに抑える
                ctx.globalAlpha = 0.1; 
                ctx.fillStyle = data.color;
                ctx.fill();
            }
            ctx.restore();

            // 【B. 実線フェーズ（オシロスコープのレーザー線）】
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            // 1. 太いグロウ（ぼかし・残像）
            ctx.lineWidth = 6;
            for (const data of waveData) {
                ctx.beginPath();
                let first = true;
                for (const pt of data.points) {
                    if (first) {
                        ctx.moveTo(pt.x, pt.y);
                        first = false;
                    } else {
                        ctx.lineTo(pt.x, pt.y);
                    }
                }
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = data.color;
                ctx.stroke();
            }
            
            // 2. 細いコアライン（中心の鋭いレーザー）
            ctx.lineWidth = 1.5;
            for (const data of waveData) {
                ctx.beginPath();
                let first = true;
                for (const pt of data.points) {
                    if (first) {
                        ctx.moveTo(pt.x, pt.y);
                        first = false;
                    } else {
                        ctx.lineTo(pt.x, pt.y);
                    }
                }
                ctx.globalAlpha = 1.0;
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
