// SoundManager.js
import { AUDIO_SETTINGS, AUDIO_ASSETS } from '../core/audioConfig.js';

class SoundManager {
    constructor() {
        this.context = null;
        this.buffers = { BGM: {}, SE: {}, VOICE: {} };
        this.bgmSource = null;
        this.bgmGainNode = null;
        this.bgmFilterNode = null;
        this.bgmAnalyser = null;
        this.frequencyData = null;
        this.isLoaded = false;
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

        const loadBuffer = async (category, key, asset) => {
            try {
                const response = await fetch(asset.src);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.buffers[category][key] = {
                    buffer: audioBuffer,
                    volume: asset.volume
                };
            } catch (e) {
                console.warn(`Failed to load audio: ${asset.src} (${e.message})`);
                // 404等でも進行を止めないためエラーを握りつぶす
                this.buffers[category][key] = null;
            }
        };

        for (const [key, asset] of Object.entries(AUDIO_ASSETS.BGM)) {
            loadPromises.push(loadBuffer('BGM', key, asset));
        }
        for (const [key, asset] of Object.entries(AUDIO_ASSETS.SE)) {
            loadPromises.push(loadBuffer('SE', key, asset));
        }
        for (const [key, asset] of Object.entries(AUDIO_ASSETS.VOICE)) {
            loadPromises.push(loadBuffer('VOICE', key, asset));
        }

        await Promise.all(loadPromises);
        this.isLoaded = true;
    }

    playBGM(key) {
        if (!this.context) return;
        this.resumeContext();

        const asset = this.buffers.BGM[key];
        if (!asset || !asset.buffer) return;

        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
        }

        this.bgmSource = this.context.createBufferSource();
        this.bgmSource.buffer = asset.buffer;
        this.bgmSource.loop = true;

        this.bgmGainNode = this.context.createGain();
        this.bgmGainNode.gain.value = AUDIO_SETTINGS.BGM_VOLUME * asset.volume;

        this.bgmFilterNode = this.context.createBiquadFilter();
        this.bgmFilterNode.type = 'lowpass';
        this.bgmFilterNode.frequency.value = 22050; // 初期値（フィルターかかってない状態）

        this.bgmSource.connect(this.bgmFilterNode);
        this.bgmFilterNode.connect(this.bgmGainNode);
        this.bgmGainNode.connect(this.bgmAnalyser);
        this.bgmAnalyser.connect(this.context.destination);

        this.bgmSource.start(0);
    }

    stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
            this.bgmSource = null;
        }
    }

    setStasisFilter(isStasis) {
        if (!this.bgmFilterNode || !this.context) return;
        
        // ステイシス状態ならローパスフィルターをかけてこもった音にする
        const targetFreq = isStasis ? 800 : 22050;
        this.bgmFilterNode.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.5);
    }

    getBgmFrequencyData() {
        if (this.bgmAnalyser && this.frequencyData && this.bgmSource) {
            this.bgmAnalyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }

    playSE(key) {
        if (!this.context) return;
        this.resumeContext();

        const asset = this.buffers.SE[key];
        if (!asset || !asset.buffer) return;

        const source = this.context.createBufferSource();
        source.buffer = asset.buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.value = AUDIO_SETTINGS.SE_VOLUME * asset.volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);
    }

    playVoice(key) {
        if (!this.context) return;
        this.resumeContext();

        const asset = this.buffers.VOICE[key];
        if (!asset || !asset.buffer) return;

        const source = this.context.createBufferSource();
        source.buffer = asset.buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.value = AUDIO_SETTINGS.VOICE_VOLUME * asset.volume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);
    }
}

export const soundManager = new SoundManager();
