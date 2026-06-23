import { AppConfig, COLOR_CONFIG, THEME_COLORS } from '../core/config.js';
import { EFFECT_MATH_CONFIG } from '../core/effectConfig.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { AssetManager } from './SpriteCacheManager.js';
import { particleManager } from './effects.js';
import { PhaseManager, PHASE_NORMAL } from '../core/PhaseManager.js';
import { FloatingNumberRenderer } from './FloatingNumberRenderer.js';
import { ChainScoreRenderer } from './ChainScoreRenderer.js';
import { PrismLinkRenderer } from './PrismLinkRenderer.js';
import { LevelUpRenderer } from './LevelUpRenderer.js';

export class ScreenEffectPopup {
    constructor() {
        this.chainScoreRenderer = new ChainScoreRenderer();
        this.floatingNumberRenderer = new FloatingNumberRenderer();
        this.prismLinkRenderer = new PrismLinkRenderer();
        this.levelUpRenderer = new LevelUpRenderer();
    }

    update(realDelta, gameDelta) {
        this.chainScoreRenderer.update(gameDelta);
        this.floatingNumberRenderer.update(gameDelta);
        this.prismLinkRenderer.update(realDelta, gameDelta);
        this.levelUpRenderer.update(gameDelta);
    }

    triggerPrismLinkStep(step, baseColorId = 0, isWhitePhase = false) {
        this.prismLinkRenderer.triggerPrismLinkStep(step, baseColorId, isWhitePhase);
    }

    showChainPopup(count, color, depth = 1) {
        this.chainScoreRenderer.showChainPopup(count, color, depth);
    }

    hideChainPopup() {
        this.chainScoreRenderer.hideChainPopup();
        this.prismLinkRenderer.triggerSublimationIfNeeded();
    }

    showScorePopup(points) {
        this.chainScoreRenderer.showScorePopup(points);
        this.prismLinkRenderer.triggerSublimationIfNeeded();
    }

    showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
        this.levelUpRenderer.showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost);
    }

    showFloatingNumber(text, type, x, y, delay = 0) {
        this.floatingNumberRenderer.showFloatingNumber(text, type, x, y, delay);
    }

    drawPopups(ctx, _triggerScreenShake) {
        // 1. フローティングテキスト
        this.floatingNumberRenderer.draw(ctx);

        // 2. Prism Link UI & Sublimation Effects
        this.prismLinkRenderer.draw(ctx, _triggerScreenShake);

        // 3. Chain & Score Popup
        this.chainScoreRenderer.draw(ctx);

        // 4. Level Up Popup
        this.levelUpRenderer.draw(ctx);
    }
}
