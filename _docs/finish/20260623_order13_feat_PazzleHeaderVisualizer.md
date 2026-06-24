// 【実線フェーズ（塗りつぶしは不要なので削除してOK）】
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2.0;

        for (const data of waveData) {
            ctx.beginPath();
            
            // 縦幅を固定値(steps)で回す
            for (let s = 0; s <= steps; s++) {
                const y = s * waveStepY;
                const dataIdx = i * (steps + 1) + s;
                let val = processedData[dataIdx];
                
                // 振幅の計算と、上下端の固定
                const maxAmp = ((width * VISUALIZER_MATH_CONFIG.WAVE_AMP_BASE) + 
                                (width * VISUALIZER_MATH_CONFIG.WAVE_AMP_AUDIO_MULTI) * val) * 0.5;
                const edgeRatio = Math.sin((s / steps) * Math.PI);
                
                let amp = 0;
                if (val > 0) amp = val * maxAmp * edgeRatio;

                // 小澤さんのアイデア：同じデータ(amp)を使って、左(*-1)から右(*1)へ横線を1本引く
                ctx.moveTo(data.baseX - amp, y);
                ctx.lineTo(data.baseX + amp, y);
            }
            
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = data.color;
            ctx.stroke(); // 横線の集合体として、左右対称のシルエットが一発で描画される
        }
        ctx.restore();