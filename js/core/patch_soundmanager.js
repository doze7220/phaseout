import fs from 'fs';

let content = fs.readFileSync('D:/ozlab/phaseout/js/render/SoundManager.js', 'utf-8');

// 1. constructor replacement
content = content.replace(
    `        // Vertical Remixing 用の保持ノード\r\n        this.currentBgmSetKey = null;\r\n        this.currentBgmState = null; // 'normal', 'pinch', 'fever', 'phase_shift', 'phase_break'\r\n        this.bgmSources = { normal: null, pinch: null, fever: null, phase_shift: null, phase_break: null };\r\n        this.bgmGainNodes = { normal: null, pinch: null, fever: null, phase_shift: null, phase_break: null };`,
    `        // 2レイヤークロスフェード 用の保持ノード\r\n        this.currentBgmSetKey = null;\r\n        this.currentMainState = null; // 'normal', 'fever', 'phase_shift', 'phase_break', 'scene'\r\n        \r\n        this.activeMainSource = null;\r\n        this.activeMainGain = null;\r\n        this.activePinchSource = null;\r\n        this.activePinchGain = null;`
);

// \r\n のパターンの場合も考慮
if (content.indexOf("2レイヤークロスフェード") === -1) {
    content = content.replace(
        `        // Vertical Remixing 用の保持ノード\n        this.currentBgmSetKey = null;\n        this.currentBgmState = null; // 'normal', 'pinch', 'fever', 'phase_shift', 'phase_break'\n        this.bgmSources = { normal: null, pinch: null, fever: null, phase_shift: null, phase_break: null };\n        this.bgmGainNodes = { normal: null, pinch: null, fever: null, phase_shift: null, phase_break: null };`,
        `        // 2レイヤークロスフェード 用の保持ノード\n        this.currentBgmSetKey = null;\n        this.currentMainState = null; // 'normal', 'fever', 'phase_shift', 'phase_break', 'scene'\n        \n        this.activeMainSource = null;\n        this.activeMainGain = null;\n        this.activePinchSource = null;\n        this.activePinchGain = null;`
    );
}

// 2. playStageBgmSet replacement
content = content.replace(
    /    playStageBgmSet\([\s\S]*?    switchStageBgmState/g,
    `    playStageBgmSet(setKey, initialState = 'normal') {
        if (!this.context) return;
        this.resumeContext();

        const setObj = this.buffers.STAGE_BGM[setKey];
        if (!setObj) return;

        this.stopBGM();

        this.currentBgmSetKey = setKey;

        this.bgmFilterNode = this.context.createBiquadFilter();
        this.bgmFilterNode.type = 'lowpass';
        this.bgmFilterNode.frequency.value = SOUND_MATH_CONFIG.NORMAL_FILTER_FREQ;
        this.bgmFilterNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.masterGainNode);

        // --- メインBGMの開始 ---
        this.currentMainState = initialState;
        const mainAsset = setObj[initialState];
        if (mainAsset && mainAsset.buffer) {
            this.activeMainSource = this.context.createBufferSource();
            this.activeMainSource.buffer = mainAsset.buffer;
            this.activeMainSource.loop = true;

            this.activeMainGain = this.context.createGain();
            this.activeMainGain.gain.value = AUDIO_SETTINGS.BGM_VOLUME * mainAsset.volume * this.stageBgmRatio;

            this.activeMainSource.connect(this.activeMainGain);
            this.activeMainGain.connect(this.bgmFilterNode);
            this.activeMainSource.start(0);
        }

        // --- ピンチBGMの開始（バックグラウンドで0音量で流す） ---
        const pinchAsset = setObj['pinch'];
        if (pinchAsset && pinchAsset.buffer) {
            this.activePinchSource = this.context.createBufferSource();
            this.activePinchSource.buffer = pinchAsset.buffer;
            this.activePinchSource.loop = true;

            this.activePinchGain = this.context.createGain();
            this.activePinchGain.gain.value = 0; // 最初はミュート

            this.activePinchSource.connect(this.activePinchGain);
            this.activePinchGain.connect(this.bgmFilterNode);
            this.activePinchSource.start(0);
        }
    }

    switchMainBgmState(targetState) {
        if (!this.context || !this.currentBgmSetKey) return;
        if (this.currentMainState === targetState) return;
        
        const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
        if (!setObj) return;

        const asset = setObj[targetState];
        if (!asset || !asset.buffer) return;

        this.currentMainState = targetState;
        const now = this.context.currentTime;
        const fadeDuration = SOUND_MATH_CONFIG.BGM_FADE_DURATION_SWITCH;

        // --- 古いメインをフェードアウトして破棄 ---
        const oldGain = this.activeMainGain;
        const oldSource = this.activeMainSource;
        if (oldGain && oldSource) {
            oldGain.gain.cancelScheduledValues(now);
            oldGain.gain.setValueAtTime(oldGain.gain.value, now);
            oldGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
            
            // フェードアウト完了後に停止＆切断
            setTimeout(() => {
                try { oldSource.stop(); } catch(e) {}
                oldSource.disconnect();
                oldGain.disconnect();
            }, fadeDuration * 1000 + 100);
        }

        // --- 新しいメインを作成してフェードイン ---
        this.activeMainSource = this.context.createBufferSource();
        this.activeMainSource.buffer = asset.buffer;
        this.activeMainSource.loop = true;

        this.activeMainGain = this.context.createGain();
        this.activeMainGain.gain.value = 0;

        this.activeMainSource.connect(this.activeMainGain);
        this.activeMainGain.connect(this.bgmFilterNode);

        const targetVolume = AUDIO_SETTINGS.BGM_VOLUME * asset.volume * this.stageBgmRatio;
        this.activeMainGain.gain.setValueAtTime(0, now);
        this.activeMainGain.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);
        
        this.activeMainSource.start(0);
    }

    updatePinchVolume(pinchMixRatio, isMainPriority) {
        if (!this.context || !this.currentBgmSetKey || !this.activePinchGain || !this.activeMainGain) return;
        
        const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
        if (!setObj) return;

        const pinchAsset = setObj['pinch'];
        const mainAsset = setObj[this.currentMainState];
        if (!pinchAsset || !mainAsset) return;

        const now = this.context.currentTime;

        let mainTargetVol = 0;
        let pinchTargetVol = 0;

        const baseMainVol = AUDIO_SETTINGS.BGM_VOLUME * mainAsset.volume * this.stageBgmRatio;
        const basePinchVol = AUDIO_SETTINGS.BGM_VOLUME * pinchAsset.volume * this.stageBgmRatio;

        if (isMainPriority) {
            mainTargetVol = baseMainVol;
            pinchTargetVol = 0;
        } else {
            pinchTargetVol = basePinchVol * pinchMixRatio;
            // メインBGMはピンチ時は少し音量を下げる (最大で20%まで低下とする)
            mainTargetVol = baseMainVol * Math.max(0.2, (1.0 - pinchMixRatio));
        }

        // setTargetAtTime でスムーズに変更
        this.activePinchGain.gain.setTargetAtTime(pinchTargetVol, now, 0.1);
        this.activeMainGain.gain.setTargetAtTime(mainTargetVol, now, 0.1);
    }

    switchStageBgmState`
);

// Remove switchStageBgmState and updateCurrentStageBgmVolumes, leaving setStageBgmVolumeRatio
content = content.replace(
    /    switchStageBgmState\([\s\S]*?    stopBGM/g,
    `    setStageBgmVolumeRatio(ratio) {
        this.stageBgmRatio = ratio;
    }

    stopBGM`
);

// 3. stopBGM and instantStopBGM replacement
content = content.replace(
    /    stopBGM\(\) \{[\s\S]*?    restartCurrentStageBgm/g,
    `    stopBGM() {
        if (this.activeMainSource) {
            try { this.activeMainSource.stop(); } catch(e) {}
            this.activeMainSource.disconnect();
            this.activeMainSource = null;
        }
        if (this.activeMainGain) {
            this.activeMainGain.disconnect();
            this.activeMainGain = null;
        }
        if (this.activePinchSource) {
            try { this.activePinchSource.stop(); } catch(e) {}
            this.activePinchSource.disconnect();
            this.activePinchSource = null;
        }
        if (this.activePinchGain) {
            this.activePinchGain.disconnect();
            this.activePinchGain = null;
        }

        if (this.bgmFilterNode) {
            this.bgmFilterNode.disconnect();
            this.bgmFilterNode = null;
        }
        this.currentBgmSetKey = null;
        this.currentMainState = null;
    }

    instantStopBGM() {
        if (!this.context) return;
        const now = this.context.currentTime;
        
        if (this.activeMainGain) {
            this.activeMainGain.gain.cancelScheduledValues(now);
            this.activeMainGain.gain.value = 0;
        }
        if (this.activePinchGain) {
            this.activePinchGain.gain.cancelScheduledValues(now);
            this.activePinchGain.gain.value = 0;
        }
        
        this.stopBGM();
    }

    restartCurrentStageBgm`
);

// 4. fadeOutAllBGM and remove startPhaseShiftBgmFromZero, startPhaseBreakBgmFromZero
content = content.replace(
    /    fadeOutAllBGM\([\s\S]*?    getBgmFrequencyData/g,
    `    fadeOutAllBGM(duration) {
        if (!this.context) return;
        const now = this.context.currentTime;
        
        if (this.activeMainGain) {
            this.activeMainGain.gain.cancelScheduledValues(now);
            this.activeMainGain.gain.setValueAtTime(this.activeMainGain.gain.value, now);
            this.activeMainGain.gain.linearRampToValueAtTime(0, now + duration);
        }
        if (this.activePinchGain) {
            this.activePinchGain.gain.cancelScheduledValues(now);
            this.activePinchGain.gain.setValueAtTime(this.activePinchGain.gain.value, now);
            this.activePinchGain.gain.linearRampToValueAtTime(0, now + duration);
        }
    }

    setStasisFilter(isStasis) {
        if (!this.bgmFilterNode || !this.context) return;
        const targetFreq = isStasis ? SOUND_MATH_CONFIG.STASIS_FILTER_FREQ : SOUND_MATH_CONFIG.NORMAL_FILTER_FREQ;
        this.bgmFilterNode.frequency.setTargetAtTime(targetFreq, this.context.currentTime, SOUND_MATH_CONFIG.STASIS_TRANSITION_SEC);
    }

    getBgmFrequencyData`
);

// 5. getStageBgmVolumes replacement
content = content.replace(
    /    getStageBgmVolumes\(\) \{[\s\S]*?    playSE/g,
    `    getStageBgmVolumes() {
        const vols = { main: 0, pinch: 0 };
        if (!this.currentBgmSetKey || (!this.activeMainGain && !this.activePinchGain)) return vols;
        const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
        if (!setObj) return vols;

        if (this.activeMainGain && this.currentMainState && setObj[this.currentMainState]) {
            const asset = setObj[this.currentMainState];
            const baseMaxVol = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;
            let v = this.activeMainGain.gain.value;
            if (baseMaxVol > 0) {
                vols.main = Math.max(0, Math.min(100, Math.round((v / baseMaxVol) * 100)));
            }
        }
        if (this.activePinchGain && setObj['pinch']) {
            const asset = setObj['pinch'];
            const baseMaxVol = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;
            let v = this.activePinchGain.gain.value;
            if (baseMaxVol > 0) {
                vols.pinch = Math.max(0, Math.min(100, Math.round((v / baseMaxVol) * 100)));
            }
        }
        return vols;
    }

    playSE`
);

// 6. playSceneBGM replacement
content = content.replace(
    /    playSceneBGM\([\s\S]*?    \}/g,
    `    playSceneBGM(key) {
        if (!this.context) return;
        this.resumeContext();

        this.stopBGM();

        const asset = this.buffers.SCENE_BGM[key];
        if (!asset || !asset.buffer) return;

        this.bgmFilterNode = this.context.createBiquadFilter();
        this.bgmFilterNode.type = 'lowpass';
        this.bgmFilterNode.frequency.value = SOUND_MATH_CONFIG.NORMAL_FILTER_FREQ;
        this.bgmFilterNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.masterGainNode);

        this.activeMainSource = this.context.createBufferSource();
        this.activeMainSource.buffer = asset.buffer;
        this.activeMainSource.loop = true;

        this.activeMainGain = this.context.createGain();
        this.activeMainGain.gain.value = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;

        this.activeMainSource.connect(this.activeMainGain);
        this.activeMainGain.connect(this.bgmFilterNode);
        this.activeMainSource.start(0);

        this.currentBgmSetKey = 'SCENE_' + key;
        this.currentMainState = 'scene';
    }
}`
);

fs.writeFileSync('D:/ozlab/phaseout/js/render/SoundManager.js', content);
