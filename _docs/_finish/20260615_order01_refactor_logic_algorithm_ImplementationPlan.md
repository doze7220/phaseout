# `logic.js` の責務分割 — パズル探索アルゴリズムの分離リファクタリング

## 概要

アーキテクチャ資料の「今後のリファクタリング・分離候補」に基づき、肥大化した [logic.js](file:///D:/ozlab/phaseout/js/core/logic.js)（411行）から、パズル盤面の接続判定・BFS探索アルゴリズムを [ChainAlgorithm.js](file:///D:/ozlab/phaseout/js/core/ChainAlgorithm.js)（新規）として分離します。

`logic.js` は「ゲーム進行管理コントローラー」として純化し、将来の「プリズムリンク」実装時に探索ロジックだけを差し替え可能な安全な構造を構築します。

---

## User Review Required

> [!IMPORTANT]
> **ゲームプレイ体験の不変保証**: 既存の連鎖処理（タップ → BFS探索 → レーザー発火 → 破壊 → スコア獲得 → エフェクト）の挙動が**1ドット・1フレームも変化しない**ことを絶対条件として進めます。

> [!IMPORTANT]
> **`ChainAlgorithm.js` のインターフェース設計について、以下のアプローチに問題がないかご確認ください。**

---

## `ChainAlgorithm.js` のインターフェース設計

### 設計方針
- `GameState` への**直接参照を持たない**純粋な計算モジュールとする
- 描画 (`effects.js`) やエフェクトへの依存を**一切持たない**
- 必要なパラメータ（接続閾値、デバッグ倍率）はすべて**引数として外部から注入**する

### 公開関数

```javascript
// ChainAlgorithm.js

/**
 * 2つの宝石が接触・近接しているかを判定する
 * @param {Body} g1 - 宝石1（Matter.js Body）
 * @param {Body} g2 - 宝石2（Matter.js Body）
 * @param {number} connectionThreshold - 接続判定閾値（config.js の CONNECTION_THRESHOLD）
 * @param {number} bfsMultiplier - デバッグ用BFS倍率（GameState.debug.bfsMultiplier）
 * @returns {boolean} 接触していればtrue
 */
export function areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier)

/**
 * 画面上の全宝石の隣接リスト（無向グラフ）を構築する
 * @param {Body[]} activeGems - 削除対象を除外した宝石配列
 * @param {number} connectionThreshold - 接続判定閾値
 * @param {number} bfsMultiplier - デバッグ用BFS倍率
 * @returns {Map<number, Body[]>} 宝石IDをキーとした隣接リストMap
 */
export function getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier)

/**
 * BFS探索により、起点宝石から同色で繋がっている宝石グループを抽出する
 * @param {Body} startGem - 起点の宝石（タップされた宝石）
 * @param {Body[]} activeGems - 削除対象を除外した宝石配列
 * @param {number} connectionThreshold - 接続判定閾値
 * @param {number} bfsMultiplier - デバッグ用BFS倍率
 * @returns {{ chainGems: Body[], levels: Array<{from: Body, to: Body}[]> }}
 *   - chainGems: 連鎖グループに含まれる全宝石の配列（起点を含む）
 *   - levels: BFS階層ごとの接続情報（レーザーアニメーションに必要）
 */
export function findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier)
```

### 戻り値設計の根拠

`findChainGroup` の戻り値には `chainGems`（連鎖グループ全体）と `levels`（BFS階層ごとの接続ペア配列）の両方を含めます。これは現在の `startChain` が `levels` を `animateLaserLevels` に渡してレーザー演出の深度進行を制御しているためです。この構造を維持することで、呼び出し元の `logic.js` は探索結果をそのまま演出APIに委譲でき、中間変換が不要になります。

---

## Proposed Changes

### 1. コア・ロジック層

---

#### [NEW] [ChainAlgorithm.js](file:///D:/ozlab/phaseout/js/core/ChainAlgorithm.js)

純粋なパズル盤面の探索・計算のみを担当するモジュール。

- `areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier)` — 宝石間の接触判定（`logic.js` L175-180 から移行）
- `getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier)` — 隣接リスト構築（`logic.js` L182-197 から移行）
- `findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier)` — BFS探索ロジック（`logic.js` `startChain` の L202-238 から探索部分のみを抽出）

> [!NOTE]
> `areGemsTouching` と `getAdjacencyList` は `findChainGroup` の内部から呼ばれますが、将来のプリズムリンク等で個別に差し替え・テストできるよう、3つとも `export` して公開します。

---

#### [MODIFY] [logic.js](file:///D:/ozlab/phaseout/js/core/logic.js)

**残す関数（ゲーム進行管理）:**
- `checkGameOver` (L16)
- `updateBgmState` (L27)
- `setupGameLogic` (L57) — 入力イベント・物理フック登録
- `getCurrentLifeDecayRate` (L158)
- `removeGameLogic` (L164)
- `startChain` (L199) — 関数自体は残し、探索部分を `findChainGroup` に委譲
- `finalizeDestruction` (L247) — スコア・経験値・レベルアップ・補充

**変更内容:**

1. **インポートの整理:**
   - `CONNECTION_THRESHOLD` のインポートはそのまま維持（`findChainGroup` への引数として渡すため）
   - `import { findChainGroup } from './ChainAlgorithm.js';` を追加

2. **`startChain` の改修（主要変更点）:**
   - 現在の内部BFS探索ロジック（L202-238、約36行）を削除し、`findChainGroup` への委譲に置き換える
   - `findChainGroup` の戻り値 `{ chainGems, levels }` を受け取り、以降の処理（`isMarkedForDeletion` フラグ設定、`animateLaserLevels` 呼び出し、`finalizeDestruction` コールバック）はそのまま維持

3. **`areGemsTouching` / `getAdjacencyList` の削除:**
   - `logic.js` から完全に削除（`ChainAlgorithm.js` に移行済み）

**改修後の `startChain` イメージ:**
```javascript
function startChain(startGem) {
    GameState.isAnimating = true;

    const activeGems = GameState.GEMS.filter(g => !g.isMarkedForDeletion);
    
    // 探索アルゴリズムの委譲
    const { chainGems, levels } = findChainGroup(
        startGem, activeGems, CONNECTION_THRESHOLD, GameState.debug.bfsMultiplier
    );

    // 以下は既存コードをそのまま維持
    chainGems.forEach(gem => gem.isMarkedForDeletion = true);

    const targetColorStr = startGem.colorStr;
    animateLaserLevels(levels, chainGems, targetColorStr, () => {
        finalizeDestruction(chainGems, { x: startGem.position.x, y: startGem.position.y }, levels.length);
    });
}
```

> [!NOTE]
> `logic.js` の変更後の概算行数: 約 375 行（411行 - 約36行の探索ロジック削除）

---

### 2. ドキュメント・バージョニング

---

#### [MODIFY] [changelog.js](file:///D:/ozlab/phaseout/changelog.js)

- バージョン `v0.21.0`（マイナーバージョンインクリメント）を先頭に追加
- 「リファクタリング: `logic.js` の責務を分割し、パズル探索アルゴリズム部分を `ChainAlgorithm.js` として分離・独立」の旨を記載

---

#### [MODIFY] [PROJECT_ARCHITECTURE.md](file:///D:/ozlab/phaseout/PROJECT_ARCHITECTURE.md)

1. **最終更新バージョン**: `v0.21.0` に同期
2. **§2 ファイル構成**: `js/core/` 配下に `ChainAlgorithm.js` を追加
3. **§2 【システム・ロジック層】テーブル**: 
   - `ChainAlgorithm.js` の行を追加:「盤面の接続判定とBFS探索アルゴリズムを担当する純粋な計算モジュール。UIや状態変更には干渉しない。」
   - `logic.js` の説明を更新: 探索アルゴリズム部分は `ChainAlgorithm.js` に委譲した旨を反映
4. **§8 リファクタリング候補**: `logic.js` の責務分割を完了済みとして注記

---

#### [MODIFY] [PROJECT_FUNCTION_INDEX.md](file:///D:/ozlab/phaseout/PROJECT_FUNCTION_INDEX.md)

1. **最終更新バージョン**: `v0.21.0` に同期
2. **`logic.js` セクション**: `areGemsTouching` と `getAdjacencyList` の行を削除
3. **新規セクション `ChainAlgorithm.js`** を追加し、以下の3関数を記載:
   - `areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier)` — 宝石間の接触判定
   - `getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier)` — 隣接リスト構築
   - `findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier)` — BFS探索、連鎖グループ抽出

---

## Verification Plan

### 手動検証
1. **ゲームプレイの不変確認**: パズル画面にてタップ → 同色連鎖 → レーザー演出 → 破壊 → パーティクル → スコア獲得 → EXP獲得 → LIFE回復 → 宝石補充、の一連のフローが従来と完全に同一であることを目視確認
2. **単発タップ（連鎖なし）**: 1個のみの宝石をタップした場合の挙動（エフェクト・スコアなし・パーティクルのみ）が変化していないことを確認
3. **大連鎖**: 複数の宝石が同色で接続されている場合の深度付きレーザーアニメーションが正常に動作することを確認
4. **デバッグ倍率**: ConfigSceneのDEBUGタブから `bfsMultiplier` を変更した際に、接続判定の閾値が正しく反映されることを確認
5. **ブラウザコンソール**: エラーや警告が出力されていないことを確認
