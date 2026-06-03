// main.js
import { changeScene, showResultOverlay, hideResultOverlay } from './scene.js';
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

    // リザルトからタイトルへ直接戻るボタン（アルファ版暫定仕様）
    document.getElementById('btn-result-home').addEventListener('click', () => {
        hideResultOverlay();
        changeScene('scene-title');
    });
});
