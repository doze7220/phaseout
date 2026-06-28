// SkillManager.js
// スキル発動の制御塔として機能する

import { CharacterPuzzleManager } from './CharacterPuzzleManager.js';
import * as effects from '../render/effects.js';
import { GameState, COLOR_CONFIG, THEME_COLORS } from './config.js';
import { SkillData } from './SkillData.js';
import { MasterRenderer, LAYERS } from '../render/MasterRenderer.js';
import { PhaseManager } from './PhaseManager.js';

const activeSkillQueues = [];
const skillImageCache = {};

// マーカー描画用レイヤーの登録
MasterRenderer.registerLayer(LAYERS.FRONT_EFFECTS, (ctx) => {
    for (const queue of activeSkillQueues) {
        if (!queue.markerImage || !queue.markerImage.complete) continue;

        for (const target of queue.lockedTargets) {
            // 回転角の初期化
            if (target.markerRotation === undefined) {
                target.markerRotation = Math.random() * Math.PI * 2;
            }

            ctx.save();
            ctx.translate(target.position.x, target.position.y);
            ctx.rotate(target.markerRotation);

            // 512x512の画像を1/4サイズ（128x128）で中央合わせ描画
            ctx.drawImage(queue.markerImage, -64, -64, 128, 128);
            ctx.restore();
        }
    }
});

export const SkillManager = {
    /**
     * 指定されたスロットのキャラクターのスキルを発動する
     * @param {number} slotIndex - 発動するキャラクターのスロット番号 (0, 1, 2)
     */
    activateSkill(slotIndex) {
        const slotData = CharacterPuzzleManager.getSlotData(slotIndex);
        if (!slotData) return;

        console.log(`[SkillManager] オート発動: ${slotData.skillId}`);

        const skillData = SkillData[slotData.skillId];
        if (skillData && skillData.type === "DESTROY_EXCLUDE_COLOR") {
            const excludeColorIndex = COLOR_CONFIG.findIndex(c => c.name.toUpperCase() === skillData.excludeColorId);

            // 除外色以外の宝石を抽出（現在チェイン中など消去待機中のものは除外）
            let validGems = GameState.GEMS.filter(gem =>
                gem.colorId !== excludeColorIndex && !gem.isMarkedForDeletion
            );

            // シャッフル
            for (let i = validGems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validGems[i], validGems[j]] = [validGems[j], validGems[i]];
            }

            // 最大効果数だけ取得
            const targets = validGems.slice(0, skillData.effectValue);

            // 時止め（ステイシス）発動とパズル入力ロック
            effects.toggleStasisEffect(true, 500); // 500msでヴィネットをフェードイン
            GameState.isPuzzlePaused = false;      // スロー中はパズルを動かしておく
            GameState.disableStasisFilter = true;

            // 物理エンジンをゆっくり停止させる
            PhaseManager.setTimeScaleTarget(0.0, 500, () => {
                GameState.isPuzzlePaused = true;
            });

            // 画像アセットのキャッシュ取得・生成
            let markerImg = null;
            if (skillData.markerImagePath) {
                if (!skillImageCache[skillData.markerImagePath]) {
                    const img = new Image();
                    img.src = `./${skillData.markerImagePath}`;
                    skillImageCache[skillData.markerImagePath] = img;
                }
                markerImg = skillImageCache[skillData.markerImagePath];
            }

            activeSkillQueues.push({
                targets: targets,
                lockedTargets: [],
                intervalMs: 160, // 約10フレーム
                elapsedMs: 0,
                state: 'LOCKING',
                markerImage: markerImg
            });
        }

        // ゲージをリセットする
        slotData.currentCharge = 0;

        // スキル発動ポップアップUIの表示
        effects.showSkillPopup(slotData.skillName, slotData.colorId, slotIndex);
    },

    update(deltaMs) {
        const delta = deltaMs || (1000 / 60);

        for (let i = activeSkillQueues.length - 1; i >= 0; i--) {
            const queue = activeSkillQueues[i];

            if (queue.state === 'LOCKING') {
                queue.elapsedMs += delta;

                if (queue.elapsedMs >= queue.intervalMs) {
                    queue.elapsedMs = 0;

                    if (queue.targets.length > 0) {
                        const targetGem = queue.targets.shift();

                        // 宝石が存在し、まだ削除マークが付いていないか確認
                        const index = GameState.GEMS.indexOf(targetGem);
                        if (index !== -1 && !targetGem.isMarkedForDeletion) {
                            queue.lockedTargets.push(targetGem);

                            // ロックオンの早打ち演出（SEと弾痕）
                            effects.playSE('GUN');
                            const colorStr = targetGem.colorStr ? targetGem.colorStr.toUpperCase() : 'WHITE';
                            const effectColor = THEME_COLORS[colorStr] || '#ffffff';
                            effects.spawnSparks(targetGem.position.x, targetGem.position.y, effectColor, 0.5, 5);
                        }
                    } else {
                        // 全てのロックオン完了
                        queue.state = 'DESTROYING';
                    }
                }
            }

            if (queue.state === 'DESTROYING') {
                // 解除と一斉破壊
                effects.toggleStasisEffect(false, 300); // 300msでヴィネットをフェードアウト
                GameState.isPuzzlePaused = false;
                GameState.disableStasisFilter = false;
                PhaseManager.setTimeScaleTarget(1.0, 300); // 300msで物理速度を元に戻す

                for (const targetGem of queue.lockedTargets) {
                    const index = GameState.GEMS.indexOf(targetGem);
                    if (index !== -1 && !targetGem.isMarkedForDeletion) {
                        const colorStr = targetGem.colorStr ? targetGem.colorStr.toUpperCase() : 'WHITE';
                        const effectColor = THEME_COLORS[colorStr] || '#ffffff';

                        // 一斉破壊時の爆発火花
                        effects.spawnBurstSparks(targetGem.position.x, targetGem.position.y, effectColor, 1.0, 10, 1.0);
                        
                        // 通常の宝石破壊エフェクト（ポリゴン破片）
                        effects.spawnParticles(targetGem.position.x, targetGem.position.y, effectColor);
                        
                        // 破壊SE（SoundManager側で自動スケジューリングされて連鎖音になる）
                        effects.playSE('BREAK');

                        // 物理エンジンからの削除と配列からの削除
                        window.Matter.Composite.remove(GameState.engine.world, targetGem);
                        GameState.GEMS.splice(index, 1);
                    }
                }

                // キューから削除
                activeSkillQueues.splice(i, 1);
            }
        }
    }
};
