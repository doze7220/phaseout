# 不具合調査レポート：ゲームオーバー判定の挙動変化

作成日: 2026-06-20  
対象バージョン: v0.26.17（不具合発生）→ v0.26.18（暫定修正）  
調査担当: Antigravity (AI)  

---

## 1. 不具合の概要

### 症状
チェイン演出中にLIFEが0以下になった場合、チェイン完了後にLIFEが回復されてもゲームオーバーが取り消されず、そのままリザルト画面へ遷移してしまう。

### 発生条件
- v0.26.8（2026-06-20実施）以降に潜在していた
- v0.26.16のゲームオーバー判定修正を適用後も症状が継続
- 特に高レベル（Lv5以上）でタップコストが増大した際に再現しやすい

### 以前の正常な挙動（昨日まで）
タップでLIFEが0以下になっても、チェイン演出が完了してLIFE回復によって0を超えた場合はゲームオーバーが取り消され、プレイが継続できていた。

---

## 2. 原因の特定

### 根本原因は2つあり、それが重複して発生していた

---

### 原因A：LIFEに下限クランプがなく、回復が追いつかない

**関係コード: `logic.js`**

タップコストや自然減少でLIFEが減算されていたが、0以下への下限クランプが存在しなかった。

```js
// NG（修正前）
GameState.life -= tapCost; // ← -200 等になりうる
checkGameOver();

// チェイン回復（n=5の場合）
GameState.life += 10 * 5; // +50 しても -150 のまま
// → ゲームオーバーキャンセル条件 (life > 0) を満たせない
```

高レベル時の例（Lv5）：
- `TAP_COST`: 50 × 1.15⁴ ≈ **87**
- `RESTORE_BASE`: 10 × n（n=5で +50）
- life = 60 でタップ → life = **-27**
- チェイン n=5 → 回復 +50 → life = **+23**（キャンセル可能）
- チェイン n=2 → 回復なし → life = **-27**のまま（ゲームオーバー確定、これは仕様通り）

この問題単独では「小さなチェインでは回復が追いつかない」というゲームデザイン上の問題にとどまるが、**原因Bと組み合わさることで深刻化した**。

---

### 原因B：v0.26.8のフラグ分離によるタイマー競合（本命）

**関係コード: `PhaseManager.js`**

v0.26.8（order10: `GameState.isStasis` → `isPuzzlePaused` + `isSystemPaused` 分離）の作業において、`PHASE_GAMEOVER` 状態での完全停止処理が次のように変わった。

```diff
// 旧コード（v0.26.7以前）
GameState.isStasis = true;

// 新コード（v0.26.8以降）
GameState.isPuzzlePaused = true;
```

`PhaseManager.update()` のガード条件：

```js
update(deltaTime) {
    if (GameState.isSystemPaused) return; // isSystemPaused のみチェック
    // ...
}
```

`setGameOver()` では `isSystemPaused` を **設定しない** ため、`PhaseManager.update()` はゲームオーバー後も動き続ける。

#### 競合のシナリオ

```
[タップ時]
1. life -= tapCost → life = -27
2. checkGameOver() → PhaseManager.setGameOver()
   - currentPhase = PHASE_GAMEOVER
   - isGameOver = true
   - isFinalGameOverTriggered = false
   - timeScale = 0.2
3. startChain() → isAnimating = true

[次フレーム: PhaseManager.update()]
4. PHASE_GAMEOVER 分岐に入る
5. !isAnimating = false（チェイン中）→ isFinalGameOverTriggeredはfalseのまま ✅
   ※ここは問題ない。問題は「setGameOver直後の一瞬」にある。

[チェイン終了: finalizeDestruction()]
6. LIFE回復 → life = 23（0以上）
7. ゲームオーバーキャンセル処理:
   if (life > 0 && isGameOver) → キャンセル
   PhaseManager.currentPhase = PHASE_NORMAL（直接書き換え）
8. isAnimating = false
9. 末尾の checkGameOver():
   life = 23 > 0 なので発火しない ✅
```

**理論上はキャンセルできるが、実際は再現しない**

→ Git差分の精査と追加調査で、「旧コードでは `isStasis = true` が `isSystemPaused` と同一視されており、PhaseManager.update() 全体が止まっていた可能性がある」ことが判明。

旧構造（v0.26.7以前）では `setGameOver()` が `isStasis = true` をセットし、`PhaseManager.update()` が事実上停止していた（`isSystemPaused` が `isStasis` と連動していた）。これが新構造では切り離されてしまっており、設計の意図が実装に反映されていなかった。

---

## 3. 構造的な問題点（仕様の抜け・設計上の課題）

### 問題①：ゲームオーバーキャンセル処理が `PhaseManager` の内部状態を直接書き換えている

**該当箇所: `logic.js` L307〜L319**

```js
if (PhaseManager.currentPhase === PHASE_GAMEOVER) {
    PhaseManager.currentPhase = PHASE_NORMAL; // ← 直接書き換え
}
```

Global Invariants「状態管理は必ず定義済みの管理層を経由すること」に違反している。`isFinalGameOverTriggered` のリセットも行われておらず、内部状態が中途半端な状態に残るリスクがある。

**あるべき姿:** `PhaseManager` 側に `cancelGameOver()` 等の専用メソッドを設け、すべての内部状態を一括でリセットする。

---

### 問題②：`isGameOver` と `PHASE_GAMEOVER` の二重管理

現状、ゲームオーバー状態を表すフラグが2箇所に存在する：

| フラグ | 場所 | 意味 |
|---|---|---|
| `GameState.isGameOver` | config.js（グローバル） | ゲームオーバー状態の汎用フラグ |
| `PhaseManager.currentPhase === PHASE_GAMEOVER` | PhaseManager.js | フェイズマネージャーの状態 |

これらが **常に同期している保証がない**。キャンセル処理で `PhaseManager.currentPhase` を直接書き換えた場合、`GameState.isGameOver = false` との整合性がコードの順序に依存する。

**あるべき姿:** ゲームオーバー状態は `PhaseManager` が一元管理し、`GameState.isGameOver` は `PhaseManager` のゲッターから読むか、`PhaseManager` のメソッド呼び出し時に自動で同期されるべき。

---

### 問題③：`isStasis` 廃止時の仕様転記漏れ

v0.26.8（order10）の設計書（`20260620_order10_refactor_TimeStopAndEffect.md`）には：

> 「リザルト画面やゲームオーバー演出などに意図しない停止が発生しないか慎重に検証すること」

と明記されていたが、`PHASE_GAMEOVER` における `isStasis → isPuzzlePaused` 変更の影響（`PhaseManager.update()` のガード条件との整合性）が見落とされた。

設計書の注意事項が実装レビュー・テストまで繋がっていなかった。

---

### 問題④：LIFEの下限クランプが仕様として定義されていない

`LIFE_CONFIG` には `MAX_LIFE`（上限）の定義はあるが、下限（0）の定義がない。回復処理には上限クランプ（`Math.max(0, ...)` 相当）が存在するが、減算処理には下限クランプがなかった。

これはゲームデザイン仕様として「LIFEは0未満になりうる」なのか「なるべきでない」なのかが未定義だったことを意味する。

---

## 4. 今回実施した暫定修正（v0.26.18）

### 修正①：LIFEの下限0クランプ（logic.js）

```js
// タップコスト後
GameState.life -= tapCost;
if (GameState.life < 0) GameState.life = 0; // 追加

// 自然減少後
GameState.life -= decay;
if (GameState.life < 0) GameState.life = 0; // 追加
```

**効果:** 回復で0以上に戻れない状況を排除。

**注意点:** LIFEが0でピッタリ止まるため、必ず `checkGameOver()` が発火する（life === 0）。その後のチェイン回復で確実にキャンセル可能になる。

---

### 修正②：タイマーにisAnimatingガード（PhaseManager.js）

```js
if (this.isFinalGameOverTriggered) {
    if (!GameState.isAnimating) { // 追加: チェイン中はタイマーを止める
        this.stateTimer += deltaTime;
    }
    if (this.stateTimer >= 1500) { ...
```

**効果:** チェイン演出中にリザルト遷移カウントが進まなくなる。

**注意点:** 連鎖が非常に長い場合（1〜2秒）は1500ms待機が延長される。実用上は問題ないが、設計的には「チェイン時間が1500msの待機に食い込む」という副作用が残る。

---

## 5. 残課題・根本対応の方針（後日検討）

### 優先度：高

#### 5.1. `PhaseManager.cancelGameOver()` の新設

ゲームオーバー状態の取り消し処理を PhaseManager 側に集約する。

```js
cancelGameOver() {
    if (this.currentPhase === PHASE_GAMEOVER) {
        this.currentPhase = PHASE_NORMAL;
        this.stateTimer = 0;
        this.isFinalGameOverTriggered = false; // ← 現在漏れている
        GameState.isGameOver = false;
        if (GameState.engine) {
            GameState.engine.timing.timeScale = 1.0;
            GameState.engine.gravity.y = 1;
        }
        toggleStasisEffect(false);
    }
}
```

これにより `logic.js` からの直接内部アクセスをなくす。

---

#### 5.2. `setGameOver()` 時に `isSystemPaused` の扱いを明確化

**選択肢A：`setGameOver()` で `isSystemPaused = true` を設定し、`PhaseManager.update()` の PHASE_GAMEOVER は例外として動かす**

```js
// PhaseManager.update()
if (GameState.isSystemPaused && this.currentPhase !== PHASE_GAMEOVER) return;
```

→ ゲームオーバー中が `isSystemPaused` で表現されるが、`isSystemPaused` の語義（コンフィグ展開中のみ）と矛盾する。

**選択肢B：`PHASE_GAMEOVER` 専用のシステム停止フラグを追加**

`GameState.isGameOverPaused` 等を別途設け、`PhaseManager.update()` で明示的にガードする。

→ フラグが増えるが、設計の意図が明確になる。

**選択肢C（推奨）：ゲームオーバー状態の停止はPhaseManagerの内部タイマーで完結させる**

`setGameOver()` 時に外部フラグを操作せず、`PHASE_GAMEOVER` の `update()` 内で isAnimating を見て自律的にタイマーを制御する（= 今回の暫定修正②の完成形）。

---

#### 5.3. PROJECT_ARCHITECTURE.md の「PHASE_GAMEOVER フロー」への追記

現在 `PHASE_GAMEOVER` の詳細フロー（ゲームオーバーキャンセルのルートを含む）が Architecture に記載されていない。将来の修正時に同じ見落としが発生しないよう、以下を明記する：

- `setGameOver()` の呼ばれうるタイミング（タップ時・自然減少時・チェイン後）
- ゲームオーバーキャンセルのトリガー条件（life > 0 かつ isGameOver）
- キャンセル時にリセットすべき内部状態の一覧（`isFinalGameOverTriggered` を含む）

---

## 6. 今回の調査フロー（参考）

1. Changelog.js からv0.26.16の変更内容を特定
2. `logic.js` / `PhaseManager.js` のコードを精読
3. `git log --oneline -- js/core/logic.js` で変更コミットを特定
4. `git show 248bf4d -- js/core/logic.js` で差分を確認 → 変更③（末尾checkGameOver追加）を発見
5. `git show 9b6331a -- js/core/PhaseManager.js` で `PHASE_GAMEOVER` 実装コミットを確認
6. `isStasis = true` → `isPuzzlePaused = true` への変更と、`PhaseManager.update()` のガード条件（`isSystemPaused`のみ）のミスマッチを特定
7. `LIFE_CONFIG` の下限クランプ未定義を確認
8. 2段構えの修正（クランプ + タイマーガード）を実施
