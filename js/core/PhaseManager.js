// PhaseManager.js

import { GameState, PHASE_SHIFT_MATH } from './config.js';
import { toggleStasisEffect, playSE, triggerWhiteFlash, SoundManager } from '../render/effects.js';
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
        
        this.phaseGauge = 0;
        this.lastGaugeAdd = 0;
        this.lastDecayAmount = 0;
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

    addPhaseGauge(chainCount, prismDepth) {
        const base = PHASE_SHIFT_MATH.GAUGE_ADD_BASE;
        const chain = PHASE_SHIFT_MATH.GAUGE_ADD_CHAIN_MULTI * chainCount;
        const depth = PHASE_SHIFT_MATH.GAUGE_ADD_DEPTH_MULTI * prismDepth;
        const total = base + chain + depth;
        
        this.phaseGauge += total;
        this.lastGaugeAdd = total;

        if (this.phaseGauge >= PHASE_SHIFT_MATH.GAUGE_MAX) {
            this.phaseGauge = PHASE_SHIFT_MATH.GAUGE_MAX;
            if (this.currentPhase === PHASE_NORMAL) {
                this.enterWhitePhase();
            }
        }
    }

    enterWhitePhase() {
        this.currentPhase = PHASE_WHITE_ENTER;
        this.stateTimer = 0;

        console.log(`[PhaseManager] フェイズシフト突入: ${PHASE_WHITE_ENTER}`);

        // 物理エンジンを完全に停止させる（ステイシス状態）
        if (GameState.engine) {
            GameState.engine.timing.timeScale = 0;
            GameState.isStasis = true;
        }

        // WhiteFlash trigger
        if (triggerWhiteFlash) triggerWhiteFlash();
        // Stasis visual effect
        if (toggleStasisEffect) toggleStasisEffect(true);
        // Stasis audio effect
        if (SoundManager && SoundManager.setStasisFilter) {
            SoundManager.setStasisFilter(true);
        }
    }

    update(deltaTime) {
        if (this.currentPhase === PHASE_START) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 1500) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
            }
        } else if (this.currentPhase === PHASE_NORMAL) {
            if (this.phaseGauge > 0) {
                const ratio = this.phaseGauge / PHASE_SHIFT_MATH.GAUGE_MAX;
                const decayPctPerSec = PHASE_SHIFT_MATH.DECAY_BASE + 
                    PHASE_SHIFT_MATH.DECAY_ACCEL_COEFF * Math.pow(ratio, PHASE_SHIFT_MATH.DECAY_POWER);
                const decayAmountReal = (decayPctPerSec / 100) * PHASE_SHIFT_MATH.GAUGE_MAX * (deltaTime / 1000);
                
                this.phaseGauge -= decayAmountReal;
                this.lastDecayAmount = decayAmountReal / (deltaTime / 1000); // points per sec for display
                
                if (this.phaseGauge < 0) {
                    this.phaseGauge = 0;
                }
            }
        } else if (this.currentPhase === PHASE_WHITE_ENTER) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 2000) { // Assume 2s for enter effect
                this.currentPhase = PHASE_WHITE;
                this.stateTimer = 0;
                
                console.log(`[PhaseManager] ステート移行: ${PHASE_WHITE}`);

                // ステイシス（時間停止）を解除し、物理演算を再開
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 1.0;
                    GameState.isStasis = false;
                }
                if (toggleStasisEffect) toggleStasisEffect(false);

                // Start BGM
                if (SoundManager && SoundManager.startPhaseShiftBgmFromZero) {
                    SoundManager.startPhaseShiftBgmFromZero();
                }
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
        // Step 1確認用に、PHASE_WHITE中もパズルロジック（入力・落下）を許可する
        return this.currentPhase === PHASE_NORMAL || this.currentPhase === PHASE_WHITE;
    }

    getCurrentPhaseName() {
        return this.currentPhase;
    }
}

export const PhaseManager = new PhaseManagerImpl();
