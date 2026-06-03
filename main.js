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

    // イベントリスナーの登録
    document.getElementById('btn-to-home').addEventListener('click', () => {
        changeScene('scene-home');
    });

    document.getElementById('btn-to-puzzle').addEventListener('click', () => {
        hideResultOverlay();
        changeScene('scene-puzzle');
        initPhysics(); // パズル開始時に状態をリセットし、物理エンジンを初期化
    });

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

    // リザルトからホームへ戻るボタン
    document.getElementById('btn-result-home').addEventListener('click', () => {
        hideResultOverlay();
        changeScene('scene-home');
    });
});
