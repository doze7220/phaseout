import { AppConfig, GameState, VISUALIZER_MATH_CONFIG, THEME_COLORS } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { soundManager } from './SoundManager.js';
import { TITLE_RANGES } from './title-animation.js';
import { PhaseManager } from '../core/PhaseManager.js';

const RenderStrategies = {
    WAVE: (ctx, width, height, visualData, processedData, amplitudes, time, activeColors, waveStepY) => {
        const waveData = [];
        const maxWaveX = width * 0.9; // 最大X座標（100%時）
        const size = height + 24; // Y座標 -12 〜 height+12
        const stepY = 4;
        
        for (let i = 0; i < activeColors.length; i++) {
            const color = activeColors[i];
            const { efficiency, audioVol } = visualData[color];

            const spikeLevel = amplitudes[color]; // 1.0(通常) 〜 5.0(破壊時)
            const isSpiking = Math.max(0, spikeLevel - 1.0); // 0.0 〜 4.0

            // 本質：X軸の中心座標は経験値効率に完全固定
            const baseX = maxWaveX * efficiency;

            // 波形の頂点（ポイント）を事前計算
            const coarsePoints = [];
            const steps = Math.floor(height / waveStepY);

            for (let s = 0; s <= steps; s++) {
                const y = s * waveStepY;
                let offsetX = 0;

                const dataIdx = i * (steps + 1) + s;
                let val = processedData[dataIdx];
                // 振幅の幅は控えめにしつつ、全画面で激しく交差させる
                // パズル画面用のWAVEでは「半分（0.5倍）」になるように係数を適用
                const maxAmp = ((width * VISUALIZER_MATH_CONFIG.WAVE_AMP_BASE) + (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_AUDIO_MULTI) * val + (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_SPIKE_MULTI) * (isSpiking / 4.0)) * 0.5;

                // スペクトラム波形のように左右に激しくジグザグさせる
                const sign = (s % 2 === 0) ? -1 : 1;

                if (val > 0) {
                    offsetX = sign * (val * maxAmp);
                } else {
                    offsetX = (Math.random() - 0.5) * 2;
                }

                coarsePoints.push({ x: baseX + offsetX, y });
            }

            // Lerp to draw smooth curve
            const points = [];
            const drawStep = 3;
            for (let y = 0; y <= height + drawStep; y += drawStep) {
                const index = y / waveStepY;
                const idx0 = Math.min(coarsePoints.length - 1, Math.floor(index));
                const idx1 = Math.min(coarsePoints.length - 1, idx0 + 1);
                const ratio = index - idx0;
                
                const p0 = coarsePoints[idx0];
                const p1 = coarsePoints[idx1];
                
                const x = p0.x * (1 - ratio) + p1.x * ratio;
                points.push({ x, y });
            }

            waveData.push({ color, baseX, points });
        }

        // =========================================================
        // 描画を2パス（Two-Pass）に分割し、波形の実線が他の色の塗りに隠れないようにする
        // =========================================================

        // 【Pass 1: 塗りフェーズ（波線の右側の領域）】
        // NONE設定時はパフォーマンス最適化のため塗りつぶしをスキップする
        if (AppConfig.EFFECT_LEVEL !== 'NONE') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.3;
            for (const data of waveData) {
                if (data.points.length === 0) continue;
                ctx.beginPath();
                
                // 最初のポイントから開始（上端の余白をカバー）
                ctx.moveTo(data.points[0].x, -10);

                for (const pt of data.points) {
                    ctx.lineTo(pt.x, pt.y);
                }

                // 最後のポイントから下端の余白をカバー
                const lastPt = data.points[data.points.length - 1];
                ctx.lineTo(lastPt.x, height + 10);

                // 右端の領域を閉じる（波線の右側から画面端までを塗る）
                const rightEdge = LAYOUT_CONFIG.BASE.WIDTH + 20; // 塗り足し分を含む右端
                ctx.lineTo(rightEdge, height + 10);
                ctx.lineTo(rightEdge, -10);
                ctx.closePath();

                ctx.fillStyle = data.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // 【Pass 2: 実線フェーズ（オシロスコープのレーザー線）】
        ctx.save();
        // lighter(加算合成)だと明るい塗りつぶし背景に線が溶け込んで見えなくなるため、source-overで確実に最前面に描画する
        ctx.globalCompositeOperation = 'source-over';

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
    },
    BLOCK: (ctx, width, height, visualData, processedData, amplitudes, time, activeColors, waveStepY, isNone = false) => {
        ctx.save();
        const numColors = activeColors.length;
        const meterHeight = height / numColors;
        const maxWaveX = width * 0.9;

        const slitWidth = 4;
        const slitGap = 2;
        const step = slitWidth + slitGap;
        const maxSlits = Math.floor(width / step);
        const steps = Math.floor(width / step);

        for (let i = 0; i < numColors; i++) {
            const color = activeColors[i];
            const { efficiency, audioVol } = visualData[color];

            // 常時の脈動（±3%程度のランダムな揺らぎ）
            const pulsation = isNone ? 0 : Math.sin(time * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_SPEED_1 + i) * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_AMP + Math.sin(time * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_SPEED_2 - i) * VISUALIZER_MATH_CONFIG.BLOCK_PULSE_AMP;

            // オーディオによる揺らぎ（音量に応じて前後に数%揺れる）
            const audioPulsation = isNone ? 0 : audioVol * VISUALIZER_MATH_CONFIG.BLOCK_AUDIO_PULSE_AMP * Math.sin(time * VISUALIZER_MATH_CONFIG.BLOCK_AUDIO_PULSE_SPEED + i * 2);

            // スパイクによる右への跳ね上がり（WAVEと同様にヘッド位置を加算）
            const spikeBonus = (amplitudes[color] - 1.0) * VISUALIZER_MATH_CONFIG.BLOCK_SPIKE_BONUS_MULTI;

            let targetProportion = efficiency + pulsation + audioPulsation + spikeBonus;
            targetProportion = Math.max(0, Math.min(1.0, targetProportion));

            // WAVEモードと同じく、ヘッド（左端）のX座標を算出
            const baseX = maxWaveX * targetProportion;

            const yOffset = i * meterHeight;
            const meterCenterY = yOffset + meterHeight / 2;
            const barThickness = meterHeight * 0.6;
            const barTop = meterCenterY - barThickness / 2;

            ctx.fillStyle = color;

            let headFound = false;

            for (let s = 0; s < maxSlits; s++) {
                const x = s * step;

                let thicknessMod = 0;
                if (!isNone && processedData) {
                    const dataIdx = i * (steps + 1) + s;
                    let val = processedData[dataIdx];
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
    },
    GLITCH: (ctx, width, height, visualData, processedData, amplitudes, time, activeColors, waveStepY) => {
        const waveData = [];
        const maxWaveX = width * 0.9;
        const size = height + 24;
        
        for (let i = 0; i < activeColors.length; i++) {
            const color = activeColors[i];
            const { efficiency } = visualData[color];

            const spikeLevel = amplitudes[color];
            const isSpiking = Math.max(0, spikeLevel - 1.0);

            // BGM音量には依存せず、効率のみをベースにする
            const baseX = maxWaveX * efficiency;

            const coarsePoints = [];
            const steps = Math.floor(height / waveStepY);

            for (let s = 0; s <= steps; s++) {
                const y = s * waveStepY;
                let offsetX = 0;

                // 心電図のようなランダムなスパイク（ノイズ）
                const glitchHash = Math.sin(time * VISUALIZER_MATH_CONFIG.GLITCH_TIME_MULTI + y * 0.2 + i * 100);
                const isGlitchSpike = glitchHash > VISUALIZER_MATH_CONFIG.GLITCH_THRESHOLD;
                
                const sign = (s % 2 === 0) ? -1 : 1;

                if (isGlitchSpike || isSpiking > 0) {
                    const spikeAmp = isGlitchSpike ? VISUALIZER_MATH_CONFIG.GLITCH_SPIKE_AMP : 0;
                    const destructAmp = width * VISUALIZER_MATH_CONFIG.WAVE_AMP_SPIKE_MULTI * (isSpiking / 4.0);
                    offsetX = sign * (spikeAmp + destructAmp);
                } else {
                    offsetX = sign * width * 0.005 * Math.random(); // 通常時はわずかな揺らぎのみ
                }

                coarsePoints.push({ x: baseX + offsetX, y });
            }

            const points = [];
            const drawStep = 3;
            for (let y = 0; y <= height + drawStep; y += drawStep) {
                const index = y / waveStepY;
                const idx0 = Math.min(coarsePoints.length - 1, Math.floor(index));
                const idx1 = Math.min(coarsePoints.length - 1, idx0 + 1);
                const ratio = index - idx0;
                
                const p0 = coarsePoints[idx0];
                const p1 = coarsePoints[idx1];
                
                const x = p0.x * (1 - ratio) + p1.x * ratio;
                points.push({ x, y });
            }

            waveData.push({ color, baseX, points });
        }

        // 塗りフェーズ (NONE時はスキップ)
        if (AppConfig.EFFECT_LEVEL !== 'NONE') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.2;
            for (const data of waveData) {
                if (data.points.length === 0) continue;
                ctx.beginPath();
                ctx.moveTo(data.points[0].x, -10);
                for (const pt of data.points) {
                    ctx.lineTo(pt.x, pt.y);
                }
                const lastPt = data.points[data.points.length - 1];
                ctx.lineTo(lastPt.x, height + 10);
                const rightEdge = LAYOUT_CONFIG.BASE.WIDTH + 20;
                ctx.lineTo(rightEdge, height + 10);
                ctx.lineTo(rightEdge, -10);
                ctx.closePath();
                ctx.fillStyle = data.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // 実線フェーズ
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 4;
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
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = data.color;
            ctx.stroke();
        }
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
    }
};

export class BackgroundVisualizer {
    constructor() {
        this.amplitudes = {};
        this.efficiencies = {};
        this.time = 0;
        // 注意: コンストラクタ時点ではGameState.activeColorsが未設定の場合があるため
        // updateAndDraw()で動的に初期化する
    }

    triggerSpike(color) {
        if (this.amplitudes[color] !== undefined) {
            this.amplitudes[color] = VISUALIZER_MATH_CONFIG.SPIKE_AMPLITUDE; // スパイク状態
        }
    }

    updateAndDraw(ctx, GameState) {
        if (!ctx) return;

        let mode = AppConfig.VISUALIZER_MODE || 'WAVE';
        const isNone = (AppConfig.EFFECT_LEVEL === 'NONE');

        // 論理座標のヘッダ領域に描画する
        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEADER_HEIGHT;
        
        ctx.save();
        // ヘッダ領域をクリップ (シェイク対策で左右上に10pxはみ出す)
        ctx.beginPath();
        ctx.rect(-10, -10, width + 20, height + 10);
        ctx.clip();

        // ヘッダ背景（黒）をここで描画 (塗り足し分を含める)
        ctx.fillStyle = '#000000';
        ctx.fillRect(-10, -10, width + 20, height + 10);

        // 振幅の減衰 (1.0に向けてイージング)
        const activeColors = GameState.activeColors;
        for (const color of activeColors) {
            // 新色がアンロックされた場合に動的に初期化
            if (this.amplitudes[color] === undefined) {
                this.amplitudes[color] = 1.0;
                this.efficiencies[color] = 1.0;
            }
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
        this.debugLines = [];
        let totalStats = 0;
        for (const color of activeColors) {
            totalStats += GameState.stats[color] || 0;
        }
        if (AppConfig.DEBUG_MODE) {
            this.debugLines.push(`全　破壊合計 ${totalStats}個`);
            this.debugLines.push(`フェイズ: ${PhaseManager.getCurrentPhaseName()}`);
            this.debugLines.push('');
            
            if (soundManager) {
                const vols = soundManager.getStageBgmVolumes();
                if (vols) {
                    const padSp = (num, len) => {
                        let s = num.toString();
                        while (s.length < len) s = ' ' + s;
                        return s;
                    };
                    this.debugLines.push(`BGM normal:  ${padSp(vols.normal, 3)}%`);
                    this.debugLines.push(`BGM fever :  ${padSp(vols.fever, 3)}%`);
                    this.debugLines.push(`BGM pinch :  ${padSp(vols.pinch, 3)}%`);
                    this.debugLines.push('');
                }
            }
        }

        // 帯域分割用の範囲 (20Hz から 11025Hz までの対数分割)
        const numColors = activeColors.length;
        const ranges = [];
        const minHz = 20;
        const maxHz = 11025;
        const ratio = Math.pow(maxHz / minHz, 1 / numColors);
        for (let i = 0; i < numColors; i++) {
            ranges.push({
                minHz: minHz * Math.pow(ratio, i),
                maxHz: minHz * Math.pow(ratio, i + 1)
            });
        }

        const preset = VISUALIZER_MATH_CONFIG.PRESETS[AppConfig.EFFECT_LEVEL || 'FULL'] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
        const waveStepY = preset.PUZZLE_STEP_X;

        // BGMのFFTデータを取得 (NONEの時は取得しない)
        let processedData = null;
        let stepsPerColor = 0;

        if (mode === 'WAVE' || mode === 'GLITCH') {
            stepsPerColor = Math.floor(height / waveStepY);
            processedData = (soundManager && !isNone && mode !== 'GLITCH')
                ? soundManager.getProcessedVisualizerData('game_wave', ranges, waveStepY, height, false)
                : new Float32Array(numColors * (stepsPerColor + 1));
        } else if (mode === 'BLOCK') {
            const slitWidth = 4;
            const slitGap = 2;
            const stepX = slitWidth + slitGap;
            stepsPerColor = Math.floor(width / stepX);
            processedData = (soundManager && !isNone)
                ? soundManager.getProcessedVisualizerData('game_block', ranges, stepX, width, false)
                : new Float32Array(numColors * (stepsPerColor + 1));
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

            // 平均値の計算
            let valSum = 0;
            for (let s = 0; s <= stepsPerColor; s++) {
                valSum += processedData[i * (stepsPerColor + 1) + s];
            }
            const val = valSum / (stepsPerColor + 1);

            visualData[color] = {
                efficiency: this.efficiencies[color],
                proportion: proportion,
                audioVol: val
            };

            if (AppConfig.DEBUG_MODE) {
                let colorName = "不明";
                if (color === THEME_COLORS.RED) colorName = "赤";
                else if (color === THEME_COLORS.BLUE) colorName = "青";
                else if (color === THEME_COLORS.GREEN) colorName = "緑";
                else if (color === THEME_COLORS.YELLOW) colorName = "黄";
                else if (color === THEME_COLORS.PURPLE) colorName = "紫";
                else if (color === THEME_COLORS.ORANGE) colorName = "橙";
                else if (color === THEME_COLORS.CYAN) colorName = "水";

                const actualCount = GameState.stats[color] || 0;
                const internalCount = GameState.colorDestroyCounts[color] || 0;
                const effPercent = (actualEfficiency * 100).toFixed(1);
                const actualCountStr = actualCount.toString().padStart(3, '0');
                const internalCountStr = internalCount.toString().padStart(3, '0');
                const effStr = effPercent.padStart(5, '0');
                this.debugLines.push(`${colorName}　破壊 ${actualCountStr}個(補正:${internalCountStr}) / 効率 ${effStr}% / FFT ${(val * 100).toFixed(1)}%`);
            }
        }

        // DOMへのデバッグ出力は廃止し、drawDebug()でのCanvas描画に移行

        const renderStrategy = RenderStrategies[mode];
        if (renderStrategy) {
            renderStrategy(ctx, width, height, visualData, processedData, this.amplitudes, this.time, GameState.activeColors, waveStepY, isNone);
        }
        ctx.restore();
    }

    drawDebug(ctx) {
        if (!AppConfig.DEBUG_MODE || !this.debugLines || this.debugLines.length === 0) return;
        
        const conf = LAYOUT_CONFIG.DEBUG_OVERLAY;
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.font = conf.WINDOW_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // 読みやすくするための黒半透明背景
        ctx.fillStyle = conf.WINDOW_BG_COLOR;
        ctx.fillRect(
            conf.WINDOW_X, 
            conf.WINDOW_Y, 
            conf.WINDOW_WIDTH, 
            this.debugLines.length * conf.LINE_HEIGHT + (conf.WINDOW_PADDING * 2)
        );
        
        ctx.fillStyle = conf.TEXT_COLOR;
        let y = conf.TEXT_START_Y;
        for (const line of this.debugLines) {
            ctx.fillText(line, conf.TEXT_OFFSET_X, y);
            y += conf.LINE_HEIGHT;
        }
        ctx.restore();
    }
}
