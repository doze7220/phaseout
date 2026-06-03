// scene.js
import { GameState, COLOR_CONFIG } from './config.js';
import { initTitleAnimation, stopTitleAnimation } from './title-animation.js';

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
    const finalScore = document.getElementById('final-score');
    const resultDisruptTitle = document.getElementById('result-disrupt-title');
    const resultStats = document.getElementById('result-stats');
    const tapToTitle = document.getElementById('tap-to-title');
    
    if (overlay && finalScore) {
        isResultReady = false;
        
        // 初期状態を非表示にする
        finalScoreTitle.style.opacity = '0';
        finalScore.style.opacity = '0';
        if (resultDisruptTitle) resultDisruptTitle.style.opacity = '0';
        if (tapToTitle) tapToTitle.style.display = 'none';
        
        finalScore.innerText = scoreString;
        
        if (resultStats) {
            resultStats.innerHTML = '';
            
            // 全体をグリッドレイアウトに変更し、中央のコロンを基準に左右の幅を均等(1fr)にする
            resultStats.style.display = 'grid';
            resultStats.style.gridTemplateColumns = '1fr auto 1fr';
            resultStats.style.rowGap = '8px';
            resultStats.style.width = '100%';
            resultStats.style.alignItems = 'center';
            
            // 全ての有効な色について、破壊数を表示する
            COLOR_CONFIG.forEach(cConfig => {
                if (!cConfig.enabled && (!GameState.stats[cConfig.color] || GameState.stats[cConfig.color] === 0)) {
                    return; // 有効でない色で、かつ破壊数が0なら表示しない
                }
                const count = GameState.stats[cConfig.color] || 0;
                
                // 1列目：アイコン（右寄せ）
                const iconWrapper = document.createElement('div');
                iconWrapper.style.display = 'flex';
                iconWrapper.style.justifyContent = 'flex-end';
                
                const circle = document.createElement('div');
                circle.style.width = '1.2em';
                circle.style.height = '1.2em';
                circle.style.borderRadius = '50%';
                circle.style.backgroundColor = cConfig.color;
                iconWrapper.appendChild(circle);
                
                // 2列目：コロン（中央）
                const colonDiv = document.createElement('div');
                colonDiv.innerText = ':';
                colonDiv.style.margin = '0 10px';
                colonDiv.style.fontSize = '1.2em';
                colonDiv.style.textAlign = 'center';
                
                // 3列目：数値（左寄せ）
                const numDiv = document.createElement('div');
                numDiv.innerText = count.toString();
                numDiv.style.fontSize = '1.2em';
                numDiv.style.textAlign = 'left';
                
                // 初期状態を非表示にする
                iconWrapper.style.opacity = '0';
                colonDiv.style.opacity = '0';
                numDiv.style.opacity = '0';
                
                resultStats.appendChild(iconWrapper);
                resultStats.appendChild(colonDiv);
                resultStats.appendChild(numDiv);
            });
        }
        
        overlay.classList.add('active');
        
        // 順番に表示するアニメーションシーケンス
        let delay = 500;
        
        // 1. Final Score
        setTimeout(() => {
            finalScoreTitle.style.transition = 'opacity 0.3s';
            finalScore.style.transition = 'opacity 0.3s';
            finalScoreTitle.style.opacity = '1';
            finalScore.style.opacity = '1';
        }, delay);
        delay += 500;
        
        // 2. Disrupt Title
        if (resultDisruptTitle) {
            setTimeout(() => {
                resultDisruptTitle.style.transition = 'opacity 0.3s';
                resultDisruptTitle.style.opacity = '1';
            }, delay);
            delay += 500;
        }
        
        // 3. 各色の破壊数
        if (resultStats) {
            const statItems = Array.from(resultStats.children);
            for (let i = 0; i < statItems.length; i += 3) {
                setTimeout(() => {
                    if (statItems[i]) {
                        statItems[i].style.transition = 'opacity 0.3s';
                        statItems[i].style.opacity = '1';
                    }
                    if (statItems[i+1]) {
                        statItems[i+1].style.transition = 'opacity 0.3s';
                        statItems[i+1].style.opacity = '1';
                    }
                    if (statItems[i+2]) {
                        statItems[i+2].style.transition = 'opacity 0.3s';
                        statItems[i+2].style.opacity = '1';
                    }
                }, delay);
                delay += 500;
            }
        }
        
        // 4. Tap to Title表示とタップ解禁
        setTimeout(() => {
            if (tapToTitle) tapToTitle.style.display = 'block';
            isResultReady = true;
        }, delay);
    }
}

export function hideResultOverlay() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}
