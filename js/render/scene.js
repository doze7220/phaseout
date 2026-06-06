// scene.js
import { GameState, COLOR_CONFIG, AppConfig } from '../core/config.js';
import { initTitleAnimation, stopTitleAnimation } from './title-animation.js';
import { formatScore } from '../core/score.js';
import { drawResultScoreToCanvas } from './renderer.js';

export let isResultReady = false;

export function changeScene(sceneId) {
    // 全てのシーンを非表示にする
    document.querySelectorAll('.scene').forEach(el => {
        el.classList.remove('active');
    });

    // 指定されたシーンを表示する
    const targetScene = document.getElementById(sceneId);
    if (targetScene) {
        targetScene.classList.add('active');
    }

    // タイトル画面の場合のみアニメーションを実行
    if (sceneId === 'scene-title') {
        initTitleAnimation();
    } else {
        stopTitleAnimation();
    }
}

export function showResultOverlay(scoreString) {
    const overlay = document.getElementById('result-overlay');
    const finalScoreTitle = document.getElementById('final-score-title');
    const finalScoreCanvas = document.getElementById('final-score-canvas');
    const finalLevel = document.getElementById('final-level');
    const playTime = document.getElementById('play-time');
    const maxChain = document.getElementById('max-chain');
    const maxScorePerTap = document.getElementById('max-score-per-tap');
    const detailedLog = document.getElementById('detailed-log');
    const totalDisrupt = document.getElementById('total-disrupt');
    const resultStats = document.getElementById('result-stats');
    const tapToTitle = document.getElementById('tap-to-title');

    if (overlay && finalScoreCanvas) {
        isResultReady = false;

        // オーバーレイを表示状態（flex）にしてクライアント幅を測定できるようにする
        // opacityは個別にコントロールするため、ここではオーバーレイ自体のopacityが1に向かう
        overlay.classList.add('active');

        // 初期状態を非表示にする
        finalScoreTitle.style.opacity = '0';
        finalScoreCanvas.style.opacity = '0';
        if (finalLevel) finalLevel.style.opacity = '0';
        if (playTime) playTime.style.opacity = '0';
        if (maxChain) maxChain.style.opacity = '0';
        if (maxScorePerTap) maxScorePerTap.style.opacity = '0';
        if (detailedLog) detailedLog.style.opacity = '0';
        if (tapToTitle) tapToTitle.style.display = 'none';

        // Canvas描画
        drawResultScoreToCanvas(GameState.actualScore);

        if (finalLevel) {
            finalLevel.innerText = `Level: ${GameState.level}`;
        }

        if (playTime) {
            const elapsedMs = GameState.playTimeMs;
            const totalSec = Math.floor(elapsedMs / 1000);
            const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const s = (totalSec % 60).toString().padStart(2, '0');
            playTime.innerText = `Time: ${m}:${s}`;
        }

        if (maxChain) {
            maxChain.innerHTML = `Max Chain: ${GameState.maxChain}`;
        }

        if (maxScorePerTap) {
            maxScorePerTap.innerHTML = `Max Score / Tap: ${formatScore(GameState.maxScorePerTap, AppConfig.TOTAL_SCORE_FORMAT_FULL)}`;
        }

        let totalCount = 0;

        if (resultStats) {
            resultStats.innerHTML = '';

            // 全体をグリッドレイアウトに変更
            resultStats.style.display = 'grid';
            resultStats.style.gridTemplateColumns = 'auto auto 1fr 1fr';
            resultStats.style.columnGap = '10px';
            resultStats.style.rowGap = '10px';
            resultStats.style.width = '100%';
            resultStats.style.alignItems = 'center';
            resultStats.style.justifyContent = 'center';

            COLOR_CONFIG.forEach(cConfig => {
                const count = GameState.stats[cConfig.color] || 0;
                if (!cConfig.enabled && count === 0) {
                    return;
                }
                totalCount += count;
                const mChain = GameState.maxChainPerColor[cConfig.color] || 0;

                // 1列目：アイコン
                const iconWrapper = document.createElement('div');
                iconWrapper.style.display = 'flex';
                iconWrapper.style.justifyContent = 'flex-end';

                const circle = document.createElement('div');
                circle.style.width = '1.2em';
                circle.style.height = '1.2em';
                circle.style.borderRadius = '50%';
                circle.style.backgroundColor = cConfig.color;
                iconWrapper.appendChild(circle);

                // 2列目：コロン
                const colonDiv = document.createElement('div');
                colonDiv.innerText = ':';
                colonDiv.style.textAlign = 'center';

                // 3列目：破壊数
                const numDiv = document.createElement('div');
                numDiv.innerHTML = `<span style="font-size:0.8em; color:#aaa;">Destroy:</span> ${count}`;
                numDiv.style.textAlign = 'left';

                // 4列目：最大チェイン数
                const chainDiv = document.createElement('div');
                chainDiv.innerHTML = `<span style="font-size:0.8em; color:#aaa;">Max Chain:</span> ${mChain}`;
                chainDiv.style.textAlign = 'left';

                resultStats.appendChild(iconWrapper);
                resultStats.appendChild(colonDiv);
                resultStats.appendChild(numDiv);
                resultStats.appendChild(chainDiv);
            });
        }

        if (totalDisrupt) {
            totalDisrupt.innerText = `Total Disrupt: ${totalCount}`;
        }

        // 順番に表示するアニメーションシーケンス
        const fadeOpts = 'opacity 0.3s ease-in';
        const baseDelay = 2000; // 背景の2秒フェードインを待つ

        setTimeout(() => {
            finalScoreTitle.style.transition = fadeOpts;
            finalScoreCanvas.style.transition = fadeOpts;
            finalScoreTitle.style.opacity = '1';
            finalScoreCanvas.style.opacity = '1';
        }, baseDelay + 500);

        setTimeout(() => {
            if (finalLevel) {
                finalLevel.style.transition = fadeOpts;
                finalLevel.style.opacity = '1';
            }
        }, baseDelay + 1000);

        setTimeout(() => {
            if (playTime) {
                playTime.style.transition = fadeOpts;
                playTime.style.opacity = '1';
            }
        }, baseDelay + 1500);

        setTimeout(() => {
            if (maxChain) {
                maxChain.style.transition = fadeOpts;
                maxChain.style.opacity = '1';
            }
        }, baseDelay + 2000);

        setTimeout(() => {
            if (maxScorePerTap) {
                maxScorePerTap.style.transition = fadeOpts;
                maxScorePerTap.style.opacity = '1';
            }
        }, baseDelay + 2500);

        setTimeout(() => {
            if (detailedLog) {
                detailedLog.style.transition = fadeOpts;
                detailedLog.style.opacity = '1';
            }
        }, baseDelay + 3000);

        setTimeout(() => {
            if (tapToTitle) {
                tapToTitle.style.display = 'block';
                isResultReady = true;
            }
        }, baseDelay + 3500);
    }
}

export function hideResultOverlay() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}
