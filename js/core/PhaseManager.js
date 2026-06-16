// PhaseManager.js

import { GameState } from './config.js';
import { toggleStasisEffect, playSE } from '../render/effects.js';
import { SceneManager } from './SceneManager.js';
import { ResultScene } from '../scene/ResultScene.js';
import { GaugeManager } from '../render/GaugeManager.js';

export const PHASE_START = 'ゲーム開始待機中';
export const PHASE_NORMAL = '通常パズル時';
export const PHASE_WHITE_ENTER = 'ホワイト突入演出中';
export const PHASE_WHITE = 'ホワイトステイシス中';
export const PHASE_WHITE_EXIT = 'ホワイト解除演出中';
export const PHASE_GAMEOVER = 'ゲームオーバー演出中';

class PhaseManagerImpl {
    constructor() {
        this.init();
    }

    init() {
        this.currentPhase = PHASE_START;
        this.stateTimer = 0;
        this.isFinalGameOverTriggered = false;
    }

    setGameOver() {
        if (this.currentPhase !== PHASE_GAMEOVER) {
            this.currentPhase = PHASE_GAMEOVER;
            this.stateTimer = 0;
            this.isFinalGameOverTriggered = false;
            
            GameState.isGameOver = true;
            if (GameState.engine) {
                GameState.engine.timing.timeScale = 0.2;
            }
            toggleStasisEffect(true);
        }
    }

    update(deltaTime) {
        if (this.currentPhase === PHASE_START) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 1500) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
            }
        } else if (this.currentPhase === PHASE_GAMEOVER) {
            if (!GameState.isAnimating && !this.isFinalGameOverTriggered) {
                this.isFinalGameOverTriggered = true;
                
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 0;
                    GameState.isStasis = true; // 完全停止
                }

                GameState.displayScore = GameState.actualScore;
                GaugeManager.update(0, GameState.life, GameState.maxLife, GameState.exp, GameState.nextLevelExp, 0);
                playSE('GAMEOVER');
            }

            if (this.isFinalGameOverTriggered) {
                this.stateTimer += deltaTime;
                if (this.stateTimer >= 1500) {
                    this.stateTimer = -999999;
                    SceneManager.pushScene(new ResultScene());
                }
            }
        }
    }

    isNormalPhase() {
        return this.currentPhase === PHASE_NORMAL;
    }

    getCurrentPhaseName() {
        return this.currentPhase;
    }
}

export const PhaseManager = new PhaseManagerImpl();
