// scene.js
import { GameState } from '../core/config.js';
import { ResultRenderer } from './ResultRenderer.js';
import { soundManager } from './SoundManager.js';

export let isResultReady = false;

export function changeScene(sceneId) {
    if (sceneId === 'scene-title' || sceneId === 'TITLE') {
        GameState.currentScene = 'TITLE';
        soundManager.playSceneBGM('TITLE');
    } else if (sceneId === 'scene-puzzle' || sceneId === 'PUZZLE') {
        GameState.currentScene = 'PUZZLE';
    } else if (sceneId === 'scene-home' || sceneId === 'HOME') {
        GameState.currentScene = 'HOME';
    } else if (sceneId === 'scene-boot' || sceneId === 'BOOT') {
        GameState.currentScene = 'BOOT';
    }
}

export function showResultOverlay() {
    GameState.currentScene = 'RESULT';
    isResultReady = true;
    ResultRenderer.startResult();
}

export function hideResultOverlay() {
    // 状態を戻す場合は changeScene を使う
}
