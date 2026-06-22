### 実装指示書： `ScreenEffectPopup.js` の大々的な解体とFacade化（Phase 2: ChainScoreRenderer）

## 1. 目的（スクリーンエフェクトの大々的な解体）
現在1000行を超える神オブジェクト `ScreenEffectPopup.js` を大々的に解体する。
段階的に専用レンダークラスを新設してロジックを移譲し、最終的に `ScreenEffectPopup.js` 自身はそれらを束ねて `update` と `draw` を呼び出すだけの単なるFacade（窓口）へとリファクタリングする。

## 2. 全体仕様（対象関数と解体後のクラス構造）
最終的に `ScreenEffectPopup.js` に混在している演出は、以下の独立したクラス群へと分離される。
- `FloatingNumberRenderer`：フローティング数値（Phase 1にて分離完了）
- `ChainScoreRenderer`：連鎖数、数式、ドラムロールスコア（`showChainPopup`, `hideChainPopup`, `showScorePopup` 等）
- `PrismLinkRenderer`：Pリンクスタンプ展開、およびアステライア昇華演出
- `LevelUpRenderer`：レベルアップ演出
- `OverdriveRenderer`：ホワイトフェイズ等の特殊発光・虹色ポップアップ演出

## 3. ⚠️ 絶対厳守ルール（今はフェイズ2だからこれだけやれ）
1000行のクラスを一度に解体するとゲームが完全に崩壊するため、**必ず1クラスずつ分離し、実機チェックを挟むこと**。
今回のプロンプトでは、**【Phase 2: ChainScoreRenderer の新設・分離】のみ** を実行せよ。PrismLink演出やLevelUp演出など、他のロジックには絶対に触れてはならない。

## 4. 【Phase 2】実装手順（今回はこれのみを実行）
1. **`js/render/ChainScoreRenderer.js` の新設**
   新規ファイルを作成し、`ScreenEffectPopup.js` から「連鎖ポップアップ（チェイン数、Depth、数式）」「ドラムロールスコア」「確定スコアポップアップ」の生成、`update`、`draw` に関するロジックのみを切り出してクラス化・エクスポートする。
2. **`ScreenEffectPopup.js` の Facade化（第二段階）**
   `ScreenEffectPopup.js` で `ChainScoreRenderer` をインスタンス化し、外部から呼ばれた `showChainPopup`, `hideChainPopup`, `showScorePopup` の処理をそのまま新クラスへ委譲（転送）するように書き換える。また、`update` と `drawPopups` 内で、新クラスの `update` と `draw` を呼び出す。
3. **作業のストップと報告**
   上記が完了したら作業を完全に中断し、`PROJECT_ARCHITECTURE.md` および `PROJECT_FUNCTION_INDEX.md` 等の関連資料を最新のクラス構造に更新せよ。
   その後に「Phase 2が完了しました。実機での動作確認をお願いします」とユーザーに報告せよ。
