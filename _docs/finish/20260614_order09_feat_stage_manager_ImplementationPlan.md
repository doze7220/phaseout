# StageManager導入と落下色数のレベル連動実装

ゲーム開始時に7色すべてをランダム落下させている現行仕様を廃止し、Lv1〜4は4色の助走期間、Lv5以降にレベルアップに応じて新色がアンロックされる仕様を実装します。
その基盤として `StageConfig.js` と `StageManager.js` を新設し、色管理の責務を分離・統合します。

---

## User Review Required

> [!IMPORTANT]
> 以下の実装計画に問題がないか確認をお願いします。特に、既存の `colorDestroyCounts` / `totalScorePerColor` の初期化が `activeColors` に依存しているため、StageManager経由の動的な色管理への移行に注意が必要です。

## 発見した既存の潜在的問題

> [!WARNING]
> **`colorDestroyCounts` / `totalScorePerColor` の初期化が静的 `activeColors` にハードバインドされている件**
> 
> 現在 [config.js L245](file:///D:/ozlab/phaseout/js/core/config.js#L245) と [L253](file:///D:/ozlab/phaseout/js/core/config.js#L253) で、`colorDestroyCounts` と `totalScorePerColor` はモジュールロード時の `activeColors`（4色分の **HEXコード** ベース）で初期化されています。
> しかし `GameState.reset()` の [L287](file:///D:/ozlab/phaseout/js/core/config.js#L287) / [L295](file:///D:/ozlab/phaseout/js/core/config.js#L295) でも同じ静的な `activeColors` で再初期化しているため、StageManager導入後に色数が動的に変わる場合、**リセット時に初期色しかカウントされない**問題が発生します。
> 
> → 本作業でこの問題を StageManager.init() 連動の動的初期化に修正します。

---

## Proposed Changes

### コンポーネント 1: データ定義層（新規ファイル）

#### [NEW] [StageConfig.js](file:///D:/ozlab/phaseout/js/core/StageConfig.js)

指示書に記載されたコードをそのまま作成します。ステージごとの色解放データを定義するデータ専用モジュールです。

```javascript
export const DEFAULT_STAGE = {
    MAX_ACTIVE_COLORS: [0,7,7,7,7,7,7,7],
    INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE', 'GREEN', 'BLUE', 'ORANGE'],
    UNLOCKABLE_COLORS: []
};

export const STAGE_DATA = {
    DEFAULT: DEFAULT_STAGE,
    STAGE_01: {
        MAX_ACTIVE_COLORS: [0,4,4,4,4,5,6,7],
        INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE'],
        UNLOCKABLE_COLORS: ['GREEN', 'BLUE', 'ORANGE']
    }
};
```

---

#### [NEW] [StageManager.js](file:///D:/ozlab/phaseout/js/core/StageManager.js)

ゲームの色進行・環境構築を管理するシングルトンクラスを作成します。

- **`init(stageId)`**: `STAGE_DATA[stageId]` を読み込み（存在しなければ DEFAULT にフォールバック）、`GameState.activeColors` を `INITIAL_COLORS` に基づく **HEXコード配列** で初期化します。同時に `colorDestroyCounts` と `totalScorePerColor` も `GameState.activeColors` の色で再初期化します。
- **`onLevelUp(newLevel)`**: `MAX_ACTIVE_COLORS[newLevel]`（配列範囲外は末尾値にクランプ）を確認し、現在の `activeColors.length` より枠が増えていれば `UNLOCKABLE_COLORS` から未アクティブ色を1つ追加。追加時に `colorDestroyCounts` / `totalScorePerColor` にも新色のエントリを追加します。
- **`getActiveColors()`**: 現在の `GameState.activeColors` を返します。

**色名→HEX変換**: `INITIAL_COLORS` / `UNLOCKABLE_COLORS` は色名（`'RED'` 等）で定義されていますが、既存コードは **HEXコード** で色を参照しています（`gem.colorStr` はHEX）。そのため StageManager 内部で `COLOR_CONFIG` を参照し、色名→HEXの変換を行います。

---

### コンポーネント 2: 既存コードの改修

#### [MODIFY] [config.js](file:///D:/ozlab/phaseout/js/core/config.js)

1. **L214 の `activeColors` 定数のエクスポートを削除**
   ```diff
   -export const activeColors = COLOR_CONFIG.filter(c => c.enabled).map(c => c.color);
   ```

2. **`GameState` オブジェクトに `activeColors: []` プロパティを追加**（L224付近）
   ```diff
    GEMS: [],
   +activeColors: [],
    isAnimating: false,
   ```

3. **`GameState.reset()` 内の `colorDestroyCounts` / `totalScorePerColor` の初期化を変更**
   - 旧: 静的 `activeColors` で初期化
   - 新: `this.activeColors`（StageManager.init で設定される動的な色配列）で初期化。ただし `reset()` 呼び出し時点では `activeColors` がまだ空の可能性があるため、空配列の場合はスキップし、StageManager.init() 側で再初期化する設計とします。
   ```diff
   -this.colorDestroyCounts = activeColors.reduce(...);
   +this.colorDestroyCounts = {};
   -this.totalScorePerColor = activeColors.reduce(...);
   +this.totalScorePerColor = {};
   ```

4. **初期宣言時の `colorDestroyCounts` / `totalScorePerColor` も空オブジェクトに変更**（L245, L253）

---

#### [MODIFY] [PlayScene.js](file:///D:/ozlab/phaseout/js/scene/PlayScene.js)

`init()` メソッドの先頭（`initPhysics()` の直前）で `StageManager.init('STAGE_01')` を呼び出します。

```diff
 init() {
     super.init();
+    StageManager.init('STAGE_01');
     initPhysics();
 }
```

> [!IMPORTANT]
> **呼び出し順序**: `StageManager.init()` → `initPhysics()` の順序が重要です。
> `initPhysics()` 内で `GameState.reset()` が呼ばれますが、reset後に StageManager が `activeColors` を設定しているため、
> **実際の呼び出しフロー**は以下のようになります:
> 1. `StageManager.init('STAGE_01')` — ステージデータを内部に保持
> 2. `initPhysics()` → `GameState.reset()` — 状態リセット（activeColors は空オブジェクトに）
> 3. `initPhysics()` 内の `spawnInitialGems()` — ここで `StageManager.getActiveColors()` を使う
>
> つまり、`GameState.reset()` で `colorDestroyCounts` 等が空になった後、`StageManager.init()` で `activeColors` と関連カウンターを再設定する必要があります。
>
> **対策**: `StageManager.init()` は「ステージデータの保持」と「GameStateへの色設定」を分離し、`initPhysics()` 内の `GameState.reset()` 直後に StageManager が色設定を行えるよう、`initPhysics()` 内で `StageManager.applyColors()` のようなメソッドを呼ぶか、あるいは **PlayScene.init() で StageManager.init() を initPhysics() の後に呼ぶ** 方式とします。

> [!CAUTION]
> **初期化順序の問題を再検討した結論:**
> `initPhysics()` 内で `GameState.reset()` → `spawnInitialGems()` が呼ばれるため、`spawnInitialGems()` 実行時には `GameState.activeColors` が設定済みでなければなりません。
>
> **最終的な方式**: `initPhysics()` の先頭に近い `GameState.reset()` の **直後** に `StageManager.setupActiveColors()` を呼び出す形にします。PlayScene.init() では initPhysics() の前に `StageManager.init('STAGE_01')` でステージデータだけを保持させ、initPhysics() 内部で reset の直後にStageManagerの色設定を適用します。

改訂後の流れ:
```
PlayScene.init()
  ├── StageManager.init('STAGE_01')  ← ステージデータをStageManager内部に保持
  └── initPhysics()
        ├── GameState.reset()         ← 状態を全リセット（activeColors = []）
        ├── StageManager.setupActiveColors() ← activeColors/colorDestroyCounts等を設定
        ├── clearAll() / toggleStasisEffect(false)
        ├── Engine.create() ...
        ├── spawnInitialGems()         ← ここでGameState.activeColorsを参照
        └── setupGameLogic()
```

---

#### [MODIFY] [physics.js](file:///D:/ozlab/phaseout/js/core/physics.js)

1. **インポート変更**
   ```diff
   -import { GameState, STAGE_DATA, activeColors, SIZE_MIN, ... } from './config.js';
   +import { GameState, STAGE_DATA, SIZE_MIN, ... } from './config.js';
   +import { StageManager } from './StageManager.js';
   ```

2. **`initPhysics()` 内、`GameState.reset()` の直後に色設定を挿入**
   ```diff
    GameState.reset();
   +StageManager.setupActiveColors();
   ```

3. **`createGem()` 内の色選択ロジックを変更** (L174-176)
   ```diff
   -const colorIndex = Math.floor(Math.random() * activeColors.length);
   -const colorStr = activeColors[colorIndex];
   +const currentColors = StageManager.getActiveColors();
   +const colorIndex = Math.floor(Math.random() * currentColors.length);
   +const colorStr = currentColors[colorIndex];
   ```

---

#### [MODIFY] [logic.js](file:///D:/ozlab/phaseout/js/core/logic.js)

レベルアップ処理の直後に `StageManager.onLevelUp()` を呼び出します。

1. **インポート追加**
   ```diff
   +import { StageManager } from './StageManager.js';
   ```

2. **`finalizeDestruction()` 内、レベルアップ判定後にフック追加** (L354付近)
   ```diff
    if (leveledUp) {
        let newRate = getScoreRate(GameState.level);
        let newCost = LIFE_CONFIG.TAP_COST * Math.pow(LIFE_CONFIG.DECAY_MULTIPLIER, GameState.level - 1);
        showLevelUpPopup(oldLevel, GameState.level, oldRate, newRate, oldCost, newCost);
   +    StageManager.onLevelUp(GameState.level);
    }
   ```

---

### コンポーネント 3: ドキュメント・バージョン更新

#### [MODIFY] [changelog.js](file:///D:/ozlab/phaseout/changelog.js)

新バージョン `v0.19.0`（機能追加のためY加算）として以下を追記:
- 「機能追加: StageConfig.js / StageManager.js を新設し、ステージごとの色解放データとゲーム進行管理の責務を分離」
- 「機能追加: 落下色数のレベル連動を実装。STAGE_01ではLv1〜4が4色固定、Lv5以降に段階的に新色がアンロックされる仕様」
- 「アーキテクチャ改修: config.jsの静的 activeColors 定数を廃止し、GameState.activeColors として動的管理に一元化」

#### [MODIFY] [PROJECT_ARCHITECTURE.md](file:///D:/ozlab/phaseout/PROJECT_ARCHITECTURE.md)

- 先頭の最終更新バージョンを `v0.19.0` に更新
- ディレクトリ構造に `StageConfig.js` / `StageManager.js` を追加
- データ定義層・システムロジック層のテーブルに新ファイルの責務を追記

#### [MODIFY] [PROJECT_FUNCTION_INDEX.md](file:///D:/ozlab/phaseout/PROJECT_FUNCTION_INDEX.md)

- 先頭の最終更新バージョンを `v0.19.0` に更新
- `StageConfig.js` のデータ構造と `StageManager.js` の各メソッドを追記

---

## Verification Plan

### 手動検証
1. ゲーム起動 → パズル画面で **4色のみ** の宝石が降ることを確認
2. Lv5到達時に **5色目** が追加されることを確認（デバッグタブのEXP倍率を上げて加速）
3. Lv6/Lv7到達時にそれぞれ6色目/7色目がアンロックされることを確認
4. アンロック後の新色宝石が正しくパーティクル・レーザー・スコア計算に反映されることを確認
5. リザルト画面の色別スコアテーブルに、ゲーム中にアンロックされた色が正しく表示されることを確認
6. ゲーム終了→再プレイ時にリセットが正常に行われ、再び4色スタートになることを確認
