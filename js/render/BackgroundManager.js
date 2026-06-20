// BackgroundManager.js

import { PHASE_WHITE_ENTER, PHASE_WHITE, PHASE_WHITE_EXIT } from '../core/PhaseManager.js';

class BackgroundManagerImpl {
    constructor() {
        this.clear();
    }

    clear() {
        // 初期化処理
    }

    updateAndDraw(ctx, GameState, PhaseManager) {
        const phase = PhaseManager.getCurrentPhaseName();
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        ctx.save();

        // フェイズ状態に応じた背景色のベース制御
        if (phase === PHASE_WHITE_ENTER || phase === PHASE_WHITE || phase === PHASE_WHITE_EXIT) {
            // ホワイトフェイズ中は背景を白で塗りつぶす（反転表現や白飛びの土台）
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }

        // 将来の演出用スタブ呼び出し
        this.drawStarrySky(ctx, GameState, PhaseManager);
        this.drawOmenRipple(ctx, GameState, PhaseManager);
        this.drawReverseRipple(ctx, GameState, PhaseManager);

        ctx.restore();
    }

    // フェイズ3: 星空描画スタブ
    drawStarrySky(ctx, GameState, PhaseManager) {
        // TODO: アステライアの静かな星空を描画
    }

    // フェイズ4: 予兆波紋描画スタブ
    drawOmenRipple(ctx, GameState, PhaseManager) {
        // TODO: たゆたう同心円と純白への脱色（予兆）を描画
    }

    // フェイズ5: 逆波紋アニメーションスタブ
    drawReverseRipple(ctx, GameState, PhaseManager) {
        // TODO: 外側から内側に巻き戻る逆波紋のループアニメーションを描画
    }
}

export const BackgroundManager = new BackgroundManagerImpl();
