// effects.js
import { GameState } from './config.js';
import { ParticleManager } from './ParticleManager.js';
import { LaserEffect } from './LaserEffect.js';
import { ScreenEffects } from './ScreenEffects.js';

// 各マネージャーのインスタンス化
export const particleManager = new ParticleManager();
export const laserEffect = new LaserEffect();
export const screenEffects = new ScreenEffects();

// 全エフェクトのリセット
export function clearAll() {
    particleManager.clear();
    laserEffect.clear();
}

export function clearLasers() {
    laserEffect.clear();
}

// ==========================================
// Facade Methods (既存システムとの互換性維持)
// ==========================================

export function showChainPopup(count, color) {
    screenEffects.showChainPopup(count, color);
}

export function hideChainPopup() {
    screenEffects.hideChainPopup();
}

export function showScorePopup(points) {
    screenEffects.showScorePopup(points);
}

export function animateLaserLevels(levels, chainGems, glowColor, onComplete) {
    laserEffect.animateLaserLevels(levels, chainGems, glowColor, onComplete, GameState, screenEffects);
}

export function spawnParticles(x, y, colorStr) {
    particleManager.spawnParticles(x, y, colorStr);
}

// 新規追加 (renderer.js からの直接Pushを置き換え)
export function spawnSparks(x, y, colorStr, speedMult, count) {
    particleManager.spawnSparks(x, y, colorStr, speedMult, count);
}

// 新規追加 (バーストスパーク用)
export function spawnBurstSparks(x, y, colorStr, speedMult, burstCount, sizeMult) {
    particleManager.spawnBurstSparks(x, y, colorStr, speedMult, burstCount, sizeMult);
}

export function triggerScreenShake() {
    screenEffects.triggerScreenShake();
}

// Matter.jsのafterRenderにフックして各レイヤの描画を統合
export function hookEffectsRenderer(Events, render) {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        // 描画順序の厳守: Laser (Layer 3) -> Particles (Layer 4)
        laserEffect.updateAndDraw(ctx, GameState);
        particleManager.updateAndDraw(ctx);
    });
}

// GaugeManager の Facade 化
export const GaugeManager = screenEffects.GaugeManager;

export function updateLevelDisplay(level) {
    screenEffects.updateLevelDisplay(level);
}

export function togglePinchEffect(isPinch) {
    screenEffects.togglePinchEffect(isPinch);
}

export function toggleStasisEffect(isStasis) {
    screenEffects.toggleStasisEffect(isStasis);
}
