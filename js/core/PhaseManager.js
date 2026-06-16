// PhaseManager.js

export const PHASE_START = 'ゲーム開始待機中';
export const PHASE_NORMAL = '通常パズル時';
export const PHASE_WHITE_ENTER = 'ホワイト突入演出中';
export const PHASE_WHITE = 'ホワイトステイシス中';
export const PHASE_WHITE_EXIT = 'ホワイト解除演出中';

class PhaseManagerImpl {
    constructor() {
        this.init();
    }

    init() {
        this.currentPhase = PHASE_START;
        this.stateTimer = 0;
    }

    update(deltaTime) {
        if (this.currentPhase === PHASE_START) {
            this.stateTimer += deltaTime;
            if (this.stateTimer >= 1500) {
                this.currentPhase = PHASE_NORMAL;
                this.stateTimer = 0;
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
