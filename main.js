// main.js
import { changeScene, showResultOverlay, hideResultOverlay, isResultReady } from './scene.js';
import { initCanvasCache } from './renderer.js';
import { initPhysics } from './physics.js';
import { formatScore } from './score.js';
import { GameState } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // キャンバスキャッシュの生成（プレレンダリング）
    initCanvasCache();

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
});
