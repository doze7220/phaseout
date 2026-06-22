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
import { ENABLE_DEBUG_OVERLAY } from './DebugConfig.js';
import { DebugManager } from '../render/DebugManager.js';

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

        // デバッグのデフォルト状態初期化
        DebugManager.init({ isDebugStart: false });

        // 共通レンダラーの登録
        effects.setupEffectsRenderer();
        setupGemRenderer(GameState);

        // モーダル・リザルトUIの登録
        MasterRenderer.registerLayer(9, (ctx) => { // MODAL_UI
            ResultRenderer.draw(ctx);
        });

        MasterRenderer.registerGlobalUpdate((realDelta, gameDelta) => {
            SceneManager.update(realDelta, gameDelta);
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

                // デバッグモード初期値の適用は initPhysics に委譲
                SceneManager.changeScene(new PlayScene({ isDebugStart: true }));
            });
        }
    }

    // ロード完了後、BOOTシーンを開始
    SceneManager.changeScene(new BootScene());

    // UIManagerのイベントを登録

    // UIManager を InputManager に登録 (優先度160でパズル・シーンより先に判定)
    InputManager.onPointerDown((pos, e) => {
        return UIManager.handlePointerDown(pos, e);
    }, 160);

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
