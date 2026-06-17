# プリズムリンク完全実装（探索層＆経済層）

> 指示書: `20260615_order02_feat_prism_link_complete.md`
> 追加修正指示: EXP計算の加重平均化

## 概要

ロードマップ第4項目「プリズムリンク（スペクトル隣接色での接続）」を実装する。
`ChainAlgorithm.js` に「Depthベースの優先順位付きBFS」を導入し、`logic.js` に混色連鎖対応の「色別集計・スコア/EXP按分ロジック」を実装する。

---

## 1. 探索層：`ChainAlgorithm.js` の改修

### 1.1. [NEW] `isPrismLinked(colorId1, colorId2)` 関数の追加

```javascript
/**
 * 2つの宝石がプリズムリンク（スペクトル隣接色）の条件を満たすかを判定する。
 * @param {number} colorId1 - 宝石1のcolorId（0〜6）
 * @param {number} colorId2 - 宝石2のcolorId（0〜6）
 * @returns {boolean} 隣接色であればtrue
 */
export function isPrismLinked(colorId1, colorId2) {
    const diff = Math.abs(colorId1 - colorId2);
    return diff === 1 || diff === 6;
}
```

> [!NOTE]
> `COLOR_CONFIG` の並び順は `Red(0) → Orange(1) → Yellow(2) → Green(3) → Cyan(4) → Blue(5) → Purple(6)` であり、スペクトル順と完全一致しているため、インデックスの差で判定可能。
> `diff === 6` は Red(0) と Purple(6) の循環接続を表す。

### 1.2. [MODIFY] `findChainGroup` — Depthベース優先順位付きBFSへの改修

現在の同色BFSループを、各Depthで「**同色優先 → Pリンク後回し**」の2フェーズスキャンに改修する。

```javascript
export function findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier) {
    const adjList = getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier);
    const visited = new Set();
    visited.add(startGem.id);

    const levels = [];
    const chainGems = [startGem];
    let currentLevelNodes = [startGem];

    while (currentLevelNodes.length > 0) {
        const nextLevelNodes = [];
        const currentLevelConnections = [];

        for (const current of currentLevelNodes) {
            const neighbors = adjList.get(current.id) || [];

            // ── Step 1: 同色優先スキャン ──
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && neighbor.colorId === current.colorId) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({ from: current, to: neighbor });
                }
            }

            // ── Step 2: Pリンク（スペクトル隣接色）スキャン ──
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && isPrismLinked(current.colorId, neighbor.colorId)) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({ from: current, to: neighbor });
                }
            }
        }

        if (currentLevelConnections.length > 0) {
            levels.push(currentLevelConnections);
        }
        currentLevelNodes = nextLevelNodes;
    }

    return { chainGems, levels };
}
```

#### 動作の要点

| フェーズ | 対象 | 効果 |
|:---|:---|:---|
| Step 1（同色優先） | `current.colorId === neighbor.colorId` | 従来と同じ同色BFS。同色クラスタは最優先で一気に取り込む |
| Step 2（Pリンク後回し） | `isPrismLinked(current.colorId, neighbor.colorId)` | Step 1で `visited` に入らなかった未探索の隣接色宝石のみが対象。ここから別色クラスタへ橋を架ける |

> [!IMPORTANT]
> **`levels` の互換性について**: 戻り値の `{ chainGems, levels }` は既存フォーマットと完全互換。`levels[i]` は各Depthの `{from, to}` ペア配列であり、`LaserEffect.animateLaserLevels` は変更なしでそのまま動作する。レーザーの `glowColor` はこれまで単色（起点色）だが、プリズムリンクにより `to` 側が別色になるケースが発生する。ただしレーザー色は `startChain` で `startGem.colorStr` として渡されるため、レーザー自体は起点色で統一描画される（自然な挙動）。

---

## 2. 経済層：`logic.js` の改修（`finalizeDestruction`）

### 2.1. [MODIFY] 連鎖内訳の事前集計と按分ロジック

#### 現在のコード（問題点）

```javascript
// 起点色のみに全破壊数を加算
GameState.colorDestroyCounts[colorStr] += n;
// 起点色のみにスコアを加算
GameState.totalScorePerColor[colorStr] += points;
```

#### 改修後のコード骨子

```javascript
function finalizeDestruction(chain, tapPos, maxDepth = 1) {
    const n = chain.length;
    const fx = tapPos ? tapPos.x : chain[0].position.x;
    const fy = tapPos ? tapPos.y : chain[0].position.y;

    // ─── 事前集計: 色別の破壊数マップを構築 ───
    const colorCounts = {};   // { colorStr: 個数 }
    for (const gem of chain) {
        colorCounts[gem.colorStr] = (colorCounts[gem.colorStr] || 0) + 1;
    }

    // ─── 破壊数の加算（色別に正確に加算）【EXP計算より先に実行】 ───
    for (const [color, count] of Object.entries(colorCounts)) {
        GameState.colorDestroyCounts[color] = (GameState.colorDestroyCounts[color] || 0) + count;
    }

    // ─── EXP計算 ───
    // A. 大チェイン減衰（従来通り）
    const baseExp = Math.round(n * (CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY / (n + CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY)));

    // B. 全色中の最小破壊数（基準値）の取得
    let minDestroyCount = Infinity;
    const unlockedColors = Object.keys(GameState.colorDestroyCounts);
    if (unlockedColors.length > 0) {
        for (const color of unlockedColors) {
            if (GameState.colorDestroyCounts[color] < minDestroyCount) {
                minDestroyCount = GameState.colorDestroyCounts[color];
            }
        }
    } else {
        minDestroyCount = 0;
    }

    // C. 加重平均による最終効率の算出
    //    各色の効率 = minDestroyCount / GameState.colorDestroyCounts[color]
    //    加重平均効率 = Σ( 各色の効率 × その色の連鎖内個数 / chainLength )
    let weightedEfficiency = 0;
    if (minDestroyCount > 0) {
        for (const [color, count] of Object.entries(colorCounts)) {
            const colorEfficiency = minDestroyCount / GameState.colorDestroyCounts[color];
            weightedEfficiency += colorEfficiency * (count / n);
        }
    }

    // D. 最終獲得EXPの決定
    let finalExp = (minDestroyCount > 0) ? Math.ceil(baseExp * weightedEfficiency) : baseExp;
    finalExp *= GameState.debug.expMultiplier;

    // EXP加算
    if (finalExp > 0) {
        GameState.exp += finalExp;
        GameState.totalExp += finalExp;
        showFloatingNumber('+' + finalExp, 'exp', fx, fy, 500);
    }

    // ビジュアライザスパイク（含まれる各色に対してトリガー）
    for (const color of Object.keys(colorCounts)) {
        triggerVisualizerSpike(color);
    }

    // 破壊SEリクエスト（SoundManager側で自動スケジューリング）
    for (let i = 0; i < n; i++) {
        playSE('BREAK');
    }

    // ─── スコア計算 (n >= 3) ───
    if (n >= 3) {
        const chainCount = BigInt(n);
        const chainBonus = chainCount <= 2n ? 1n : (chainCount - 2n) ** 2n;
        const rateNumber = getScoreRate(GameState.level);
        const depthDivisor = CORE_MATH_CONFIG.DEPTH_BONUS_DIVISOR;
        const depthBonusMul = depthDivisor + BigInt(maxDepth);
        let points = ((BigInt(Math.floor(rateNumber)) * chainBonus * depthBonusMul) / depthDivisor) * GameState.debug.scoreMultiplier;

        GameState.actualScore += points;

        // スコアの色別按分（BigInt精度での計算）
        const totalN = BigInt(n);
        let distributedSum = 0n;
        const colorEntries = Object.entries(colorCounts);
        
        for (let i = 0; i < colorEntries.length; i++) {
            const [color, count] = colorEntries[i];
            let share;
            if (i === colorEntries.length - 1) {
                // 最後の色は端数調整（総和の整合性を保証）
                share = points - distributedSum;
            } else {
                share = (points * BigInt(count)) / totalN;
                distributedSum += share;
            }
            GameState.totalScorePerColor[color] = (GameState.totalScorePerColor[color] || 0n) + share;
        }

        // 支配色（連鎖内で最も多い色）の決定
        const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];

        if (points > GameState.maxScorePerTap) {
            GameState.maxScorePerTap = points;
            GameState.maxScoreColor = dominantColor;
        }
        if (n > GameState.maxChain) {
            GameState.maxChain = n;
            GameState.maxChainColor = dominantColor;
        }
        // 色ごとの最大連鎖数も更新（各色のcountで個別管理）
        for (const [color, count] of Object.entries(colorCounts)) {
            if (!GameState.maxChainPerColor[color]) {
                GameState.maxChainPerColor[color] = 0;
            }
            if (count > GameState.maxChainPerColor[color]) {
                GameState.maxChainPerColor[color] = count;
            }
        }

        // LIFE回復処理（以降は既存通り）
        // ...
    }
}
```

#### 加重平均EXPの設計根拠

> [!NOTE]
> **単色連鎖との後方互換性**:
> 単色連鎖（colorCountsに1色のみ）の場合、`weightedEfficiency = (minDC / DC[color]) × (n/n)` となり、既存の `finalExp = Math.ceil(baseExp * (minDC / DC[color]))` と**完全一致**する。

> [!NOTE]
> **ゲームデザイン上の意義**:
> プレイヤーが「効率の落ちた色（過剰に破壊した色）」を「効率の高い色（あまり破壊していない色）」とプリズムリンクで混ぜることで、経験値効率を中和（リカバリー）する戦略が成立する。これは「7色の陣営を均等に破壊する」という世界観のテーマとも合致する。

#### BigInt按分の端数調整戦略

> [!IMPORTANT]
> BigIntの除算は切り捨てのため、各色への `(points * BigInt(count)) / BigInt(n)` の総和が `points` に一致しない可能性がある。
> これを防ぐため、**最後の1色分を `points - 既に分配した合計` として計算**することで総和の整合性を保証する。
> この方式はオーソドックスな「最大剰余法」の簡易版であり、1n以下の誤差に収まる。

---

## 3. Documentation & Versioning

### 3.1. [MODIFY] `changelog.js`
- バージョンを `v0.22.0` に更新
- 変更内容:
  - 「機能追加: 『プリズムリンク』の完全実装。Depthベースの優先順位付き探索アルゴリズムにより、同色を優先しつつスペクトル隣接色へリンクする挙動を実現。また、混色連鎖に伴うスコア・EXPの色別按分ロジック（EXPは加重平均効率による公平な算出）を実装」

### 3.2. [MODIFY] `PROJECT_ARCHITECTURE.md`
- 先頭バージョンを `v0.22.0` に同期
- セクション10.3「カタルシス」の「プリズムリンク（未実装）」→「実装済」に更新
- セクション2のChainAlgorithm.jsの説明にプリズムリンク対応を追記
- セクション8のrenderer.jsの「700行を超過」を実態に合う記述へ修正

### 3.3. [MODIFY] `PROJECT_FUNCTION_INDEX.md`
- 先頭バージョンを `v0.22.0` に同期
- ChainAlgorithm.jsセクションに `isPrismLinked` 関数を追加
- `findChainGroup` の概要を更新（Depthベース優先順位付きBFS）
- `finalizeDestruction` の概要を更新（色別集計・按分・加重平均EXP対応）

---

## User Review Required

> [!IMPORTANT]
> ### A. 探索層の安全性
> - Step 1（同色）→ Step 2（Pリンク）の2フェーズスキャンでは、Step 1で `visited` に入った宝石はStep 2の対象外となる。これにより「同色で既に繋がっている宝石がPリンクとして二重登録される」ことは構造的に防止される。
> - `levels` の配列構造は変更なし。各Depthの `{from, to}` ペアの `to` 側が別色になるだけであり、`LaserEffect.animateLaserLevels` は `from.position` と `to.position` しか参照しないため、レーザー演出は破綻しない。
> - レーザーの色（`glowColor`）は `startChain` で `startGem.colorStr`（起点色）として渡されるため、全レーザーが起点色で描画される。これは「起点の色から光が広がっていく」演出として自然であると考える。

> [!IMPORTANT]
> ### B. 経済層の丸め・端数
> - **スコア按分**: BigInt除算の切り捨て誤差は、最後の色の分に `points - distributedSum` を割り当てることで**総和の完全一致を保証**する。
> - **EXP加重平均**: 浮動小数点演算だが、EXP値は小さい整数のため `Math.ceil` で十分な精度を維持できる。単色連鎖時は既存計算式と完全一致。
> - `colorDestroyCounts` の加算を**スコア・EXP計算の前**に行うため、「今回の連鎖で壊した分」が即座に減衰率に反映される（既存動作と同一）。また、これにより加重平均計算時にゼロ除算が発生しないことも保証される。

> [!WARNING]
> ### C. `stats` プロパティとの整合性
> 現行コードでは `GameState.stats[gem.colorStr]++` でリザルト画面用の破壊数を個別に集計している。`colorDestroyCounts` と `stats` は同じ値を保持しているように見えるが、`stats` の初期化タイミングが異なる（resetで `{}` にリセット）。今回の改修ではどちらも色別に正確にカウントするため整合性は維持されるが、将来的に `stats` を `colorDestroyCounts` に統合するリファクタリングを推奨する（この指示書のスコープ外として今回は対応しない）。

---

## Verification Plan

### 自動検証
- ブラウザでゲームを起動し、以下を目視確認:
  1. 同色クラスタのタップ時、従来通りの挙動（レーザー・スコア・EXP）を確認
  2. 異なるスペクトル隣接色の宝石が物理的に隣接している場合、Pリンクで連鎖が色を跨いで伝播することを確認
  3. レーザーが起点色で正常に表示されることを確認
  4. リザルト画面で色別スコア・破壊数が正しく表示されることを確認
  5. ビジュアライザのデバッグ表示で、混色連鎖時に各色の破壊数が正確にカウントアップされることを確認

### 手動検証
- デバッグモード（bfsMultiplier調整）で接続範囲を広げ、意図的にPリンクの発生を観察
- 7色全てが解放された状態で大規模なPリンク連鎖を発生させ、スコア按分の正確性をデバッグ表示で確認
- 混色連鎖時のEXPが加重平均により算出されていることを確認（破壊数の偏った色と均等な色でPリンクした場合のEXP比較）
