// main.js
import { changeScene, showResultOverlay, hideResultOverlay, isResultReady } from '../render/scene.js';
import { SpriteCacheManager } from '../render/SpriteCacheManager.js';
import * as effects from '../render/effects.js';
import { initPhysics } from './physics.js';

import { GameState, LAYOUT_CONFIG, GRAPHICS_CONFIG, AppConfig } from './config.js';
import { changelog } from '../../changelog.js';
import { soundManager } from '../render/SoundManager.js';
import { InputManager } from './InputManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    // CSS変数の注入
    const root = document.documentElement;
    root.style.setProperty('--app-width', `${LAYOUT_CONFIG.APP_WIDTH}px`);
    root.style.setProperty('--app-height', `${LAYOUT_CONFIG.APP_HEIGHT}px`);
    root.style.setProperty('--header-height', `${LAYOUT_CONFIG.HEADER_HEIGHT}px`);
    root.style.setProperty('--footer-height', `${LAYOUT_CONFIG.FOOTER_HEIGHT}px`);
    const puzzleHeight = LAYOUT_CONFIG.APP_HEIGHT - LAYOUT_CONFIG.HEADER_HEIGHT - LAYOUT_CONFIG.FOOTER_HEIGHT;
    root.style.setProperty('--puzzle-height', `${puzzleHeight}px`);

    // アセットのロード待機
    await Promise.all([
        SpriteCacheManager.preloadAssets(),
        soundManager.loadAllAudio()
    ]);

    // キャンバスキャッシュの生成（プレレンダリング）
    SpriteCacheManager.generateAllCaches();

    // ロード完了後のUI更新とタップ待機
    const sceneBoot = document.getElementById('scene-boot');
    const initText = document.getElementById('init-text');
    if (sceneBoot && initText) {
        initText.innerHTML = "Complete\n\n<span class='blink'>tap to next.</span>";
        
        const onInitClick = () => {
            sceneBoot.removeEventListener('click', onInitClick);
            
            // オーディオコンテキストの再開とBGM再生
            soundManager.resumeContext();
            soundManager.playSceneBGM('TITLE');
            soundManager.playSE('DECIDE');
            
            // 先にタイトル画面を裏で表示状態にする
            changeScene('scene-title');
            
            // scene-boot を手前に残しつつフェードアウトさせるため、一時的に flex に強制し絶対配置にする
            sceneBoot.style.display = 'flex';
            sceneBoot.style.position = 'absolute';
            sceneBoot.style.left = '0';
            sceneBoot.style.right = '0';
            
            // 描画フレームを待ってから opacity を 0 にする（CSS transitionを発火させる）
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    sceneBoot.style.opacity = '0';
                });
            });
            
            setTimeout(() => {
                sceneBoot.style.display = 'none';
                sceneBoot.style.position = ''; // スタイルを元に戻しておく
                sceneBoot.style.left = '';
                sceneBoot.style.right = '';
            }, 800); // CSSのtransition 0.8s と合わせる
        };
        sceneBoot.addEventListener('click', onInitClick);
    }

    // バージョン番号の表示
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay && changelog.length > 0) {
        versionDisplay.textContent = changelog[0].version;
    }

    // ここでの changeScene('scene-title') の呼び出しは削除し、
    // 代わりに boot シーンを明示的にアクティブにする
    changeScene('scene-boot');

    // タイトル画面全体をタップして直接パズル開始（アルファ版暫定仕様）
    const sceneTitle = document.getElementById('scene-title');
    if (sceneTitle) {
        sceneTitle.addEventListener('click', (e) => {
            if (e.target.closest('#title-options')) return; // トグルボタンクリック時はパズルへ遷移しない

            soundManager.playSE('DECIDE');
            hideResultOverlay();
            changeScene('scene-puzzle');
            initPhysics(); // パズル開始時に状態をリセットし、物理エンジンを初期化
        });
    }

    // 宝石描画スタイルのトグル
    const btnStyleFlat = document.getElementById('btn-style-flat');
    const btnStyleRich = document.getElementById('btn-style-rich');
    if (btnStyleFlat && btnStyleRich) {
        const updateStyleToggle = () => {
            if (GRAPHICS_CONFIG.GEM_STYLE === 'flat') {
                btnStyleFlat.classList.add('active');
                btnStyleRich.classList.remove('active');
            } else {
                btnStyleFlat.classList.remove('active');
                btnStyleRich.classList.add('active');
            }
            SpriteCacheManager.generateAllCaches(); // スタイル変更に合わせてキャッシュを再生成
        };
        updateStyleToggle();

        btnStyleFlat.addEventListener('click', () => {
            if (GRAPHICS_CONFIG.GEM_STYLE !== 'flat') {
                GRAPHICS_CONFIG.GEM_STYLE = 'flat';
                updateStyleToggle();
            }
        });
        btnStyleRich.addEventListener('click', () => {
            if (GRAPHICS_CONFIG.GEM_STYLE !== 'rich') {
                GRAPHICS_CONFIG.GEM_STYLE = 'rich';
                updateStyleToggle();
            }
        });
    }

    // 既存のボタンが残っている場合用のフォールバック（不要なら後で削除可）
    const btnToPuzzle = document.getElementById('btn-to-puzzle');
    if (btnToPuzzle) {
        btnToPuzzle.addEventListener('click', () => {
            hideResultOverlay();
            changeScene('scene-puzzle');
            initPhysics();
        });
    }

    document.getElementById('btn-to-gacha').addEventListener('click', () => {
        changeScene('scene-gacha');
    });

    document.getElementById('btn-gacha-back').addEventListener('click', () => {
        changeScene('scene-home');
    });



    // リザルト画面全体をタップしてタイトルへ直接戻る
    const resultOverlay = document.getElementById('result-overlay');
    let isResultTransitioning = false;
    if (resultOverlay) {
        resultOverlay.addEventListener('click', () => {
            // アニメーション完了前（isResultReady == false）はタップを無視
            if (resultOverlay.classList.contains('active') && isResultReady && !isResultTransitioning) {
                // 連続タップ防止
                isResultTransitioning = true;
                soundManager.playSE('CANCEL');

                // ブラックアウト用暗幕の作成
                const blackout = document.createElement('div');
                blackout.style.position = 'fixed';
                blackout.style.top = '0';
                blackout.style.left = '0';
                blackout.style.width = '100%';
                blackout.style.height = '100%';
                blackout.style.backgroundColor = '#000';
                blackout.style.opacity = '0';
                blackout.style.transition = 'opacity 1s ease-in-out';
                blackout.style.zIndex = '10000';
                document.body.appendChild(blackout);

                // BGMフェードアウト開始
                if (soundManager.fadeOutAllBGM) {
                    soundManager.fadeOutAllBGM(1.0);
                }

                // 暗幕フェードイン開始
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        blackout.style.opacity = '1';
                    });
                });

                // 1秒後にシーン切り替え、暗幕フェードアウト開始
                setTimeout(() => {
                    hideResultOverlay();
                    changeScene('scene-title');
                    soundManager.playSceneBGM('TITLE');
                    
                    blackout.style.opacity = '0';
                    
                    // さらに1秒後に暗幕を削除し、トランジションフラグ解除
                    setTimeout(() => {
                        document.body.removeChild(blackout);
                        isResultTransitioning = false;
                    }, 1000);
                }, 1000);
            }
        });
    }

    // コンフィグモーダル関連の処理
    const btnConfig = document.getElementById('btn-config');
    const configModal = document.getElementById('config-modal');
    const configOverlay = document.getElementById('config-overlay');
    const btnConfigClose = document.getElementById('btn-config-close');
    const toggleDebugMode = document.getElementById('toggle-debug-mode');
    const changelogContainer = document.getElementById('changelog-container');
    const gameWrapper = document.getElementById('game-wrapper');

    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            soundManager.playSE('TAP');
            configModal.style.display = 'flex';
            configOverlay.style.display = 'block';
            
            // ChangeLogの描画
            if (changelogContainer.innerHTML.trim() === '') {
                changelogContainer.innerHTML = changelog.map(log => 
                    `<b>${log.version} (${log.date})</b>\n${log.changes.map(c => `- ${c}`).join('\n')}`
                ).join('\n\n');
            }
            
            // ステイシス（静止）適用
            if (GameState.engine && !GameState.isGameOver) {
                GameState.isStasis = true;
                soundManager.setStasisFilter(true);
            }
            gameWrapper.classList.add('stasis-mode');
        });
    }

    const closeConfigModal = () => {
        soundManager.playSE('CANCEL');
        configModal.style.display = 'none';
        configOverlay.style.display = 'none';
        
        // フィルターを即座に解除
        gameWrapper.classList.remove('stasis-mode');
        GameState.disableStasisFilter = true;
        soundManager.setStasisFilter(false);
        
        // 0.5秒後にtimeScaleを戻す
        setTimeout(() => {
            if (GameState.engine && !GameState.isGameOver) {
                GameState.isStasis = false;
            }
            GameState.disableStasisFilter = false;
        }, 500);
    };

    if (btnConfigClose) btnConfigClose.addEventListener('click', closeConfigModal);
    if (configOverlay) configOverlay.addEventListener('click', closeConfigModal);

    if (toggleDebugMode) {
        toggleDebugMode.checked = AppConfig.DEBUG_MODE;
        toggleDebugMode.addEventListener('change', (e) => {
            AppConfig.DEBUG_MODE = e.target.checked;
            const debugOverlay = document.getElementById('debug-overlay');
            if (debugOverlay) {
                debugOverlay.style.display = AppConfig.DEBUG_MODE ? 'block' : 'none';
            }
        });
    }

    // エフェクトレベルのトグル (コンフィグ用とタイトル画面用)
    const btnEffectFull = document.getElementById('btn-effect-full');
    const btnEffectLite = document.getElementById('btn-effect-lite');
    const btnEffectNone = document.getElementById('btn-effect-none');

    const btnTitleEffectFull = document.getElementById('btn-title-effect-full');
    const btnTitleEffectLite = document.getElementById('btn-title-effect-lite');
    const btnTitleEffectNone = document.getElementById('btn-title-effect-none');

    const updateEffectToggle = () => {
        if (btnEffectFull) btnEffectFull.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'FULL');
        if (btnEffectLite) btnEffectLite.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'LITE');
        if (btnEffectNone) btnEffectNone.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'NONE');

        if (btnTitleEffectFull) btnTitleEffectFull.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'FULL');
        if (btnTitleEffectLite) btnTitleEffectLite.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'LITE');
        if (btnTitleEffectNone) btnTitleEffectNone.classList.toggle('active', AppConfig.EFFECT_LEVEL === 'NONE');
        
        localStorage.setItem('phaseout_effect_level', AppConfig.EFFECT_LEVEL);
    };
    updateEffectToggle();

    const setEffectLevel = (level) => {
        AppConfig.EFFECT_LEVEL = level;
        updateEffectToggle();
    };

    if (btnEffectFull) btnEffectFull.addEventListener('click', () => setEffectLevel('FULL'));
    if (btnEffectLite) btnEffectLite.addEventListener('click', () => setEffectLevel('LITE'));
    if (btnEffectNone) btnEffectNone.addEventListener('click', () => setEffectLevel('NONE'));

    if (btnTitleEffectFull) btnTitleEffectFull.addEventListener('click', () => setEffectLevel('FULL'));
    if (btnTitleEffectLite) btnTitleEffectLite.addEventListener('click', () => setEffectLevel('LITE'));
    if (btnTitleEffectNone) btnTitleEffectNone.addEventListener('click', () => setEffectLevel('NONE'));

    // 波紋（ショックウェーブ）エフェクトのグローバルイベントリスナー
    const createRipple = (e) => {
        if (AppConfig.EFFECT_LEVEL === 'NONE') return;
        soundManager.resumeContext(); // 自動再生ポリシー対策

        let x, y;
        if (e.type === 'gemTapEffect') {
            x = e.detail.x;
            y = e.detail.y;
        } else {
            let clientX, clientY;
            if (e.type === 'touchstart' && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.type === 'mousedown') {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                return;
            }

            const pos = InputManager.getLogicalPosition(clientX, clientY);
            x = pos.x;
            y = pos.y;
        }

        effects.createRipple(x, y);
    };

    window.addEventListener('gemTapEffect', createRipple);
    document.addEventListener('mousedown', createRipple);
    document.addEventListener('touchstart', createRipple, { passive: true });
});
