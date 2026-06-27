// audioConfig.js
export const AUDIO_SETTINGS = {
    BGM_VOLUME: 0.5,
    SE_VOLUME: 0.5,
    VOICE_VOLUME: 0.5
};

export const AUDIO_ASSETS = {
    STAGE_BGM_SETS: {
        SET_01: {
            normal: { src: 'assets/sound/bgm/SF_01.mp3', volume: 1.0 },
            fever: { src: 'assets/sound/bgm/Drumnbass_02.mp3', volume: 1.0 },
            pinch: { src: 'assets/sound/bgm/Shooting_01.mp3', volume: 1.0 },
            phase_shift: { src: 'assets/sound/bgm/trance2.mp3', volume: 1.0 },
            phase_break: { src: 'assets/sound/bgm/Digi_Rock_03.mp3', volume: 1.0 }
        }
        /*
        SET_01: {
            normal: { src: 'assets/sound/bgm/marbletechno2.mp3', volume: 1.0 },
            fever: { src: 'assets/sound/bgm/UrbanBGM_01.mp3', volume: 1.0 },
            pinch: { src: 'assets/sound/bgm/UrbanBGM_03.mp3', volume: 1.0 },
            phase_shift: { src: 'assets/sound/bgm/Digi_Rock_02.mp3', volume: 1.0 }
        },
        SET_02: {
            normal: { src: 'assets/sound/bgm/energy.mp3', volume: 1.0 },
            fever: { src: 'assets/sound/bgm/UrbanBGM_01.mp3', volume: 1.0 },
            pinch: { src: 'assets/sound/bgm/Digi_Rock_02.mp3', volume: 1.0 },
            phase_shift: { src: 'assets/sound/bgm/UrbanBGM_01.mp3', volume: 1.0 }
        }
        SET_03: {
            normal: { src: 'assets/sound/bgm/SF_01.mp3', volume: 1.0 },
            fever: { src: 'assets/sound/bgm/UrbanBGM_01.mp3', volume: 1.0 },
            pinch: { src: 'assets/sound/bgm/Shooting_02.mp3', volume: 1.0 },
            phase_shift: { src: 'assets/sound/bgm/UrbanBGM_03.mp3', volume: 1.0 }
        },
        SET_04: {
            normal: { src: 'assets/sound/bgm/Breakbeats_01.mp3', volume: 1.0 },
            fever: { src: 'assets/sound/bgm/UrbanBGM_01.mp3', volume: 1.0 },
            pinch: { src: 'assets/sound/bgm/Shooting_01.mp3', volume: 1.0 },
            phase_shift: { src: 'assets/sound/bgm/Digi_Rock_02.mp3', volume: 1.0 }
        }
        */
    },
    SCENE_BGM_SETS: {
        TITLE: [{ src: 'assets/sound/bgm/Short60_techno_01.mp3', volume: 1.0 }],
        RESULT: [{ src: 'assets/sound/bgm/LoFi_01.mp3', volume: 1.0 }]
    },
    SE: {
        BREAK: [
            { src: 'assets/sound/se/cup_break.mp3', volume: 0.8 },
            { src: 'assets/sound/se/glass_break.mp3', volume: 0.8 },
            { src: 'assets/sound/se/dish_break_1.mp3', volume: 0.8 },
            { src: 'assets/sound/se/dish_break_2.mp3', volume: 0.8 },
            { src: 'assets/sound/se/dish_break_3.mp3', volume: 0.8 }
        ],
        LASER: { src: 'assets/sound/se/laser_beam1.mp3', volume: 0.5 },
        PRISM_LINK_BURST: { src: 'assets/sound/se/laser_beam3.mp3', volume: 1.0 },
        HIT: [
            { src: 'assets/sound/sysse/decide_10.mp3', volume: 0.8 }
        ],
        PINCH_WARNING: { src: 'assets/sound/se/alert2.mp3', volume: 1.0 },
        FREEZE: [
            { src: 'assets/sound/se/freeze_1.mp3', volume: 1.0 },
            { src: 'assets/sound/se/freeze_2.mp3', volume: 1.0 }
        ],
        GAMEOVER: { src: 'assets/sound/jingle/jingle_09.mp3', volume: 1.0 },
        LEVELUP: { src: 'assets/sound/jingle/complete_1.mp3', volume: 1.0 }
    },
    SYSSE: {
        TAP: { src: 'assets/sound/sysse/select_1.mp3', volume: 0.7 },
        DECIDE: [
            { src: 'assets/sound/sysse/decide_10.mp3', volume: 0.7 }
        ],
        CANCEL: [
            { src: 'assets/sound/sysse/confirm_1.mp3', volume: 0.7 }
        ],
        COMPLETE: [
            { src: 'assets/sound/sysse/decide_11.mp3', volume: 0.7 }
        ]
    },
    VOICE: {}
};
