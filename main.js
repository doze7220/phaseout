// main.js
import { changeScene, showResultOverlay, hideResultOverlay, isResultReady } from './scene.js';
import { initCanvasCache } from './renderer.js';
import { initPhysics } from './physics.js';
import { formatScore } from './score.js';
import { GameState } from './config.js';
import { changelog } from './changelog.js';

document.addEventListener('DOMContentLoaded', () => {
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
        sceneTitle.addEventListener('click', () => {
            hideResultOverlay();
            changeScene('scene-puzzle');
            initPhysics(); // パズル開始時に状態をリセットし、物理エンジンを初期化
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

    // パズル終了（リザルト表示）ボタン
    const btnEndGame = document.getElementById('btn-end-game');
    if (btnEndGame) {
        btnEndGame.addEventListener('click', () => {
            const finalScoreStr = formatScore(GameState.score);
            showResultOverlay(finalScoreStr);
        });
    }

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
