// effects.js
import { GameState, AppConfig } from '../core/config.js';
import { ParticleManager } from '../entity/ParticleManager.js';
import { LaserEffect } from '../entity/LaserEffect.js';
import { ScreenEffects } from './ScreenEffects.js';
import { BackgroundVisualizer } from './Visualizer.js';
import { soundManager } from './SoundManager.js';
import { rippleManager } from './RippleManager.js';
import { GaugeManager } from './GaugeManager.js';
import { PhaseManager } from '../core/PhaseManager.js';
import { BackgroundManager } from './BackgroundManager.js';
import { FooterUIManager } from './FooterUIManager.js';

// 各マネージャーのインスタンス化
export const particleManager = new ParticleManager();
export const laserEffect = new LaserEffect();
export const screenEffects = new ScreenEffects();
export const visualizer = new BackgroundVisualizer();
export const footerUIManager = new FooterUIManager();
export { rippleManager, GaugeManager, BackgroundManager, soundManager as SoundManager };

// 全エフェクトのリセット
export function clearAll() {
    particleManager.clear();
    laserEffect.clear();
    BackgroundManager.clearPrismFluctuation();
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

export function animateLaserLevels(levels, chainGems, glowColor, onComplete, isWhitePhase = false) {
    laserEffect.animateLaserLevels(levels, chainGems, glowColor, onComplete, GameState, screenEffects, playSE, isWhitePhase);
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

export function triggerWhiteFlash() {
    if (screenEffects) screenEffects.triggerWhiteFlash();
}

export function spawnPrismFluctuation(x, y, colorHex, addedGauge) {
    if (AppConfig.EFFECT_LEVEL === 'NONE') return;
    if (BackgroundManager.spawnPrismFluctuation) {
        BackgroundManager.spawnPrismFluctuation(x, y, colorHex, addedGauge);
    }
}

import { MasterRenderer, LAYERS } from './MasterRenderer.js';

// Matter.jsのafterRenderにフックして各レイヤの描画を統合
export function setupEffectsRenderer() {
    // 第1層：背景
    MasterRenderer.registerLayer(LAYERS.BACKGROUND, (ctx) => {
        // パズル領域全体のクリア（デフォルトの黒背景）
        // ヘッダ背景やビジュアライザは BASE_UI（第7層）で描画するため、ここは完全なベース背景とする
        ctx.fillStyle = '#0a0a0a';
        // 画面シェイクによるオフセットを考慮し、描画範囲を余分にとる
        ctx.fillRect(-50, -50, 720 + 100, 1280 + 100);

        // 背景マネージャーへ描画を委譲（ホワイトフェイズ反転など）
        BackgroundManager.draw(ctx, GameState, PhaseManager);
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
        screenEffects.drawInGamePostEffects(ctx, MasterRenderer.getGameTime());
    });

    // 第7層：基本UI（外周ゲージとヘッダーUI）
    MasterRenderer.registerLayer(LAYERS.UI_BASE, (ctx) => {
        visualizer.updateAndDraw(ctx, GameState);
        GaugeManager.draw(ctx);
        footerUIManager.updateAndDraw(ctx, GameState);
    });

    // 第8層：ポップアップテキスト
    MasterRenderer.registerLayer(LAYERS.POPUP_TEXT, (ctx) => {
        screenEffects.drawPopups(ctx);
    });

    // 第10層：グローバルポストエフェクト（トランジション等）
    MasterRenderer.registerLayer(LAYERS.GLOBAL_POST_EFFECT, (ctx) => {
        screenEffects.drawGlobalPostEffects(ctx);
    });

    // 描画前の全体エフェクト（Screen Shake等）
    MasterRenderer.registerPreRender((ctx) => {
        screenEffects.applyShake(ctx);
    });

    // 第11層：最前面UI、波紋など
    MasterRenderer.registerLayer(LAYERS.SYSTEM_TOP, (ctx) => {
        rippleManager.draw(ctx);
    });

    // 第12層：FPSメーター、デバッグ情報など
    MasterRenderer.registerLayer(LAYERS.DEBUG_OVERLAY, (ctx) => {
        visualizer.drawDebug(ctx);
    });

    // 全体エフェクトの更新処理
    MasterRenderer.registerGlobalUpdate((realDelta, gameDelta) => {
        screenEffects.update(realDelta, gameDelta);
        rippleManager.update(realDelta, gameDelta);
        laserEffect.update(realDelta, gameDelta);
        BackgroundManager.update(realDelta, gameDelta);
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

export function playStageBgmSet(key, initialState) {
    soundManager.playStageBgmSet(key, initialState);
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

export function instantStopBGM() {
    soundManager.instantStopBGM();
}

export function restartCurrentStageBgm(initialState) {
    soundManager.restartCurrentStageBgm(initialState);
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

