import { GameState, EFFECT_MATH_CONFIG } from '../core/config.js';
import { ScreenEffectPopup } from './ScreenEffectPopup.js';
import { ScreenEffectVignette } from './ScreenEffectVignette.js';
import { ScreenEffectTransition } from './ScreenEffectTransition.js';

export class ScreenEffects {
    constructor() {
        this.shakeState = { active: false, elapsed: 0, duration: 0, magnitude: 5 };
        this.lastRippleTime = 0;
        
        // 分割したクラスのインスタンス生成
        this.popup = new ScreenEffectPopup();
        this.vignette = new ScreenEffectVignette();
        this.transition = new ScreenEffectTransition();
    }

    update(realDelta, gameDelta) {
        // 各インスタンスへ更新を委譲
        this.popup.update(realDelta, gameDelta);
        this.vignette.update(realDelta, gameDelta);
        this.transition.update(realDelta, gameDelta);

        // 画面揺れは本体で管理
        if (this.shakeState.active) {
            if (!GameState.isPuzzlePaused) {
                this.shakeState.elapsed += gameDelta;
                this.shakeState.time = (this.shakeState.time || 0) + gameDelta;
                if (this.shakeState.elapsed >= this.shakeState.duration) {
                    this.shakeState.active = false;
                }
            }
        }
    }

    // ==========================================
    // Popup Facade
    // ==========================================
    triggerPrismLinkStep(step, baseColorId = 0, isWhitePhase = false) {
        this.popup.triggerPrismLinkStep(step, baseColorId, isWhitePhase);
    }

    showChainPopup(count, color, depth = 1) {
        this.popup.showChainPopup(count, color, depth);
    }

    hideChainPopup() {
        this.popup.hideChainPopup();
    }

    showScorePopup(points) {
        this.popup.showScorePopup(points);
    }

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        this.popup.showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost);
    }

    showFloatingNumber(text, type, x, y, delay = 0) {
        this.popup.showFloatingNumber(text, type, x, y, delay);
    }

    drawPopups(ctx) {
        // 画面揺れがPopup内で PrismLink着地時等 に呼び出される場合があるため、
        // ScreenEffectPopup 内部から triggerScreenShake を呼べるようコールバックを渡す
        this.popup.drawPopups(ctx, (magnitude) => this.triggerScreenShake(magnitude));
    }

    // ==========================================
    // Vignette Facade
    // ==========================================
    showTribalUnlockEffect(colorStr) {
        this.vignette.showTribalUnlockEffect(colorStr);
    }

    togglePinchEffect(isPinch) {
        this.vignette.togglePinchEffect(isPinch);
    }

    toggleStasisEffect(isStasis) {
        this.vignette.toggleStasisEffect(isStasis);
    }

    drawInGamePostEffects(ctx, gameTime) {
        this.vignette.drawInGamePostEffects(ctx, gameTime);
    }

    // ==========================================
    // Transition Facade
    // ==========================================
    triggerWhiteFlash() {
        this.transition.triggerWhiteFlash();
    }

    drawGlobalPostEffects(ctx) {
        this.transition.drawGlobalPostEffects(ctx);
    }

    // ==========================================
    // ScreenShake (本体ロジック)
    // ==========================================
    triggerScreenShake(magnitude = 5) {
        this.shakeState.active = true;
        this.shakeState.elapsed = 0;
        this.shakeState.time = 0;
        this.shakeState.duration = EFFECT_MATH_CONFIG.SHAKE_DURATION_MS;
        this.shakeState.magnitude = magnitude;
    }

    applyShake(ctx) {
        if (!this.shakeState.active) return;
        if (GameState.isPuzzlePaused) return; // Wait during pause
        
        const remaining = this.shakeState.duration - this.shakeState.elapsed;
        const progress = Math.max(0, remaining / this.shakeState.duration);
        const currentMagnitude = this.shakeState.magnitude * progress;

        const time = this.shakeState.time || 0;
        // スローモーションに対応した、サイン波の合成による滑らかな揺れ
        const dx = (Math.sin(time * 0.05) * Math.cos(time * 0.03)) * currentMagnitude * 2;
        const dy = (Math.cos(time * 0.04) * Math.sin(time * 0.035)) * currentMagnitude * 2;

        ctx.translate(dx, dy);
    }
}
