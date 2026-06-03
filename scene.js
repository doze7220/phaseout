// scene.js

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
}

export function showResultOverlay(scoreString) {
    const overlay = document.getElementById('result-overlay');
    const finalScore = document.getElementById('final-score');
    if (overlay && finalScore) {
        finalScore.innerText = scoreString;
        overlay.classList.add('active');
    }
}

export function hideResultOverlay() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}
