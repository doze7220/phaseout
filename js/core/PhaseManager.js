// PhaseManager.js

import { GameState, PHASE_SHIFT_MATH, AppConfig } from './config.js';
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
        this.breakGauge = 0;
        this.whitePhaseTimeMs = 0;
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
        
        if (this.currentPhase === PHASE_WHITE) {
            this.phaseGauge = Math.min(PHASE_SHIFT_MATH.GAUGE_MAX, this.phaseGauge + total);
            this.breakGauge = Math.min(1000, (this.breakGauge || 0) + total);
            if (this.breakGauge >= 1000) {
                console.log("[PhaseManager] BREAK GAUGE MAX REACHED!");
            }
            this.lastGaugeAdd = total;
            return;
        }

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
            GameState.isPuzzlePaused = true;
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
        if (GameState.isSystemPaused) return;

        // BREAK GAUGE DECAY (Always active if > 0)
        if (this.breakGauge > 0 && !GameState.isPuzzlePaused) {
            const ratio = this.breakGauge / 1000;
            const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
            const decayPctPerSec = PHASE_SHIFT_MATH.DECAY_BASE + 
                PHASE_SHIFT_MATH.DECAY_ACCEL_COEFF * Math.pow(ratio, PHASE_SHIFT_MATH.DECAY_POWER);
            const decayAmountReal = (decayPctPerSec / 100) * 1000 * (deltaTime / 1000) * shiftMult;
            this.breakGauge -= decayAmountReal;
            if (this.breakGauge < 0) this.breakGauge = 0;
        }

        if (this.currentPhase === PHASE_START) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 1500) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
            }
        } else if (this.currentPhase === PHASE_NORMAL) {
            if (this.phaseGauge > 0 && !GameState.isPuzzlePaused) {
                const ratio = this.phaseGauge / PHASE_SHIFT_MATH.GAUGE_MAX;
                const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
                const decayPctPerSec = PHASE_SHIFT_MATH.DECAY_BASE + 
                    PHASE_SHIFT_MATH.DECAY_ACCEL_COEFF * Math.pow(ratio, PHASE_SHIFT_MATH.DECAY_POWER);
                const decayAmountReal = (decayPctPerSec / 100) * PHASE_SHIFT_MATH.GAUGE_MAX * (deltaTime / 1000) * shiftMult;
                
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
                this.whitePhaseTimeMs = 0;
                
                console.log(`[PhaseManager] ステート移行: ${PHASE_WHITE}`);

                // ステイシス（時間停止）を解除し、物理演算を再開
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 1.0;
                    GameState.isPuzzlePaused = false;
                }
                if (toggleStasisEffect) toggleStasisEffect(false);

                // Start BGM
                if (SoundManager && SoundManager.startPhaseShiftBgmFromZero) {
                    SoundManager.startPhaseShiftBgmFromZero();
                }
            }
        } else if (this.currentPhase === PHASE_WHITE) {
            this.stateTimer += deltaTime;
            if (!GameState.isPuzzlePaused) {
                this.whitePhaseTimeMs += deltaTime;
                
                // 動的加速減衰
                const t = this.whitePhaseTimeMs / 1000;
                const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
                const decayPerSec = 50 * (1 + Math.pow(t / 10, 2)) * shiftMult;
                const decayReal = decayPerSec * (deltaTime / 1000);
                
                this.phaseGauge -= decayReal;
            }

            if (this.phaseGauge <= 0) {
                this.phaseGauge = 0;

                // チェイン演出中であれば、完了（スコア確定）までステイシス移行を待機する
                if (!GameState.isAnimating) {
                    this.currentPhase = PHASE_WHITE_EXIT;
                    this.stateTimer = 0;
                    
                    console.log(`[PhaseManager] ステート移行: ${PHASE_WHITE_EXIT}`);

                    // 物理エンジンを完全に停止させる（ステイシス状態）
                    if (GameState.engine) {
                        GameState.engine.timing.timeScale = 0;
                        GameState.isPuzzlePaused = true;
                    }
                    if (toggleStasisEffect) toggleStasisEffect(true);

                    // 即座に無音化
                    if (SoundManager && SoundManager.instantStopBGM) {
                        SoundManager.instantStopBGM();
                    }

                    // 白フラッシュトリガー
                    if (triggerWhiteFlash) triggerWhiteFlash();
                }
            }
        } else if (this.currentPhase === PHASE_WHITE_EXIT) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 1000) { // 1秒間の静寂とフラッシュ後
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
                this.phaseGauge = 0; // ゲージリセット
                
                console.log(`[PhaseManager] ステート移行: ${PHASE_NORMAL}`);

                // ステイシス解除
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 1.0;
                    GameState.isPuzzlePaused = false;
                }
                if (toggleStasisEffect) toggleStasisEffect(false);

                // 通常BGMを0秒から再起動
                if (SoundManager && SoundManager.restartCurrentStageBgm) {
                    SoundManager.restartCurrentStageBgm();
                }
            }
        } else if (this.currentPhase === PHASE_GAMEOVER) {
            if (!GameState.isAnimating && !this.isFinalGameOverTriggered) {
                this.isFinalGameOverTriggered = true;
                
                if (GameState.engine) {
                    GameState.engine.timing.timeScale = 0;
                    GameState.isPuzzlePaused = true; // 完全停止
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

    checkPhaseTransition() {
        if (this.currentPhase === PHASE_NORMAL && this.phaseGauge >= PHASE_SHIFT_MATH.GAUGE_MAX) {
            this.enterWhitePhase();
            return true;
        }
        return false;
    }
}

export const PhaseManager = new PhaseManagerImpl();
