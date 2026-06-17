// SoundManager.js
import { AUDIO_SETTINGS, AUDIO_ASSETS } from '../core/audioConfig.js';
import { SOUND_MATH_CONFIG, AppConfig, VISUALIZER_MATH_CONFIG } from '../core/config.js';

class SoundManager {
    constructor() {
        this.context = null;
        this.buffers = { STAGE_BGM: {}, SCENE_BGM: {}, SE: {}, SYSSE: {} };
        
        // Vertical Remixing 用の保持ノード
        this.currentBgmSetKey = null;
        this.currentBgmState = null; // 'normal', 'pinch', 'fever', 'phase_shift'
        this.bgmSources = { normal: null, pinch: null, fever: null, phase_shift: null };
        this.bgmGainNodes = { normal: null, pinch: null, fever: null, phase_shift: null };
        
        this.bgmFilterNode = null;
        this.bgmAnalyser = null;
        this.frequencyData = null;
        this.isLoaded = false;
        
        this.nextSeTime = 0; // SEスケジューリング用
        this.stageBgmRatio = 1.0;

        // ビジュアル・音響解析状態の初期化
        this.prevValues = {}; // stateKey ごとの前フレームの帯域値
        this.smoothedBass = 0.0;
        this.compensationTable = null;
        this.cachedFftSizeForEQ = 0;
        this.cachedConfigKey = '';
        this.targetBinIndices = null;
        this.targetColorIndices = null;
    }

    initContext() {
        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.context = new AudioContext();
                this.masterGainNode = this.context.createGain();
                this.masterGainNode.connect(this.context.destination);
                this.updateMuteState();

                this.bgmAnalyser = this.context.createAnalyser();
                // AppConfig.EFFECT_LEVELに応じたFFT_SIZEを設定
                const effectLevel = AppConfig.EFFECT_LEVEL || 'FULL';
                const preset = VISUALIZER_MATH_CONFIG.PRESETS[effectLevel] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
                this.bgmAnalyser.fftSize = preset.FFT_SIZE;
                this.bgmAnalyser.smoothingTimeConstant = 0.85;
                this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount);
            } else {
                console.warn('AudioContext is not supported in this browser.');
            }
        }
    }

    updateMuteState() {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = AppConfig.AUDIO_ENABLED ? 1 : 0;
        }
    }

    async resumeContext() {
        this.initContext();
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    async loadAllAudio() {
        if (this.isLoaded) return;
        this.initContext();
        if (!this.context) return;

        const loadPromises = [];

        const loadBuffer = async (category, key, asset, isArray = false, arrayIndex = -1, subKey = null) => {
            if (!asset) return;
            try {
                const response = await fetch(asset.src);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                const data = { buffer: audioBuffer, volume: asset.volume };
                
                if (isArray) {
                    if (!this.buffers[category][key]) this.buffers[category][key] = [];
                    this.buffers[category][key][arrayIndex] = data;
                } else if (subKey) {
                    if (!this.buffers[category][key]) this.buffers[category][key] = {};
                    this.buffers[category][key][subKey] = data;
                } else {
                    this.buffers[category][key] = data;
                }
            } catch (e) {
                console.warn(`Failed to load audio: ${asset.src} (${e.message})`);
                if (isArray) {
                    if (!this.buffers[category][key]) this.buffers[category][key] = [];
                    this.buffers[category][key][arrayIndex] = null;
                } else if (subKey) {
                    if (!this.buffers[category][key]) this.buffers[category][key] = {};
                    this.buffers[category][key][subKey] = null;
                } else {
                    this.buffers[category][key] = null;
                }
            }
        };

        for (const [key, setObj] of Object.entries(AUDIO_ASSETS.STAGE_BGM_SETS || {})) {
            loadPromises.push(loadBuffer('STAGE_BGM', key, setObj.normal, false, -1, 'normal'));
            loadPromises.push(loadBuffer('STAGE_BGM', key, setObj.pinch, false, -1, 'pinch'));
            loadPromises.push(loadBuffer('STAGE_BGM', key, setObj.fever, false, -1, 'fever'));
            if (setObj.phase_shift) {
                loadPromises.push(loadBuffer('STAGE_BGM', key, setObj.phase_shift, false, -1, 'phase_shift'));
            }
        }
        for (const [key, arr] of Object.entries(AUDIO_ASSETS.SCENE_BGM_SETS || {})) {
            loadPromises.push(loadBuffer('SCENE_BGM', key, arr[0], false, -1, null));
        }
        for (const [key, asset] of Object.entries(AUDIO_ASSETS.SE || {})) {
            if (Array.isArray(asset)) {
                asset.forEach((a, i) => loadPromises.push(loadBuffer('SE', key, a, true, i, null)));
            } else {
                loadPromises.push(loadBuffer('SE', key, asset));
            }
        }
        for (const [key, asset] of Object.entries(AUDIO_ASSETS.SYSSE || {})) {
            if (Array.isArray(asset)) {
                asset.forEach((a, i) => loadPromises.push(loadBuffer('SYSSE', key, a, true, i, null)));
            } else {
                loadPromises.push(loadBuffer('SYSSE', key, asset));
            }
        }

        await Promise.all(loadPromises);
        this.isLoaded = true;
    }

    playStageBgmSet(setKey) {
        if (!this.context) return;
        this.resumeContext();

        const setObj = this.buffers.STAGE_BGM[setKey];
        if (!setObj) return;

        this.stopBGM();

        this.currentBgmSetKey = setKey;
        this.currentBgmState = 'normal';

        this.bgmFilterNode = this.context.createBiquadFilter();
        this.bgmFilterNode.type = 'lowpass';
        this.bgmFilterNode.frequency.value = SOUND_MATH_CONFIG.NORMAL_FILTER_FREQ;
        this.bgmFilterNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.masterGainNode);

        const states = ['normal', 'pinch', 'fever', 'phase_shift'];
        states.forEach(state => {
            const asset = setObj[state];
            if (asset && asset.buffer) {
                const source = this.context.createBufferSource();
                source.buffer = asset.buffer;
                source.loop = true;

                const gainNode = this.context.createGain();
                // 初期状態（normal）のみ音量1、他は0
                const targetVolume = (state === 'normal') ? (AUDIO_SETTINGS.BGM_VOLUME * asset.volume) : 0;
                gainNode.gain.value = targetVolume;

                source.connect(gainNode);
                gainNode.connect(this.bgmFilterNode);
                source.start(0);

                this.bgmSources[state] = source;
                this.bgmGainNodes[state] = gainNode;
            }
        });
    }

    switchStageBgmState(targetState) {
        if (!this.context || !this.currentBgmSetKey) return;
        if (this.currentBgmState === targetState) return;
        this.currentBgmState = targetState;
        this.updateCurrentStageBgmVolumes(SOUND_MATH_CONFIG.BGM_FADE_DURATION_SWITCH);
    }

    setStageBgmVolumeRatio(ratio) {
        if (this.stageBgmRatio === ratio) return;
        this.stageBgmRatio = ratio;
        if (this.currentBgmState) {
            this.updateCurrentStageBgmVolumes(SOUND_MATH_CONFIG.BGM_FADE_DURATION_RATIO);
        }
    }

    updateCurrentStageBgmVolumes(fadeDuration) {
        if (!this.context || !this.currentBgmSetKey) return;
        const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
        if (!setObj) return;

        const now = this.context.currentTime;
        const states = ['normal', 'pinch', 'fever', 'phase_shift'];
        states.forEach(state => {
            const gainNode = this.bgmGainNodes[state];
            const asset = setObj[state];
            if (gainNode && asset) {
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                const targetVolume = (state === this.currentBgmState) ? (AUDIO_SETTINGS.BGM_VOLUME * asset.volume * this.stageBgmRatio) : 0;
                gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);
            }
        });
    }

    stopBGM() {
        const states = ['normal', 'pinch', 'fever', 'phase_shift'];
        states.forEach(state => {
            if (this.bgmSources[state]) {
                this.bgmSources[state].stop();
                this.bgmSources[state].disconnect();
                this.bgmSources[state] = null;
            }
            if (this.bgmGainNodes[state]) {
                this.bgmGainNodes[state].disconnect();
                this.bgmGainNodes[state] = null;
            }
        });
        if (this.bgmFilterNode) {
            this.bgmFilterNode.disconnect();
            this.bgmFilterNode = null;
        }
        this.currentBgmSetKey = null;
        this.currentBgmState = null;
    }

    fadeOutAllBGM(duration) {
        if (!this.context) return;
        const now = this.context.currentTime;
        const states = ['normal', 'pinch', 'fever', 'phase_shift'];
        states.forEach(state => {
            const gainNode = this.bgmGainNodes[state];
            if (gainNode) {
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.linearRampToValueAtTime(0, now + duration);
            }
        });
    }

    setStasisFilter(isStasis) {
        if (!this.bgmFilterNode || !this.context) return;
        const targetFreq = isStasis ? SOUND_MATH_CONFIG.STASIS_FILTER_FREQ : SOUND_MATH_CONFIG.NORMAL_FILTER_FREQ;
        this.bgmFilterNode.frequency.setTargetAtTime(targetFreq, this.context.currentTime, SOUND_MATH_CONFIG.STASIS_TRANSITION_SEC);
    }

    startPhaseShiftBgmFromZero() {
        if (!this.context) return;
        // 既存のすべてのBGMをフェードアウト＆停止
        this.fadeOutAllBGM(0.5);

        // STASISフィルタを解除
        this.setStasisFilter(false);

        // 少し遅れてphase_shiftのBGMを再生（最初から）
        setTimeout(() => {
            if (!this.context || !this.currentBgmSetKey) return;
            const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
            if (!setObj || !setObj['phase_shift']) return;

            const asset = setObj['phase_shift'];
            if (asset && asset.buffer) {
                // 既存のphase_shiftソースがあれば破棄
                if (this.bgmSources['phase_shift']) {
                    this.bgmSources['phase_shift'].stop();
                    this.bgmSources['phase_shift'].disconnect();
                }

                // 新しく作り直して再生
                const source = this.context.createBufferSource();
                source.buffer = asset.buffer;
                source.loop = true;

                const gainNode = this.bgmGainNodes['phase_shift'];
                if (gainNode) {
                    source.connect(gainNode);
                    
                    const now = this.context.currentTime;
                    gainNode.gain.cancelScheduledValues(now);
                    gainNode.gain.setValueAtTime(0, now);
                    
                    // フェードイン
                    const targetVolume = AUDIO_SETTINGS.BGM_VOLUME * asset.volume * this.stageBgmRatio;
                    gainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.0); // 1秒かけてフェードイン
                    
                    source.start(0);
                    this.bgmSources['phase_shift'] = source;
                    this.currentBgmState = 'phase_shift';
                }
            }
        }, 500);
    }

    getBgmFrequencyData() {
        if (this.bgmAnalyser) {
            const effectLevel = AppConfig.EFFECT_LEVEL || 'FULL';
            const preset = VISUALIZER_MATH_CONFIG.PRESETS[effectLevel] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
            const newFftSize = preset.FFT_SIZE;
            if (this.bgmAnalyser.fftSize !== newFftSize) {
                this.bgmAnalyser.fftSize = newFftSize;
                this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount);
            }
            if (this.frequencyData && this.currentBgmSetKey) {
                this.bgmAnalyser.getByteFrequencyData(this.frequencyData);
                return this.frequencyData;
            }
        }
        return null;
    }

    getFrequencyCompensation(freqHz) {
        if (freqHz < 20) return 0.05;
        if (freqHz < 100) {
            const t = (freqHz - 20) / (100 - 20);
            return 0.15 + 0.85 * t;
        } else if (freqHz < 1000) {
            return 1.0;
        } else if (freqHz < 8000) {
            if (freqHz < 4000) {
                const t = (freqHz - 1000) / (4000 - 1000);
                return 1.0 + 0.8 * Math.sin(t * Math.PI / 2);
            } else {
                const t = (freqHz - 4000) / (8000 - 4000);
                return 1.8 - 0.6 * t;
            }
        } else {
            if (freqHz >= 20000) return 0.1;
            const t = (freqHz - 8000) / (20000 - 8000);
            return 1.2 * (1.0 - t) + 0.1 * t;
        }
    }

    getProcessedVisualizerData(stateKey, ranges, waveStepX, width, isPartitioned = true) {
        const numColors = ranges.length;
        const colorWidth = isPartitioned ? (width / numColors) : width;
        const stepsPerColor = Math.floor(colorWidth / waveStepX);
        const totalSteps = numColors * (stepsPerColor + 1);

        const freqData = this.getBgmFrequencyData();
        if (!freqData) {
            return new Float32Array(totalSteps);
        }

        const fftSize = this.bgmAnalyser.fftSize;
        const sampleRate = this.context ? this.context.sampleRate : 44100;
        const binCount = this.bgmAnalyser.frequencyBinCount;

        // キャッシュチェックキーの構築
        const cacheKey = `${fftSize}_${waveStepX}_${width}_${numColors}_${isPartitioned}`;
        if (this.cachedConfigKey !== cacheKey || !this.targetBinIndices) {
            this.cachedConfigKey = cacheKey;
            
            this.targetBinIndices = new Int32Array(totalSteps);
            this.targetColorIndices = new Int32Array(totalSteps);
            
            let stepIdx = 0;
            for (let i = 0; i < numColors; i++) {
                const range = ranges[i];
                for (let s = 0; s <= stepsPerColor; s++) {
                    const ratio = stepsPerColor > 0 ? s / stepsPerColor : 0;
                    const freqHz = range.minHz + ratio * (range.maxHz - range.minHz);
                    let bin = Math.round(freqHz * fftSize / sampleRate);
                    if (bin >= binCount) bin = binCount - 1;
                    if (bin < 0) bin = 0;
                    
                    this.targetBinIndices[stepIdx] = bin;
                    this.targetColorIndices[stepIdx] = i;
                    stepIdx++;
                }
            }

            // EQ補正テーブルの更新
            this.compensationTable = new Float32Array(binCount);
            for (let i = 0; i < binCount; i++) {
                const freqHz = i * sampleRate / fftSize;
                this.compensationTable[i] = this.getFrequencyCompensation(freqHz);
            }
        }

        // Bass Pulse 用のエネルギー算出 (20～60Hz)
        let bassSum = 0;
        let bassCount = 0;
        for (let i = 0; i < binCount; i++) {
            const freqHz = i * sampleRate / fftSize;
            if (freqHz >= 20 && freqHz <= 60) {
                const rawValue = freqData[i];
                bassSum += rawValue * this.compensationTable[i];
                bassCount++;
            }
        }
        const currentBass = bassCount > 0 ? (bassSum / bassCount) / 255.0 : 0.0;
        this.smoothedBass = this.smoothedBass * 0.9 + currentBass * 0.1;

        if (!this.prevValues[stateKey] || this.prevValues[stateKey].length !== totalSteps) {
            this.prevValues[stateKey] = new Float32Array(totalSteps);
        }
        const prevBandValues = this.prevValues[stateKey];
        const finalAmplitudes = new Float32Array(totalSteps);

        for (let s = 0; s < totalSteps; s++) {
            const bin = this.targetBinIndices[s];
            const rawValue = freqData[bin];
            const correctedValue = rawValue * this.compensationTable[bin];
            let val = correctedValue / 255.0;

            // 6. ダイナミックレンジ圧縮
            val = Math.pow(val, 0.7);

            // 7. Attack / Release
            let prevVal = prevBandValues[s];
            let smoothed;
            if (val > prevVal) {
                smoothed = val;
            } else {
                const releaseFactor = 0.90;
                smoothed = prevVal * releaseFactor + val * (1 - releaseFactor);
            }
            prevBandValues[s] = smoothed;

            // 8. Bass Pulse演出適用
            const pulseStrength = 0.25;
            const finalAmp = smoothed * (1 + this.smoothedBass * pulseStrength);
            finalAmplitudes[s] = Math.max(0.0, Math.min(1.0, finalAmp));
        }

        return finalAmplitudes;
    }

    getStageBgmVolumes() {
        const vols = { normal: 0, pinch: 0, fever: 0 };
        if (!this.currentBgmSetKey || !this.bgmGainNodes) return vols;
        const setObj = this.buffers.STAGE_BGM[this.currentBgmSetKey];
        if (!setObj) return vols;

        const states = ['normal', 'pinch', 'fever'];
        states.forEach(state => {
            const gainNode = this.bgmGainNodes[state];
            const asset = setObj[state];
            if (gainNode && asset) {
                const baseMaxVol = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;
                let v = gainNode.gain.value;
                if (baseMaxVol > 0) {
                    vols[state] = Math.max(0, Math.min(100, Math.round((v / baseMaxVol) * 100)));
                }
            }
        });
        return vols;
    }

    playSE(key, options = {}) {
        if (!this.context) return;
        this.resumeContext();

        let assetData = this.buffers.SE[key] || this.buffers.SYSSE[key];
        if (!assetData) return;

        // 配列の場合はランダムに1つ選出
        let asset = null;
        if (Array.isArray(assetData)) {
            const validAssets = assetData.filter(a => a && a.buffer);
            if (validAssets.length === 0) return;
            asset = validAssets[Math.floor(Math.random() * validAssets.length)];
        } else {
            asset = assetData;
        }

        if (!asset || !asset.buffer) return;

        const source = this.context.createBufferSource();
        source.buffer = asset.buffer;
        
        if (options.playbackRate) {
            source.playbackRate.value = options.playbackRate;
        }

        const gainNode = this.context.createGain();
        gainNode.gain.value = AUDIO_SETTINGS.SE_VOLUME * asset.volume;

        source.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        // キューリング（ズラし再生）
        const now = this.context.currentTime;
        if (now < this.nextSeTime) {
            this.nextSeTime += 0.04;
        } else {
            this.nextSeTime = now;
        }
        
        source.start(this.nextSeTime);
    }

    playSceneBGM(key) {
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

        const source = this.context.createBufferSource();
        source.buffer = asset.buffer;
        source.loop = true;

        const gainNode = this.context.createGain();
        gainNode.gain.value = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;

        source.connect(gainNode);
        gainNode.connect(this.bgmFilterNode);
        source.start(0);

        this.bgmSources['normal'] = source;
        this.bgmGainNodes['normal'] = gainNode;
        this.currentBgmSetKey = 'SCENE_' + key;
        this.currentBgmState = 'normal';
    }
}

export const soundManager = new SoundManager();
