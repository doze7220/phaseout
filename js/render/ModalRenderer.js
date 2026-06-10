// ModalRenderer.js
import { GameState, AppConfig, LAYOUT_CONFIG } from '../core/config.js';
import { UIManager } from '../core/UIManager.js';
import { changelog } from '../../changelog.js';
import { soundManager } from './SoundManager.js'; // サウンド用にインポート

class ModalRendererClass {
    constructor() {
        this.scrollOffsetY = 0;
        this.maxScrollOffsetY = 0;
        
        // 描画キャッシュ用
        this.changelogLines = [];
        this.lineHeight = 24;
        
        this.prepareChangelog();
    }

    prepareChangelog() {
        // ChangeLogをテキスト行の配列に変換しておく（雑な折り返しは後で対応するが、今回はシンプルに行区切り）
        this.changelogLines = [];
        for (const log of changelog) {
            this.changelogLines.push(`[${log.version}] ${log.date}`);
            for (const change of log.changes) {
                // 長い行の折り返し（簡易実装: 30文字程度で分割）
                const maxLen = 35;
                let text = `- ${change}`;
                while (text.length > 0) {
                    this.changelogLines.push(text.substring(0, maxLen));
                    text = text.substring(maxLen);
                }
            }
            this.changelogLines.push(""); // 空行
        }
    }

    draw(ctx) {
        if (!GameState.isConfigOpen) {
            // 開いていない場合はボタン判定を非アクティブにする
            UIManager.deactivateButton('configModalClose');
            UIManager.deactivateButton('configDebugToggle');
            UIManager.deactivateButton('configEffectFull');
            UIManager.deactivateButton('configEffectLite');
            UIManager.deactivateButton('configEffectNone');
            UIManager.deactivateButton('configScrollUp');
            UIManager.deactivateButton('configScrollDown');
            return;
        }

        const width = LAYOUT_CONFIG.APP_WIDTH;
        const height = LAYOUT_CONFIG.APP_HEIGHT;

        // 背景オーバーレイ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // モーダルウィンドウ
        const modalWidth = 600;
        const modalHeight = 900;
        const modalX = (width - modalWidth) / 2;
        const modalY = (height - modalHeight) / 2;

        ctx.fillStyle = '#1e1e1e';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 20);
        ctx.fill();
        ctx.stroke();

        // 閉じるボタン
        const closeBtnSize = 60;
        const closeBtnX = modalX + modalWidth - closeBtnSize - 20;
        const closeBtnY = modalY + 20;
        
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.roundRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize, 10);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeBtnX + closeBtnSize / 2, closeBtnY + closeBtnSize / 2);
        
        UIManager.updateButtonRect('configModalClose', 8, closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
        UIManager.setButtonCallback('configModalClose', () => {
            soundManager.playSE('CANCEL');
            GameState.isConfigOpen = false;
            if (GameState.currentScene === 'PUZZLE') {
                GameState.isStasis = false;
                GameState.disableStasisFilter = true;
                soundManager.setStasisFilter(false);
                setTimeout(() => { GameState.disableStasisFilter = false; }, 500);
            }
        });

        // タイトル
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Config', modalX + modalWidth / 2, modalY + 60);

        // デバッグモード
        ctx.textAlign = 'left';
        ctx.font = '32px sans-serif';
        ctx.fillText('デバッグモード', modalX + 40, modalY + 160);
        
        const debugToggleX = modalX + modalWidth - 120;
        const debugToggleY = modalY + 130;
        ctx.fillStyle = AppConfig.DEBUG_MODE ? '#4CD964' : '#555';
        ctx.beginPath();
        ctx.roundRect(debugToggleX, debugToggleY, 80, 40, 20);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(AppConfig.DEBUG_MODE ? debugToggleX + 60 : debugToggleX + 20, debugToggleY + 20, 16, 0, Math.PI * 2);
        ctx.fill();
        
        UIManager.updateButtonRect('configDebugToggle', 8, debugToggleX, debugToggleY, 80, 40);
        UIManager.setButtonCallback('configDebugToggle', () => {
            soundManager.playSE('TAP');
            AppConfig.DEBUG_MODE = !AppConfig.DEBUG_MODE;
        });

        // エフェクト設定
        ctx.fillStyle = '#fff';
        ctx.fillText('エフェクト設定', modalX + 40, modalY + 250);
        
        const effectBtns = ['FULL', 'LITE', 'NONE'];
        const effectBtnWidth = 120;
        const effectBtnHeight = 50;
        const effectBtnStartX = modalX + 40;
        const effectBtnY = modalY + 280;

        effectBtns.forEach((level, index) => {
            const btnX = effectBtnStartX + index * (effectBtnWidth + 20);
            const isActive = AppConfig.EFFECT_LEVEL === level;
            
            ctx.fillStyle = isActive ? '#007AFF' : '#333';
            ctx.strokeStyle = isActive ? '#fff' : '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(btnX, effectBtnY, effectBtnWidth, effectBtnHeight, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isActive ? '#fff' : '#aaa';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(level, btnX + effectBtnWidth / 2, effectBtnY + effectBtnHeight / 2);

            const btnId = 'configEffect' + level;
            UIManager.updateButtonRect(btnId, 8, btnX, effectBtnY, effectBtnWidth, effectBtnHeight);
            UIManager.setButtonCallback(btnId, () => {
                soundManager.playSE('TAP');
                AppConfig.EFFECT_LEVEL = level;
                if (typeof window !== 'undefined') localStorage.setItem('phaseout_effect_level', level);
            });
        });

        // ChangeLog エリア
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText('更新履歴', modalX + 40, modalY + 390);

        const logAreaX = modalX + 40;
        const logAreaY = modalY + 410;
        const logAreaWidth = modalWidth - 80;
        const logAreaHeight = modalHeight - 450;
        
        // 領域背景
        ctx.fillStyle = '#222';
        ctx.fillRect(logAreaX, logAreaY, logAreaWidth, logAreaHeight);
        
        // クリッピング設定
        ctx.save();
        ctx.beginPath();
        ctx.rect(logAreaX, logAreaY, logAreaWidth, logAreaHeight);
        ctx.clip();

        // テキスト描画
        ctx.fillStyle = '#ddd';
        ctx.font = '20px monospace';
        ctx.textBaseline = 'top';
        
        const totalContentHeight = this.changelogLines.length * this.lineHeight;
        this.maxScrollOffsetY = Math.max(0, totalContentHeight - logAreaHeight);
        
        // オフセットのクランプ
        this.scrollOffsetY = Math.max(0, Math.min(this.scrollOffsetY, this.maxScrollOffsetY));

        for (let i = 0; i < this.changelogLines.length; i++) {
            const lineY = logAreaY + 10 + (i * this.lineHeight) - this.scrollOffsetY;
            // 画面外のカリング
            if (lineY > logAreaY + logAreaHeight || lineY + this.lineHeight < logAreaY) continue;
            
            ctx.fillText(this.changelogLines[i], logAreaX + 10, lineY);
        }
        ctx.restore();

        // 擬似スクロールUI (上下判定ボタン)
        const scrollBtnHeight = Math.min(80, logAreaHeight / 2);
        
        // 上半分 (▲)
        if (this.scrollOffsetY > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(logAreaX, logAreaY, logAreaWidth, 40);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '24px sans-serif';
            ctx.fillText('▲', logAreaX + logAreaWidth / 2, logAreaY + 20);
        }
        UIManager.updateButtonRect('configScrollUp', 8, logAreaX, logAreaY, logAreaWidth, scrollBtnHeight);
        UIManager.setButtonCallback('configScrollUp', () => {
            // 1ページ分（または半分）スクロール
            this.scrollOffsetY -= logAreaHeight * 0.8;
        });

        // 下半分 (▼)
        if (this.scrollOffsetY < this.maxScrollOffsetY) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(logAreaX, logAreaY + logAreaHeight - 40, logAreaWidth, 40);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '24px sans-serif';
            ctx.fillText('▼', logAreaX + logAreaWidth / 2, logAreaY + logAreaHeight - 20);
        }
        UIManager.updateButtonRect('configScrollDown', 8, logAreaX, logAreaY + logAreaHeight - scrollBtnHeight, logAreaWidth, scrollBtnHeight);
        UIManager.setButtonCallback('configScrollDown', () => {
            this.scrollOffsetY += logAreaHeight * 0.8;
        });
        
        // モーダル背景自体をダミーヒットエリアとして登録し、後ろへのイベント貫通を防ぐ
        UIManager.updateButtonRect('configModalBg', 7, 0, 0, width, height);
        UIManager.setButtonCallback('configModalBg', () => {
            // 何もしない（イベントブロックのみ）
        });
    }
}

export const ModalRenderer = new ModalRendererClass();
