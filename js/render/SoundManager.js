// SoundManager.js
import { AUDIO_SETTINGS, AUDIO_ASSETS } from '../core/audioConfig.js';

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
                this.bgmAnalyser = this.context.createAnalyser();
                this.bgmAnalyser.fftSize = 512; // 256個の周波数帯域データを取得可能
                this.frequencyData = new Uint8Array(this.bgmAnalyser.frequencyBinCount);
            } else {
                console.warn('AudioContext is not supported in this browser.');
            }
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
        this.bgmFilterNode.frequency.value = 22050;
        this.bgmFilterNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.context.destination);

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
        this.updateCurrentStageBgmVolumes(1.5);
    }

    setStageBgmVolumeRatio(ratio) {
        if (this.stageBgmRatio === ratio) return;
        this.stageBgmRatio = ratio;
        if (this.currentBgmState) {
            this.updateCurrentStageBgmVolumes(0.1);
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
        const targetFreq = isStasis ? 800 : 22050;
        this.bgmFilterNode.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.5);
    }

    getBgmFrequencyData() {
        if (this.bgmAnalyser && this.frequencyData && this.currentBgmSetKey) {
            this.bgmAnalyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
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
        gainNode.connect(this.context.destination);

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
        this.bgmFilterNode.frequency.value = 22050;
        this.bgmFilterNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.context.destination);

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
