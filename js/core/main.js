// main.js
import { changeScene, showResultOverlay, hideResultOverlay, isResultReady } from '../render/scene.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
import { UIManager } from './UIManager.js';
import { ResultRenderer } from '../render/ResultRenderer.js';
import * as effects from '../render/effects.js';
import { initPhysics } from './physics.js';
import { MasterRenderer } from '../render/MasterRenderer.js';
import { GameState, GRAPHICS_CONFIG, AppConfig, COLOR_CONFIG } from './config.js';
import { LAYOUT_CONFIG } from './LayoutConfig.js';
import { changelog } from '../../changelog.js';
import { soundManager } from '../render/SoundManager.js';
import { InputManager } from './InputManager.js';
import { setupGemRenderer } from '../render/renderer.js';
import { SceneManager } from './SceneManager.js';
import { PlayScene } from '../scene/PlayScene.js';
import { BootScene } from '../scene/BootScene.js';
import { ConfigScene } from '../scene/ConfigScene.js';
import { ENABLE_DEBUG_OVERLAY, DEBUG_START_INITIAL_VALUES } from './DebugConfig.js';

document.addEventListener('DOMContentLoaded', async () => {
    // CSS変数の注入
    const root = document.documentElement;
    root.style.setProperty('--app-width', `${LAYOUT_CONFIG.BASE.WIDTH}px`);
    root.style.setProperty('--app-height', `${LAYOUT_CONFIG.BASE.HEIGHT}px`);
    root.style.setProperty('--header-height', `${LAYOUT_CONFIG.BASE.HEADER_HEIGHT}px`);
    root.style.setProperty('--footer-height', `${LAYOUT_CONFIG.BASE.FOOTER_HEIGHT}px`);
    const puzzleHeight = LAYOUT_CONFIG.BASE.HEIGHT - LAYOUT_CONFIG.BASE.HEADER_HEIGHT - LAYOUT_CONFIG.BASE.FOOTER_HEIGHT;
    root.style.setProperty('--puzzle-height', `${puzzleHeight}px`);

    // アセットのロード待機
    await Promise.all([
        SpriteCacheManager.preloadAssets(),
        soundManager.loadAllAudio()
    ]);

    // キャンバスキャッシュの生成（プレレンダリング）
    SpriteCacheManager.generateAllCaches();

    // MasterRendererの初期化と開始
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
        MasterRenderer.init(canvas);
        InputManager.init(canvas);

        // 共通レンダラーの登録
        effects.setupEffectsRenderer();
        setupGemRenderer(GameState);

        // モーダル・リザルトUIの登録
        MasterRenderer.registerLayer(9, (ctx) => { // MODAL_UI
            ResultRenderer.draw(ctx);
        });

        MasterRenderer.registerGlobalUpdate((delta, time) => {
            SceneManager.update(delta);
        });

        MasterRenderer.start();

        // コンフィグボタンのコールバック登録
        UIManager.setButtonCallback('configBtn', () => {
            if (GameState.currentScene !== 'PUZZLE' && GameState.currentScene !== 'HOME') return;
            soundManager.playSE('TAP');
            SceneManager.pushScene(new ConfigScene());
        });

        // デバッグスタートボタンのコールバック登録
        if (ENABLE_DEBUG_OVERLAY) {
            UIManager.setButtonCallback('DEBUG_START_BTN', () => {
                soundManager.playSE('TAP');
                GameState.currentScene = 'PUZZLE';
                GameState.reset();

                // デバッグモード初期値の自動適用
                if (DEBUG_START_INITIAL_VALUES) {
                    AppConfig.DEBUG_MODE = DEBUG_START_INITIAL_VALUES.debugMode ?? AppConfig.DEBUG_MODE;
                    AppConfig.SHIFT_DECAY_MULT = DEBUG_START_INITIAL_VALUES.shiftDecayMult ?? AppConfig.SHIFT_DECAY_MULT;
                    
                    GameState.debug.bfsMultiplier = DEBUG_START_INITIAL_VALUES.bfsMultiplier ?? GameState.debug.bfsMultiplier;
                    GameState.debug.scoreMultiplier = DEBUG_START_INITIAL_VALUES.scoreMultiplier ?? GameState.debug.scoreMultiplier;
                    GameState.debug.lifeDecayMultiplier = DEBUG_START_INITIAL_VALUES.lifeDecayMultiplier ?? GameState.debug.lifeDecayMultiplier;
                    GameState.debug.expMultiplier = DEBUG_START_INITIAL_VALUES.expMultiplier ?? GameState.debug.expMultiplier;
                    GameState.debug.timeScale = DEBUG_START_INITIAL_VALUES.timeScale ?? GameState.debug.timeScale;
                    GameState.debug.showWireframe = DEBUG_START_INITIAL_VALUES.showWireframe ?? GameState.debug.showWireframe;
                }

                SceneManager.changeScene(new PlayScene());
            });
        }
    }

    // ロード完了後、BOOTシーンを開始
    SceneManager.changeScene(new BootScene());

    // UIManagerのイベントを登録

    // UIManager を InputManager に登録 (優先度100でパズルより先に判定)
    InputManager.onPointerDown((pos, e) => {
        return UIManager.handlePointerDown(pos, e);
    }, 100);

    // SceneManager を InputManager に登録 (優先度150)
    InputManager.onPointerDown((pos, e) => {
        return SceneManager.handleInput(pos, e);
    }, 150);

    // 波紋（ショックウェーブ）エフェクトのグローバルイベントリスナー
    const handleRipple = (x, y) => {
        if (AppConfig.EFFECT_LEVEL === 'NONE') return;
        soundManager.resumeContext(); // 自動再生ポリシー対策
        effects.createRipple(x, y);
    };

    // InputManagerからの論理座標で直接波紋を生成
    InputManager.onPointerDown((pos) => {
        handleRipple(pos.x, pos.y);
        return false; // イベントをブロックしない
    }, 200);

    // 宝石タップ時のカスタムイベント
    window.addEventListener('gemTapEffect', (e) => {
        handleRipple(e.detail.x, e.detail.y);
    });
});
