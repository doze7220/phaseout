// main.js
import { changeScene, showResultOverlay, hideResultOverlay, isResultReady } from '../render/scene.js';
import { initCanvasCache, AssetManager, drawScoreToCanvas } from '../render/renderer.js';
import { initPhysics } from './physics.js';
import { formatScore } from './score.js';
import { GameState, LAYOUT_CONFIG, GRAPHICS_CONFIG, AppConfig } from './config.js';
import { changelog } from '../../changelog.js';

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
    await AssetManager.loadAssets();

    // キャンバスキャッシュの生成（プレレンダリング）
    initCanvasCache();

    // バージョン番号の表示
    const versionDisplay = document.getElementById('version-display');
    if (versionDisplay && changelog.length > 0) {
        versionDisplay.textContent = changelog[0].version;
    }

    // タイトル画面を表示
    changeScene('scene-title');

    // タイトル画面全体をタップして直接パズル開始（アルファ版暫定仕様）
    const sceneTitle = document.getElementById('scene-title');
    if (sceneTitle) {
        sceneTitle.addEventListener('click', (e) => {
            if (e.target.closest('#title-gem-style-toggle')) return; // トグルボタンクリック時はパズルへ遷移しない

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
            initCanvasCache(); // スタイル変更に合わせてキャッシュを再生成
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

    // 削除された終了ボタン関連の処理をコメントアウト/削除
    /*
    const btnEndGame = document.getElementById('btn-end-game');
    if (btnEndGame) {
        btnEndGame.addEventListener('click', () => {
            const finalScoreStr = formatScore(GameState.score);
            showResultOverlay(finalScoreStr);
        });
    }
    */

    // リザルト画面全体をタップしてタイトルへ直接戻る
    const resultOverlay = document.getElementById('result-overlay');
    if (resultOverlay) {
        resultOverlay.addEventListener('click', () => {
            // アニメーション完了前（isResultReady == false）はタップを無視
            if (resultOverlay.classList.contains('active') && isResultReady) {
                hideResultOverlay();
                changeScene('scene-title');
            }
        });
    }

    // コンフィグモーダル関連の処理
    const btnConfig = document.getElementById('btn-config');
    const configModal = document.getElementById('config-modal');
    const configOverlay = document.getElementById('config-overlay');
    const btnConfigClose = document.getElementById('btn-config-close');
    const toggleTotalScoreFormat = document.getElementById('toggle-total-score-format');
    const toggleGainedScoreFormat = document.getElementById('toggle-gained-score-format');
    const changelogContainer = document.getElementById('changelog-container');
    const gameWrapper = document.getElementById('game-wrapper');

    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            configModal.style.display = 'flex';
            configOverlay.style.display = 'block';
            
            // ChangeLogの描画
            if (changelogContainer.innerHTML === '') {
                changelogContainer.innerHTML = changelog.map(log => 
                    `<b>${log.version} (${log.date})</b>\n${log.changes.map(c => `- ${c}`).join('\n')}`
                ).join('\n\n');
            }
            
            // ステイシス（静止）適用
            if (GameState.engine && !GameState.isGameOver) {
                GameState.isStasis = true;
            }
            gameWrapper.classList.add('stasis-mode');
        });
    }

    const closeConfigModal = () => {
        configModal.style.display = 'none';
        configOverlay.style.display = 'none';
        
        // フィルターを即座に解除
        gameWrapper.classList.remove('stasis-mode');
        GameState.disableStasisFilter = true;
        
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

    if (toggleTotalScoreFormat) {
        toggleTotalScoreFormat.checked = AppConfig.TOTAL_SCORE_FORMAT_FULL;
        toggleTotalScoreFormat.addEventListener('change', (e) => {
            AppConfig.TOTAL_SCORE_FORMAT_FULL = e.target.checked;
            drawScoreToCanvas(GameState.displayScore, AppConfig.TOTAL_SCORE_FORMAT_FULL);
        });
    }

    if (toggleGainedScoreFormat) {
        toggleGainedScoreFormat.checked = AppConfig.GAINED_SCORE_FORMAT_FULL;
        toggleGainedScoreFormat.addEventListener('change', (e) => {
            AppConfig.GAINED_SCORE_FORMAT_FULL = e.target.checked;
        });
    }

    // ビジュアライザのトグル
    const btnVisRich = document.getElementById('btn-vis-rich');
    const btnVisLite = document.getElementById('btn-vis-lite');
    const btnVisNone = document.getElementById('btn-vis-none');

    if (btnVisRich && btnVisLite && btnVisNone) {
        const updateVisToggle = () => {
            btnVisRich.classList.toggle('active', AppConfig.VISUALIZER_MODE === 'WAVE');
            btnVisLite.classList.toggle('active', AppConfig.VISUALIZER_MODE === 'BLOCK');
            btnVisNone.classList.toggle('active', AppConfig.VISUALIZER_MODE === 'OFF');
        };
        updateVisToggle();

        btnVisRich.addEventListener('click', () => {
            AppConfig.VISUALIZER_MODE = 'WAVE';
            updateVisToggle();
        });
        btnVisLite.addEventListener('click', () => {
            AppConfig.VISUALIZER_MODE = 'BLOCK';
            updateVisToggle();
        });
        btnVisNone.addEventListener('click', () => {
            AppConfig.VISUALIZER_MODE = 'OFF';
            updateVisToggle();
        });
    }

    // 波紋（ショックウェーブ）エフェクトのグローバルイベントリスナー
    const createRipple = (e) => {
        let x, y;
        if (e.type === 'touchstart') {
            if (e.touches.length > 0) {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else {
                return;
            }
        } else {
            x = e.clientX;
            y = e.clientY;
        }

        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    };

    document.addEventListener('mousedown', createRipple);
    document.addEventListener('touchstart', createRipple, { passive: true });
});
