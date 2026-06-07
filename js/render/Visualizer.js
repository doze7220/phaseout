import { AppConfig, activeColors, VISUALIZER_MATH_CONFIG } from '../core/config.js';
import { soundManager } from './SoundManager.js';

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
            this.amplitudes[color] = VISUALIZER_MATH_CONFIG.SPIKE_AMPLITUDE; // スパイク状態
        }
    }

    updateAndDraw(GameState) {
        if (!this.getCanvas() || !this.ctx) return;

        if (AppConfig.EFFECT_LEVEL === 'NONE') {
            // mode = 'BLOCK_NONE' として扱うためここではスキップしない
        }

        let mode = 'WAVE';
        if (AppConfig.EFFECT_LEVEL === 'LITE') mode = 'BLOCK';
        if (AppConfig.EFFECT_LEVEL === 'NONE') mode = 'BLOCK_NONE';

        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // 振幅の減衰 (1.0に向けてイージング)
        for (const color of activeColors) {
            if (this.amplitudes[color] > 1.0) {
                this.amplitudes[color] += (1.0 - this.amplitudes[color]) * VISUALIZER_MATH_CONFIG.AMPLITUDE_DECAY;
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
            
            if (soundManager) {
                const vols = soundManager.getStageBgmVolumes();
                if (vols) {
                    const padSp = (num, len) => {
                        let s = num.toString();
                        while (s.length < len) s = '&nbsp;' + s;
                        return s;
                    };
                    debugHTML += `<br>BGM normal:&nbsp;&nbsp;${padSp(vols.normal, 3)}%<br>`;
                    debugHTML += `BGM fever :&nbsp;&nbsp;${padSp(vols.fever, 3)}%<br>`;
                    debugHTML += `BGM pinch :&nbsp;&nbsp;${padSp(vols.pinch, 3)}%<br><br>`;
                }
            }
        }

        // BGMのFFTデータを取得 (NONEの時は取得しない)
        let freqData = null;
        if (soundManager && mode !== 'BLOCK_NONE') {
            freqData = soundManager.getBgmFrequencyData();
        }

        // 色ごとの効率と割合を事前計算してイージングを適用
        const visualData = {};
        for (let i = 0; i < activeColors.length; i++) {
            const color = activeColors[i];
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
            this.efficiencies[color] += (visualTarget - this.efficiencies[color]) * VISUALIZER_MATH_CONFIG.TARGET_EASING;

            const proportion = count / maxCount;

            // --- 音響データ（audioVol）の算出 ---
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

            visualData[color] = {
                efficiency: this.efficiencies[color],
                proportion: proportion,
                audioVol: audioVol
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
                debugHTML += `${colorName}　破壊 ${actualCountStr}個 / 効率 ${effStr}% / FFT ${(audioVol * 100).toFixed(1)}%<br>`;
            }
        }

        if (AppConfig.DEBUG_MODE) {
            const debugOverlay = document.getElementById('debug-overlay');
            if (debugOverlay) {
                debugOverlay.innerHTML = debugHTML;
            }
        }

        if (mode === 'WAVE') {
            const waveData = [];
            const maxWaveX = width * 0.9; // 最大X座標（100%時）

            for (let i = 0; i < activeColors.length; i++) {
                const color = activeColors[i];
                const { efficiency, audioVol } = visualData[color];

                const spikeLevel = this.amplitudes[color]; // 1.0(通常) 〜 5.0(破壊時)
                const isSpiking = Math.max(0, spikeLevel - 1.0); // 0.0 〜 4.0

                // 本質：X軸の中心座標は経験値効率に完全固定
                const baseX = maxWaveX * efficiency;

                // 波形の頂点（ポイント）を事前計算
                const points = [];

                // グリッチ（衝撃）の基本更新頻度
                const timeInt = Math.floor(this.time * 5);

                // WAVEモード：自分の帯域（ビン）のデータを全画面高さ（0〜height）に引き伸ばして表示する
                const numBands = activeColors.length;
                const binsPerColor = Math.floor(128 / numBands);
                const startBin = i * binsPerColor;

                for (let y = 0; y <= height; y += 4) {
                    let offsetX = 0;

                    if (freqData) {
                        // Y座標(0〜height)を、この色の担当する「binsPerColor」個のビンに拡大マッピング
                        const localBinIndex = Math.floor((y / height) * binsPerColor);
                        const binIndex = startBin + Math.min(binsPerColor - 1, localBinIndex);

                        let val = freqData[binIndex] / 255.0;
                        val = Math.pow(val, VISUALIZER_MATH_CONFIG.WAVE_POWER);

                        // 振幅の幅は控えめにしつつ、全画面で激しく交差させる
                        const maxAmp = (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_BASE) + (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_AUDIO_MULTI) * audioVol + (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_SPIKE_MULTI) * (isSpiking / 4.0);

                        // スペクトラム波形のように左右に激しくジグザグさせる
                        const sign = (Math.floor(y / 4) % 2 === 0) ? -1 : 1;

                        offsetX = sign * (val * maxAmp);
                    } else {
                        // 微かなノイズ
                        offsetX = (Math.random() - 0.5) * 2;
                    }

                    points.push({ x: baseX + offsetX, y });
                }

                waveData.push({ color, baseX, points });
            }

            // 【A. 塗りフェーズ（右側のうっすらとした領域）】
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (const data of waveData) {
                if (data.points.length === 0) continue;
                ctx.beginPath();
                ctx.moveTo(data.baseX, 0);

                for (const pt of data.points) {
                    ctx.lineTo(pt.x, pt.y);
                }

                // 右端の領域を閉じる（全画面）
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

        } else if (mode === 'BLOCK' || mode === 'BLOCK_NONE') {
            ctx.save();
            const isNone = (mode === 'BLOCK_NONE');
            const numColors = activeColors.length;
            const meterHeight = height / numColors;
            const maxWaveX = width * 0.9;

            for (let i = 0; i < numColors; i++) {
                const color = activeColors[i];
                const { efficiency, audioVol } = visualData[color];

                // 常時の脈動（±3%程度のランダムな揺らぎ）
                const pulsation = isNone ? 0 : Math.sin(this.time * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_SPEED_1 + i) * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_AMP + Math.sin(this.time * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_SPEED_2 - i) * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_AMP;

                // オーディオによる揺らぎ（音量に応じて前後に数%揺れる）
                const audioPulsation = isNone ? 0 : audioVol * VISUALIZER_MATH_CONFIG.BLOCK_AUDIO_PULSE_AMP * Math.sin(this.time * VISUALIZER_MATH_CONFIG.BLOCK_AUDIO_PULSE_SPEED + i * 2);

                // スパイクによる右への跳ね上がり（WAVEと同様にヘッド位置を加算）
                const spikeBonus = (this.amplitudes[color] - 1.0) * VISUALIZER_MATH_CONFIG.BLOCK_SPIKE_BONUS_MULTI;

                let targetProportion = efficiency + pulsation + audioPulsation + spikeBonus;
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

                // 帯域分割
                const binsPerColor = Math.floor(128 / numColors);
                const startBin = i * binsPerColor;

                for (let s = 0; s < maxSlits; s++) {
                    const x = s * step;

                    let thicknessMod = 0;
                    if (!isNone && freqData) {
                        // X座標をこの色の担当帯域のビンにマッピング
                        const localBinIndex = Math.floor((x / width) * binsPerColor);
                        const binIndex = startBin + Math.min(binsPerColor - 1, localBinIndex);
                        let val = freqData[binIndex] / 255.0;
                        val = Math.pow(val, 1.2);

                        // メーターの高さを最大で40%ほど変動させ、スペクトラム波形を表現
                        const maxAmp = meterHeight * 0.4;
                        thicknessMod = val * maxAmp;
                    }

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

                    // thicknessModを加味して上下に波形のように膨らませる
                    ctx.fillRect(x, barTop - thicknessMod / 2, slitWidth, barThickness + thicknessMod);
                }
            }
            ctx.restore();
        }
    }
}
