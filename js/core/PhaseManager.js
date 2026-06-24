// PhaseManager.js

import { GameState, PHASE_SHIFT_MATH, AppConfig } from './config.js';
import { EFFECT_MATH_CONFIG, WHITE_PHASE_EFFECT_CONFIG, BLACK_PHASE_EFFECT_CONFIG } from './effectConfig.js';
import { toggleStasisEffect, playSE, triggerWhiteFlash, SoundManager } from '../render/effects.js';
import { SceneManager } from './SceneManager.js';
import { ResultScene } from '../scene/ResultScene.js';
import { GaugeManager } from '../render/GaugeManager.js';
import { BackgroundManager } from '../render/BackgroundManager.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
export const PHASE_START = 'ゲーム開始待機中';
export const PHASE_NORMAL = '通常パズル時';
export const PHASE_WHITE_ENTER = 'ホワイト突入演出中';
export const PHASE_WHITE = 'ホワイトステイシス中';
export const PHASE_WHITE_EXIT = 'ホワイト解除演出中';
export const PHASE_BLACK_ENTER = 'ブラック突入演出中';
export const PHASE_BLACK = 'ブラックフェイズ中';
export const PHASE_BLACK_EXIT = 'ブラック解除演出中';
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
        this.lastBreakGaugeAdd = 0;
        this.lastBreakDecayAmount = 0;
        this.hasRegeneratedEnterCache = false;
        this.hasRegeneratedExitCache = false;
        GameState.isWhiteExitWipeOut = false;
    }

    setGameOver() {
        if (this.currentPhase !== PHASE_GAMEOVER) {
            this.currentPhase = PHASE_GAMEOVER;
            this.stateTimer = 0;
            this.isFinalGameOverTriggered = false;
            
            GameState.isGameOver = true;
            GameState.isGameOver = true;
            toggleStasisEffect(true);
        }
    }

    cancelGameOver() {
        // setGameOver() が変更した全状態を一括で生存状態に戻す（カプセル化）
        if (this.currentPhase === PHASE_GAMEOVER) {
            this.currentPhase = PHASE_NORMAL;
            this.stateTimer = 0;                    // 残タイマーによる予期せぬ遷移を防止
            this.isFinalGameOverTriggered = false;  // 処刑確定フラグをリセット

            GameState.isGameOver = false;
            GameState.isGameOver = false;
            if (GameState.engine) {
                GameState.engine.gravity.y = 1;           // 重力を確実にデフォルト値に戻す（防衛的）
            }
            toggleStasisEffect(false);

            console.log('[PhaseManager] ゲームオーバーキャンセル: PHASE_NORMAL に復帰');
        }
    }

    setTimeScaleTarget(targetVal, durationMs, onComplete = null) {
        if (!GameState.engine) return;
        
        let startVal = GameState.stasisTimeScale !== undefined ? GameState.stasisTimeScale : 1.0;

        this.timeScaleTransition = {
            active: true,
            startVal: startVal,
            endVal: targetVal,
            elapsed: 0,
            duration: Math.max(durationMs, 1),
            onComplete: onComplete
        };
    }

    addPhaseGauge(chainCount = 0, prismDepth = 0) {
        const base = PHASE_SHIFT_MATH.GAUGE_ADD_BASE;
        const chain = PHASE_SHIFT_MATH.GAUGE_ADD_CHAIN_MULTI * chainCount;
        const depth = PHASE_SHIFT_MATH.GAUGE_ADD_DEPTH_MULTI * (prismDepth / 10 + 1);
        const total = base + chain + depth;
        
        const decayRate = Math.pow(PHASE_SHIFT_MATH.GAUGE_ACQUISITION_DECAY_RATE, GameState.whitePhaseCount);
        const finalTotal = total * decayRate;
        
        if (this.currentPhase === PHASE_WHITE) {
            this.phaseGauge = Math.min(PHASE_SHIFT_MATH.GAUGE_MAX, this.phaseGauge + finalTotal);
            this.breakGauge = Math.min(1000, (this.breakGauge || 0) + total);
            if (this.breakGauge >= 1000) {
                console.log("[PhaseManager] BREAK GAUGE MAX REACHED! Transitioning to Black Phase.");
                this.enterBlackPhase();
            }
            this.lastGaugeAdd = finalTotal;
            this.lastBreakGaugeAdd = total;
            return finalTotal;
        }

        this.phaseGauge += finalTotal;
        this.lastGaugeAdd = finalTotal;

        if (this.phaseGauge >= PHASE_SHIFT_MATH.GAUGE_MAX) {
            this.phaseGauge = PHASE_SHIFT_MATH.GAUGE_MAX;
            if (this.currentPhase === PHASE_NORMAL) {
                this.enterWhitePhase();
            }
        }
        
        return total;
    }

    enterWhitePhase() {
        this.currentPhase = PHASE_WHITE_ENTER;
        this.stateTimer = 0;
        this.lastDecayAmount = 0;
        this.hasRegeneratedEnterCache = false;

        console.log(`[PhaseManager] フェイズシフト突入: ${PHASE_WHITE_ENTER}`);

        BackgroundManager.clearPrismFluctuation();

        // 物理エンジンをゆっくり停止させる
        if (GameState.engine) {
            GameState.isPuzzlePaused = false; // 移行中は動かしておく
            const fadeMs = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE.STASIS_ENTER_FADE_MS || 500;
            this.setTimeScaleTarget(0.0, fadeMs, () => {
                GameState.isPuzzlePaused = true;
            });
        }

        // BGMをフェードアウト
        if (SoundManager && SoundManager.fadeOutAllBGM) {
            const fadeSec = (WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE.STASIS_ENTER_FADE_MS || 500) / 1000;
            SoundManager.fadeOutAllBGM(fadeSec);
        }
    }

    enterBlackPhase() {
        this.currentPhase = PHASE_BLACK_ENTER;
        this.stateTimer = 0;
        this.breakGauge = PHASE_SHIFT_MATH.GAUGE_MAX; // 1000で突入
        GameState.blackHoleVisualPulse = 0;
        
        console.log(`[PhaseManager] ブラックフェイズ突入: ${PHASE_BLACK_ENTER}`);

        if (GameState.engine) {
            // ブラックフェイズ中は物理エンジンを動かし続ける
            GameState.isPuzzlePaused = false;
            // timeScaleを通常に戻す（ホワイトで遅くなっていたものを元に戻す）
            this.setTimeScaleTarget(1.0, 500);
        }

        if (SoundManager && SoundManager.fadeOutAllBGM) {
            const fadeSec = (BLACK_PHASE_EFFECT_CONFIG.ENTER_MS || 2000) / 1000;
            SoundManager.fadeOutAllBGM(fadeSec);
        }
    }

    update(deltaTime) {
        if (GameState.isSystemPaused) return;

        // timeScale トランジション更新
        if (this.timeScaleTransition && this.timeScaleTransition.active && GameState.engine) {
            this.timeScaleTransition.elapsed += deltaTime;
            const t = this.timeScaleTransition;
            if (t.elapsed >= t.duration) {
                GameState.stasisTimeScale = t.endVal;
                t.active = false;
                if (t.onComplete) t.onComplete();
            } else {
                const p = t.elapsed / t.duration;
                // Ease-In-Out
                const smoothP = p * p * (3 - 2 * p);
                
                // Matter.jsの timeScale を直接操作すると微分積分計算が破綻して跳ねる原因になるため、
                // engine.timing.timeScale には触れず、演出用プロパティだけを更新する。
                // 物理エンジン側 (physics.js) はこの値を見て経過時間(Delta)をスケールして更新頻度を落とす。
                GameState.stasisTimeScale = t.startVal + (t.endVal - t.startVal) * smoothP;
            }
        }

        // BREAK GAUGE DECAY (Always active if > 0, except in Black Phase)
        const isBlackPhaseRelated = this.currentPhase === PHASE_BLACK_ENTER || this.currentPhase === PHASE_BLACK || this.currentPhase === PHASE_BLACK_EXIT;
        if (this.breakGauge > 0 && !GameState.isPuzzlePaused && !isBlackPhaseRelated) {
            const ratio = this.breakGauge / 1000;
            const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
            const decayPctPerSec = PHASE_SHIFT_MATH.DECAY_BASE + 
                PHASE_SHIFT_MATH.DECAY_ACCEL_COEFF * Math.pow(ratio, PHASE_SHIFT_MATH.DECAY_POWER);
            const decayAmountReal = (decayPctPerSec / 100) * 1000 * (deltaTime / 1000) * shiftMult;
            this.breakGauge -= decayAmountReal;
            this.lastBreakDecayAmount = decayAmountReal / (deltaTime / 1000);
            if (this.breakGauge < 0) this.breakGauge = 0;
        } else if (!isBlackPhaseRelated) {
            this.lastBreakDecayAmount = 0;
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
            
            const conf = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE;
            const timeStasis = conf.STASIS_DELAY_MS;
            const timeTribal = timeStasis + conf.TRIBAL_TOTAL_MS;
            const timeIn = timeTribal + conf.TRANSITION_IN_EXPAND_MS;
            const totalTime = timeIn + conf.TRANSITION_OUT_WIPE_MS;

            // 白フラッシュ中（画面が白く塗りつぶされたタイミング）でキャッシュを再生成
            if (this.stateTimer >= timeIn && !this.hasRegeneratedEnterCache) {
                SpriteCacheManager.generateAllCaches(true);
                this.hasRegeneratedEnterCache = true;
            }

            if (this.stateTimer >= totalTime) {
                this.currentPhase = PHASE_WHITE;
                this.stateTimer = 0;
                this.whitePhaseTimeMs = 0;
                
                console.log(`[PhaseManager] ステート移行: ${PHASE_WHITE}`);

                // ステイシス（時間停止）を解除し、物理演算をゆっくり再開
                if (GameState.engine) {
                    GameState.isPuzzlePaused = false;
                    const fadeMs = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE.STASIS_EXIT_FADE_MS || 500;
                    this.setTimeScaleTarget(1.0, fadeMs); 
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
                
                // 動的加速減衰 (コンフィグベース)
                const t = this.whitePhaseTimeMs / 1000;
                const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
                
                const conf = PHASE_SHIFT_MATH;
                const timeFactor = t / conf.WHITE_DECAY_TIME_DIVISOR;
                const decayPerSec = (conf.WHITE_DECAY_BASE + conf.WHITE_DECAY_ACCEL_COEFF * Math.pow(timeFactor, conf.WHITE_DECAY_POWER)) * shiftMult;
                
                const decayReal = decayPerSec * (deltaTime / 1000);
                this.phaseGauge -= decayReal;
                this.lastDecayAmount = decayPerSec; // 追加: デバッグ表示用
            }

            if (this.phaseGauge <= 0) {
                this.phaseGauge = 0;

                // チェイン演出中であれば、完了（スコア確定）までステイシス移行を待機する
                if (!GameState.isAnimating) {
                    this.currentPhase = PHASE_WHITE_EXIT;
                    this.stateTimer = 0;
                    this.hasRegeneratedExitCache = false;
                    
                    console.log(`[PhaseManager] ステート移行: ${PHASE_WHITE_EXIT}`);

                    // 物理エンジンをゆっくり停止させる
                    if (GameState.engine) {
                        GameState.isPuzzlePaused = false;
                        const conf = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE_EXIT || WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE;
                        const fadeMs = conf.STASIS_ENTER_FADE_MS || 500;
                        this.setTimeScaleTarget(0.0, fadeMs, () => {
                            GameState.isPuzzlePaused = true;
                        });
                    }
                    if (toggleStasisEffect) toggleStasisEffect(true);

                    // BGMをフェードアウト
                    if (SoundManager && SoundManager.fadeOutAllBGM) {
                        const conf = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE_EXIT || WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE;
                        const fadeSec = (conf.STASIS_ENTER_FADE_MS || 500) / 1000;
                        SoundManager.fadeOutAllBGM(fadeSec);
                    }
                }
            }
        } else if (this.currentPhase === PHASE_WHITE_EXIT) {
            this.stateTimer += deltaTime;
            const conf = WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE_EXIT || WHITE_PHASE_EFFECT_CONFIG.PHASE_WHITE;
            const wipeStartTime = conf.STASIS_DELAY_MS + conf.TRIBAL_TOTAL_MS;
            const totalTime = wipeStartTime + conf.TRANSITION_OUT_WIPE_MS;

            if (this.stateTimer >= wipeStartTime && !this.hasRegeneratedExitCache) {
                // トライバル演出が終了し、マスクワイプが始まる直前でキャッシュ再生成
                SpriteCacheManager.generateAllCaches(false);
                this.hasRegeneratedExitCache = true;
                GameState.isWhiteExitWipeOut = true;
            }

            if (this.stateTimer >= totalTime) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
                this.phaseGauge = 0; // ゲージリセット
                GameState.whitePhaseCount++;
                this.breakGauge = 0; // リバースゲージリセット
                this.lastDecayAmount = 0; // 減算値リセット
                this.lastBreakGaugeAdd = 0; // 追加: Rゲージ加算値リセット
                GameState.isWhiteExitWipeOut = false;
                
                console.log(`[PhaseManager] ステート移行: ${PHASE_NORMAL}`);

                // ステイシス解除をゆっくり行う
                if (GameState.engine) {
                    GameState.isPuzzlePaused = false;
                    const fadeMs = conf.STASIS_EXIT_FADE_MS || 500;
                    
                    // すでにワイプで色が戻っているため、物理エンジンの復帰フェードに伴う色フェードを無効化する
                    GameState.disableStasisFilter = true;
                    this.setTimeScaleTarget(1.0, fadeMs, () => {
                        GameState.disableStasisFilter = false;
                    });
                }
                if (toggleStasisEffect) toggleStasisEffect(false);

                // 通常BGMを0秒から再起動（現在の状態を引き継ぐ）
                if (SoundManager && SoundManager.restartCurrentStageBgm) {
                    SoundManager.restartCurrentStageBgm(GameState.currentBgmState || 'normal');
                }
            }
        } else if (this.currentPhase === PHASE_BLACK_ENTER) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= BLACK_PHASE_EFFECT_CONFIG.ENTER_MS) {
                this.currentPhase = PHASE_BLACK;
                this.stateTimer = 0;
                this.blackPhaseTimeMs = 0;
                console.log(`[PhaseManager] ステート移行: ${PHASE_BLACK}`);
            }
        } else if (this.currentPhase === PHASE_BLACK) {
            this.stateTimer += deltaTime;
            
            if (!GameState.isPuzzlePaused) {
                this.blackPhaseTimeMs = (this.blackPhaseTimeMs || 0) + deltaTime;
                
                // 動的加速減衰
                const t = this.blackPhaseTimeMs / 1000;
                const shiftMult = (AppConfig.SHIFT_DECAY_MULT !== undefined) ? AppConfig.SHIFT_DECAY_MULT : 1;
                
                const conf = PHASE_SHIFT_MATH;
                const timeFactor = t / conf.BLACK_DECAY_TIME_DIVISOR;
                const decayPerSec = (conf.BLACK_DECAY_BASE + conf.BLACK_DECAY_ACCEL_COEFF * Math.pow(timeFactor, conf.BLACK_DECAY_POWER)) * shiftMult;
                
                const decayReal = decayPerSec * (deltaTime / 1000);
                this.breakGauge -= decayReal;
                this.lastBreakDecayAmount = decayPerSec;
            }
            
            if (GameState.blackHoleVisualPulse > 0) {
                GameState.blackHoleVisualPulse *= 0.9;
                if (GameState.blackHoleVisualPulse < 0.1) GameState.blackHoleVisualPulse = 0;
            }
            
            if (this.breakGauge <= 0) {
                this.breakGauge = 0;
                this.currentPhase = PHASE_BLACK_EXIT;
                this.stateTimer = 0;
                console.log(`[PhaseManager] ステート移行: ${PHASE_BLACK_EXIT}`);
            }
        } else if (this.currentPhase === PHASE_BLACK_EXIT) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= BLACK_PHASE_EFFECT_CONFIG.EXIT_MS) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
                this.phaseGauge = 0;
                this.breakGauge = 0;
                this.lastDecayAmount = 0;
                this.lastBreakGaugeAdd = 0;
                this.lastBreakDecayAmount = 0;
                console.log(`[PhaseManager] ステート移行: ${PHASE_NORMAL}`);
                
                if (SoundManager && SoundManager.restartCurrentStageBgm) {
                    SoundManager.restartCurrentStageBgm(GameState.currentBgmState || 'normal');
                }
            }
        } else if (this.currentPhase === PHASE_GAMEOVER) {
            if (!GameState.isAnimating && !this.isFinalGameOverTriggered) {
                this.isFinalGameOverTriggered = true;
                
                if (GameState.engine) {
                    GameState.isPuzzlePaused = true; // 完全停止
                }

                GameState.displayScore = GameState.actualScore;
                GaugeManager.update(0);
                playSE('GAMEOVER');
            }

            if (this.isFinalGameOverTriggered) {
                // チェイン演出完了まで待機（isAnimating中はタイマーを進めない）
                if (!GameState.isAnimating) {
                    this.stateTimer += deltaTime;
                }
                if (this.stateTimer >= 1500) {
                    this.stateTimer = -999999;
                    SceneManager.pushScene(new ResultScene());
                }
            }
        }
    }

    isNormalPhase() {
        // 物理演算やパズル入力を許可するフェイズ
        return this.currentPhase === PHASE_NORMAL || this.currentPhase === PHASE_WHITE || this.currentPhase === PHASE_BLACK;
    }

    getCurrentPhaseName() {
        return this.currentPhase;
    }

    checkPhaseTransition() {
        if (this.currentPhase === PHASE_NORMAL && this.phaseGauge >= PHASE_SHIFT_MATH.GAUGE_MAX) {
            this.enterWhitePhase();
            return true;
        }
        
        const isBlackPhaseRelated = this.currentPhase === PHASE_BLACK_ENTER || this.currentPhase === PHASE_BLACK || this.currentPhase === PHASE_BLACK_EXIT;
        if (this.breakGauge >= PHASE_SHIFT_MATH.GAUGE_MAX && !isBlackPhaseRelated) {
            this.enterBlackPhase();
            return true;
        }
        
        return false;
    }

    getGaugeRatio() {
        return Math.max(0.0, Math.min(1.0, this.phaseGauge / PHASE_SHIFT_MATH.GAUGE_MAX));
    }

    getDecayAmount() {
        return this.lastDecayAmount || 0;
    }
}

export const PhaseManager = new PhaseManagerImpl();
