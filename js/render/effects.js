// effects.js
import { GameState, AppConfig } from '../core/config.js';
import { ParticleManager } from '../entity/ParticleManager.js';
import { LaserEffect } from '../entity/LaserEffect.js';
import { ScreenEffects } from './ScreenEffects.js';
import { BackgroundVisualizer } from './Visualizer.js';
import { soundManager } from './SoundManager.js';
import { rippleManager } from './RippleManager.js';
import { GaugeManager } from './GaugeManager.js';

// 各マネージャーのインスタンス化
export const particleManager = new ParticleManager();
export const laserEffect = new LaserEffect();
export const screenEffects = new ScreenEffects();
export const visualizer = new BackgroundVisualizer();
export { rippleManager, GaugeManager };

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

export function createRipple(x, y) {
    rippleManager.createRipple(x, y);
}

export function hideChainPopup() {
    screenEffects.hideChainPopup();
}

export function showScorePopup(points) {
    screenEffects.showScorePopup(points);
}

export function showFloatingNumber(text, type, x, y, delay) {
    screenEffects.showFloatingNumber(text, type, x, y, delay);
}

export function animateLaserLevels(levels, chainGems, glowColor, onComplete) {
    laserEffect.animateLaserLevels(levels, chainGems, glowColor, onComplete, GameState, screenEffects, playSE);
}

export function spawnParticles(x, y, colorStr) {
    if (AppConfig.EFFECT_LEVEL === 'NONE') return;
    const mult = AppConfig.EFFECT_LEVEL === 'LITE' ? 0.5 : 1.0;
    particleManager.spawnParticles(x, y, colorStr, mult);
}

// 新規追加 (renderer.js からの直接Pushを置き換え)
export function spawnSparks(x, y, colorStr, speedMult, count) {
    if (AppConfig.EFFECT_LEVEL !== 'FULL') return;
    particleManager.spawnSparks(x, y, colorStr, speedMult, count);
}

// 新規追加 (バーストスパーク用)
export function spawnBurstSparks(x, y, colorStr, speedMult, burstCount, sizeMult) {
    if (AppConfig.EFFECT_LEVEL !== 'FULL') return;
    particleManager.spawnBurstSparks(x, y, colorStr, speedMult, burstCount, sizeMult);
}

export function showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost) {
    if (screenEffects) screenEffects.showLevelUpPopup(oldLevel, newLevel, oldRate, newRate, oldCost, newCost);
}

export function showTribalUnlockEffect(colorStr) {
    if (screenEffects) screenEffects.showTribalUnlockEffect(colorStr);
}

export function triggerScreenShake() {
    if (AppConfig.EFFECT_LEVEL === 'NONE') return;
    screenEffects.triggerScreenShake();
}

export function triggerVisualizerSpike(color) {
    visualizer.triggerSpike(color);
}

import { MasterRenderer, LAYERS } from './MasterRenderer.js';

// Matter.jsのafterRenderにフックして各レイヤの描画を統合
export function setupEffectsRenderer() {
    // 第1層：背景
    MasterRenderer.registerLayer(LAYERS.BACKGROUND, (ctx) => {
        // パズル領域全体のクリア（必要に応じて黒背景を描画）
        // ヘッダ背景やビジュアライザは BASE_UI（第7層）で描画するため、ここは完全なベース背景とする
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 720, 1280);
    });

    // 第2層：宝石背面のレーザー等
    MasterRenderer.registerLayer(LAYERS.LASER, (ctx) => {
        laserEffect.updateAndDraw(ctx, GameState);
    });

    // 第4層：破片、火花等
    MasterRenderer.registerLayer(LAYERS.FOREGROUND_EFFECTS, (ctx) => {
        particleManager.updateAndDraw(ctx);
    });

    // 第6層：UIに被らない盤面専用ポストエフェクト
    MasterRenderer.registerLayer(LAYERS.IN_GAME_POST_EFFECT, (ctx) => {
        screenEffects.drawInGamePostEffects(ctx);
    });

    // 第7層：基本UI（外周ゲージとヘッダーUI）
    MasterRenderer.registerLayer(LAYERS.UI_BASE, (ctx) => {
        visualizer.updateAndDraw(ctx, GameState);
        GaugeManager.draw(ctx);
    });

    // 第8層：ポップアップテキスト
    MasterRenderer.registerLayer(LAYERS.POPUP_TEXT, (ctx) => {
        screenEffects.drawPopups(ctx);
    });

    // 描画前の全体エフェクト（Screen Shake等）
    MasterRenderer.registerPreRender((ctx) => {
        screenEffects.applyShake(ctx);
    });

    // 第11層：最前面UI、波紋など
    MasterRenderer.registerLayer(LAYERS.SYSTEM_TOP, (ctx) => {
        rippleManager.updateAndDraw(ctx);
    });

    // 第12層：FPSメーター、デバッグ情報など
    MasterRenderer.registerLayer(LAYERS.DEBUG_OVERLAY, (ctx) => {
        visualizer.drawDebug(ctx);
    });
}


export function togglePinchEffect(isPinch) {
    screenEffects.togglePinchEffect(isPinch);
}

export function toggleStasisEffect(isStasis) {
    screenEffects.toggleStasisEffect(isStasis);
}

// ==========================================
// SoundManager Facade
// ==========================================

export function playStageBgmSet(key) {
    soundManager.playStageBgmSet(key);
}

export function switchStageBgmState(state) {
    soundManager.switchStageBgmState(state);
}

export function setStageBgmVolumeRatio(ratio) {
    soundManager.setStageBgmVolumeRatio(ratio);
}

export function playSceneBGM(key) {
    soundManager.playSceneBGM(key);
}

export function stopBGM() {
    soundManager.stopBGM();
}

export function playSE(key, options) {
    soundManager.playSE(key, options);
}

export function playVoice(key) {
    // 既存互換性維持
    if(soundManager.playVoice) {
        soundManager.playVoice(key);
    }
}

