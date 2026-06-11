// ResultRenderer.js
import { GameState, COLOR_CONFIG } from '../core/config.js';
import { LAYOUT_CONFIG } from '../core/LayoutConfig.js';
import { UIManager } from '../core/UIManager.js';
import { generateScoreData } from '../core/score.js';
import { drawScoreData } from './ScoreRenderer.js';
import { soundManager } from './SoundManager.js';
import { UI } from './UIComponents.js';
import { SceneManager } from '../core/SceneManager.js';
import { TitleScene } from '../scene/TitleScene.js';

class ResultRendererClass {
    constructor() {
        this.page = 0; // 0: 基本画面, 1: 詳細ログ
        this.resultStartTime = 0;
        this.finalScoreData = null;
        this.maxScoreData = null;
        this.statsLines = [];
        this.lineHeight = 40;
        this.statsScrollUI = new UI.ScrollArea('resultScroll');
    }

    startResult() {
        this.resultStartTime = performance.now();
        this.page = 0;
        this.scrollOffsetY = 0;
        this.finalScoreData = generateScoreData(GameState.actualScore, 0);
        this.maxScoreData = generateScoreData(GameState.maxScorePerTap, 0);
        
        // 詳細ログの準備
        this.statsLines = [];
        let totalCount = 0;
        COLOR_CONFIG.forEach(cConfig => {
            const count = GameState.stats[cConfig.color] || 0;
            if (!cConfig.enabled && count === 0) return;
            totalCount += count;
            const mChain = GameState.maxChainPerColor[cConfig.color] || 0;
            this.statsLines.push({
                color: cConfig.color,
                count: count,
                chain: mChain
            });
        });
        this.totalCount = totalCount;
    }

    draw(ctx) {
        if (GameState.currentScene !== 'RESULT') {
            UIManager.deactivateButton('resultTapAnywhere');
            UIManager.deactivateButton('resultScrollUp');
            UIManager.deactivateButton('resultScrollDown');
            UIManager.deactivateButton('resultTapToTitle');
            return;
        }

        const width = LAYOUT_CONFIG.BASE.WIDTH;
        const height = LAYOUT_CONFIG.BASE.HEIGHT;
        const now = performance.now();
        const elapsed = now - this.resultStartTime;

        // 背景半透明
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;

        if (this.page === 0) {
            this.drawPage0(ctx, centerX, height, elapsed);
            UIManager.deactivateButton('resultScrollUp');
            UIManager.deactivateButton('resultScrollDown');
            
            // 全画面タップで次ページへ（表示完了後のみ）
            if (elapsed > 4000) {
                UIManager.updateButtonRect('resultTapAnywhere', 8, 0, 0, width, height);
                UIManager.setButtonCallback('resultTapAnywhere', () => {
                    this.page = 1;
                    this.scrollOffsetY = 0;
                });
            } else {
                UIManager.deactivateButton('resultTapAnywhere');
            }
            
        } else if (this.page === 1) {
            this.drawPage1(ctx, centerX, height, elapsed, width);
            UIManager.deactivateButton('resultTapAnywhere');
        }
    }

    drawPage0(ctx, centerX, height, elapsed) {
        // 徐々に要素を表示
        const alphaTitle = Math.min(1, Math.max(0, (elapsed - 2500) / 300));
        const alphaLevel = Math.min(1, Math.max(0, (elapsed - 3000) / 300));
        const alphaTime  = Math.min(1, Math.max(0, (elapsed - 3500) / 300));
        const alphaChain = Math.min(1, Math.max(0, (elapsed - 4000) / 300));
        
        if (alphaTitle > 0) {
            ctx.globalAlpha = alphaTitle;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillText('Final Score', centerX, 200);
            
            // スコア描画 (ScoreRendererと同じロジックを流用)
            ctx.save();
            ctx.translate(centerX - 150, 240); // 雑な中央合わせ調整
            drawScoreData(ctx, this.finalScoreData, 0, 0, 1);
            ctx.restore();
        }

        if (alphaLevel > 0) {
            ctx.globalAlpha = alphaLevel;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText(`Level: ${GameState.level}`, centerX, 400);
        }

        if (alphaTime > 0) {
            ctx.globalAlpha = alphaTime;
            ctx.fillStyle = '#ddd';
            ctx.font = '30px sans-serif';
            const totalSec = Math.floor(GameState.playTimeMs / 1000);
            const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const s = (totalSec % 60).toString().padStart(2, '0');
            ctx.fillText(`Time: ${m}:${s}`, centerX, 460);
        }

        if (alphaChain > 0) {
            ctx.globalAlpha = alphaChain;
            ctx.fillStyle = '#ddd';
            ctx.fillText(`Max Chain: ${GameState.maxChain}`, centerX, 520);
            
            ctx.fillText('Max Score / Tap:', centerX, 580);
            ctx.save();
            ctx.translate(centerX - 100, 600);
            drawScoreData(ctx, this.maxScoreData, 0, 0, 0.7);
            ctx.restore();
        }

        if (elapsed > 4000) {
            // Tap to Next
            const blink = Math.floor(elapsed / 750) % 2 === 0 ? 0.7 : 0;
            ctx.globalAlpha = blink;
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.fillText('Tap to Next', centerX, height - 100);
        }
        ctx.globalAlpha = 1;
    }

    drawPage1(ctx, centerX, height, elapsed, width) {
        ctx.fillStyle = '#FFCC00';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(`Total Disrupt: ${this.totalCount}`, centerX, 150);

        const logAreaX = centerX - 250;
        const logAreaY = 200;
        const logAreaWidth = 500;
        const logAreaHeight = height - 400;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(logAreaX, logAreaY, logAreaWidth, logAreaHeight, 20);
        ctx.fill();

        // スクロールUIへ描画と判定を委譲
        this.statsScrollUI.updateAndDraw(ctx, logAreaX, logAreaY, logAreaWidth, logAreaHeight, this.statsLines, {
            lineHeight: this.lineHeight,
            layer: 9,
            renderItemCallback: (ctx, stat, x, y, index) => {
                // 色アイコン
                ctx.fillStyle = stat.color;
                ctx.beginPath();
                ctx.arc(x + 40, y + (this.lineHeight / 2), 12, 0, Math.PI * 2);
                ctx.fill();

                // テキスト
                ctx.fillStyle = '#fff';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                ctx.font = '24px sans-serif';
                ctx.fillText(`:  Destroy: ${stat.count}  |  Max Chain: ${stat.chain}`, x + 70, y + (this.lineHeight / 2));
            }
        });

        // その他の領域をタップでタイトルへ戻る（ヒットテストの優先度でスクロールボタンの裏になるようにする）
        const blink = Math.floor(elapsed / 750) % 2 === 0 ? 0.7 : 0;
        ctx.globalAlpha = blink;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '24px sans-serif';
        ctx.fillText('Tap to Title', centerX, height - 100);
        ctx.globalAlpha = 1;

        // 背景をダミーボタンにしてタップ判定（優先度はスクロールボタンより低くする）
        // UIManagerは layer パラメータの降順で判定するので layer=8 とする
        UIManager.updateButtonRect('resultTapToTitle', 8, 0, 0, width, height);
        UIManager.setButtonCallback('resultTapToTitle', () => {
            // タイトル画面へ遷移する処理
            soundManager.playSE('TAP');
            soundManager.playSceneBGM('TITLE');
            GameState.reset(); // ゲーム状態をリセット
            SceneManager.changeScene(new TitleScene());
        });
    }
}

export const ResultRenderer = new ResultRendererClass();
