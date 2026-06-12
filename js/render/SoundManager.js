// SoundManager.js
import { AUDIO_SETTINGS, AUDIO_ASSETS } from '../core/audioConfig.js';
import { SOUND_MATH_CONFIG, VISUALIZER_MATH_CONFIG, AppConfig } from '../core/config.js';

class SoundManager {
    constructor() {
        this.context = null;
        this.buffers = { STAGE_BGM: {}, SCENE_BGM: {}, SE: {}, SYSSE: {} };
        
        // Vertical Remixing 用の保持ノード
        this.currentBgmSetKey = null;
        this.currentBgmState = null; // 'normal', 'pinch', 'fever'
        this.bgmSources = { normal: null, pinch: null, fever: null };
        this.bgmGainNodes = { normal: null, pinch: null, fever: null };
        
        this.bgmFilterNode = null;
        this.bgmAnalyser = null;
        this.frequencyData = null;
        this.isLoaded = false;
        
        this.nextSeTime = 0; // SEスケジューリング用
        this.stageBgmRatio = 1.0;
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
                const preset = VISUALIZER_MATH_CONFIG.PRESETS[AppConfig.EFFECT_LEVEL] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
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

        const states = ['normal', 'pinch', 'fever'];
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
        const states = ['normal', 'pinch', 'fever'];
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
        const states = ['normal', 'pinch', 'fever'];
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
        const states = ['normal', 'pinch', 'fever'];
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

    getBgmFrequencyData() {
        if (this.bgmAnalyser && this.currentBgmSetKey) {
            const preset = VISUALIZER_MATH_CONFIG.PRESETS[AppConfig.EFFECT_LEVEL] || VISUALIZER_MATH_CONFIG.PRESETS.FULL;
            if (this.bgmAnalyser.fftSize !== preset.FFT_SIZE) {
                this.bgmAnalyser.fftSize = preset.FFT_SIZE;
                this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount);
            }
            if (this.frequencyData) {
                this.bgmAnalyser.getByteFrequencyData(this.frequencyData);
                return this.frequencyData;
            }
        }
        return null;
    }

    getProcessedVisualizerData(ranges, size, step) {
        const freqData = this.getBgmFrequencyData();
        if (!freqData) return null;

        const sampleRate = this.context ? this.context.sampleRate : 44100;
        const fftSize = this.bgmAnalyser.fftSize;

        if (this.smoothedBass === undefined) this.smoothedBass = 0;
        if (!this.previousAmplitudes) this.previousAmplitudes = {};

        // 赤帯域 (20Hz〜60Hz) ピーク値・平均値によるパルス演出の計算
        const bassMinBin = Math.floor((20 * fftSize) / sampleRate);
        const bassMaxBin = Math.min(freqData.length - 1, Math.ceil((60 * fftSize) / sampleRate));
        let bassSum = 0;
        let bassCount = 0;
        for (let i = bassMinBin; i <= bassMaxBin && i < freqData.length; i++) {
            bassSum += freqData[i];
            bassCount++;
        }
        const currentBass = bassCount > 0 ? (bassSum / bassCount) / 255.0 : 0;
        this.smoothedBass += (currentBass - this.smoothedBass) * 0.15; // イージング

        // 【新規】全ビンに対するEQ補正とThresholdの適用（ソフトゲート方式）
        const processedFreqData = new Float32Array(freqData.length);
        for (let i = 0; i < freqData.length; i++) {
            const normalizedFreq = i / freqData.length;
            
            // 1. マイルドなEQカーブ (低音はそのまま1.0倍 〜 高音を少し強調1.3倍)
            const eqMultiplier = 1.0 + (0.3 * Math.pow(normalizedFreq, 0.5)); 
            
            // 2. 優しいノイズゲート (低音は0.25 〜 高音は0.05)
            const threshold = 0.25 - (0.2 * normalizedFreq); 

            // 生の値 (0〜255) を 0.0〜1.0 に正規化
            let val = freqData[i] / 255.0;

            // 3. 【重要】ハードカット(0にする)ではなく、ソフトゲート(減算)を適用して滑らかさを保つ
            val = Math.max(0, val - threshold);

            // 4. EQを掛けて最終的な振幅を決定
            processedFreqData[i] = val * eqMultiplier;
        }

        const processedData = [];

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const minHz = range.minHz || 0;
            const maxHz = range.maxHz || 20000;
            
            const minBin = Math.floor((minHz * fftSize) / sampleRate);
            const maxBin = Math.min(processedFreqData.length - 1, Math.ceil((maxHz * fftSize) / sampleRate));
            
            const points = [];
            for (let coord = 0; coord <= size + step; coord += step) {
                const currentCoord = Math.min(coord, size);
                const t = currentCoord / size;
                const exactBin = minBin + t * (maxBin - minBin);
                const bin1 = Math.floor(exactBin);
                const bin2 = Math.min(processedFreqData.length - 1, Math.ceil(exactBin));
                const lerpT = exactBin - bin1;
                
                // 線形補間 (Lerp)
                let val = 0;
                if (bin1 === bin2) {
                    val = processedFreqData[bin1] || 0;
                } else {
                    const v1 = processedFreqData[bin1] || 0;
                    const v2 = processedFreqData[bin2] || 0;
                    val = v1 + (v2 - v1) * lerpT;
                }

                // 低音 (Bass) による全体パルス演出
                val += this.smoothedBass * 0.15; 
                val = Math.max(0, Math.min(1.0, val));

                // 非対称なスムージング（Attack / Release）
                const stateKey = `${i}_${size}_${step}_${currentCoord}`;
                const prevVal = this.previousAmplitudes[stateKey] || 0;
                let finalVal = val;

                if (val > prevVal) {
                    finalVal = val; // Attack (鋭く即座に反応)
                } else {
                    finalVal = prevVal * 0.85; // Release (緩やかに減衰)
                }
                
                this.previousAmplitudes[stateKey] = finalVal;
                points.push({ coord: currentCoord, val: finalVal });
                
                if (currentCoord === size) break;
            }
            
            // オーディオの平均音量も計算しておく (Visualizer.jsの audioVol 用)
            let bandSum = 0;
            let bandCount = 0;
            for (let j = minBin; j <= maxBin && j < processedFreqData.length; j++) {
                bandSum += processedFreqData[j];
                bandCount++;
            }
            const avgVol = bandCount > 0 ? (bandSum / bandCount) : 0;

            processedData.push({ color: range.color, points, avgVol });
        }

        return processedData;
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
