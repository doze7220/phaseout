WAVE: (ctx, width, height, visualData, processedData, amplitudes, time, activeColors, waveStepY) => {
        const waveData = [];
        const maxWaveX = width * 0.9;
        const stepY = 4;

        for (let i = 0; i < activeColors.length; i++) {
            const color = activeColors[i];
            const { efficiency } = visualData[color];

            const spikeLevel = amplitudes[color];
            const isSpiking = Math.max(0, spikeLevel - 1.0);

            // 本質：X軸の中心座標は経験値効率に完全固定
            const baseX = maxWaveX * efficiency;

            // 波形の「振幅（中心からどれくらい膨らむか）」だけを事前計算
            const coarsePoints = [];
            const steps = Math.floor(height / waveStepY);

            for (let s = 0; s <= steps; s++) {
                const y = s * waveStepY;
                const dataIdx = i * (steps + 1) + s;
                let val = processedData[dataIdx];
                
                const maxAmp = ((width * VISUALIZER_MATH_CONFIG.WAVE_AMP_BASE) + 
                                (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_AUDIO_MULTI) * val + 
                                (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_SPIKE_MULTI) * (isSpiking / 4.0)) * 0.5;

                // 上下端で0、中央で1になる滑らかなカーブ（接地面の固定）
                const edgeRatio = Math.sin((s / steps) * Math.PI);
                
                // 膨らみ幅の算出
                let amplitude = 0;
                if (val > 0) {
                    amplitude = val * maxAmp * edgeRatio;
                }

                coarsePoints.push({ amp: amplitude, y: y });
            }

            // Lerp to draw smooth curve (左側の線と右側の線を別々に生成)
            const leftPoints = [];
            const rightPoints = [];
            const drawStep = 3;
            for (let y = 0; y <= height + drawStep; y += drawStep) {
                const index = y / waveStepY;
                const idx0 = Math.min(coarsePoints.length - 1, Math.floor(index));
                const idx1 = Math.min(coarsePoints.length - 1, idx0 + 1);
                const ratio = index - idx0;

                const amp0 = coarsePoints[idx0].amp;
                const amp1 = coarsePoints[idx1].amp;
                const amp = amp0 * (1 - ratio) + amp1 * ratio;

                // 中心(baseX)から左右に対称なポイントを作る
                leftPoints.push({ x: baseX - amp, y });
                rightPoints.push({ x: baseX + amp, y });
            }

            waveData.push({ color, baseX, leftPoints, rightPoints });
        }

        // =========================================================
        // 描画フェーズ
        // =========================================================

        // 【Pass 1: 塗りフェーズ（左右の線の「内側」を塗る）】
        if (AppConfig.EFFECT_LEVEL !== 'NONE') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.3;
            for (const data of waveData) {
                if (data.leftPoints.length === 0) continue;
                ctx.beginPath();

                // 左側を上から下へ
                ctx.moveTo(data.leftPoints[0].x, data.leftPoints[0].y);
                for (let i = 1; i < data.leftPoints.length; i++) {
                    ctx.lineTo(data.leftPoints[i].x, data.leftPoints[i].y);
                }
                
                // 右側を下から上へ戻る
                for (let i = data.rightPoints.length - 1; i >= 0; i--) {
                    ctx.lineTo(data.rightPoints[i].x, data.rightPoints[i].y);
                }

                ctx.closePath();
                ctx.fillStyle = data.color;
                ctx.fill();
            }
            ctx.restore();
        }

        // 【Pass 2: 実線フェーズ（オシロスコープのレーザー線）】
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // 1. 太いグロウ（ぼかし・残像）
        ctx.lineWidth = 6;
        for (const data of waveData) {
            ctx.beginPath();
            // 左の線
            ctx.moveTo(data.leftPoints[0].x, data.leftPoints[0].y);
            for (const pt of data.leftPoints) ctx.lineTo(pt.x, pt.y);
            // 右の線
            ctx.moveTo(data.rightPoints[0].x, data.rightPoints[0].y);
            for (const pt of data.rightPoints) ctx.lineTo(pt.x, pt.y);
            
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = data.color;
            ctx.stroke();
        }

        // 2. 細いコアライン（中心の鋭いレーザー）
        ctx.lineWidth = 1.5;
        for (const data of waveData) {
            ctx.beginPath();
            // 左の線
            ctx.moveTo(data.leftPoints[0].x, data.leftPoints[0].y);
            for (const pt of data.leftPoints) ctx.lineTo(pt.x, pt.y);
            // 右の線
            ctx.moveTo(data.rightPoints[0].x, data.rightPoints[0].y);
            for (const pt of data.rightPoints) ctx.lineTo(pt.x, pt.y);
            
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = data.color;
            ctx.stroke();
            
            // (おまけ) 中心軸にも薄く線を引くとよりゲージ感・アナライザ感が出ます
            ctx.beginPath();
            ctx.moveTo(data.baseX, 0);
            ctx.lineTo(data.baseX, height);
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = data.color;
            ctx.stroke();
        }
        ctx.restore();
    },