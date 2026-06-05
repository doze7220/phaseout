// audioConfig.js
export const AUDIO_SETTINGS = {
    BGM_VOLUME: 0.5,
    SE_VOLUME: 0.5,
    VOICE_VOLUME: 0.5
};

export const AUDIO_ASSETS = {
    BGM: {
        title: { src: '../../assets/audio/bgm/title.mp3', volume: 1.0 },
        puzzle: { src: '../../assets/audio/bgm/puzzle.mp3', volume: 1.0 }
    },
    SE: {
        tap: { src: '../../assets/audio/se/tap.mp3', volume: 1.0 },
        chain: { src: '../../assets/audio/se/chain.mp3', volume: 1.0 },
        clear: { src: '../../assets/audio/se/clear.mp3', volume: 1.0 },
        damage: { src: '../../assets/audio/se/damage.mp3', volume: 1.0 },
        heal: { src: '../../assets/audio/se/heal.mp3', volume: 1.0 },
        levelUp: { src: '../../assets/audio/se/levelup.mp3', volume: 1.0 },
        gameOver: { src: '../../assets/audio/se/gameover.mp3', volume: 1.0 }
    },
    VOICE: {
        start: { src: '../../assets/audio/voice/start.mp3', volume: 1.0 },
        fever: { src: '../../assets/audio/voice/fever.mp3', volume: 1.0 }
    }
};
