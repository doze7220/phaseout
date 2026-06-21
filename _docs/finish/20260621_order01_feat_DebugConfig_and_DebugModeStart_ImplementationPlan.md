# デバッグ用設定値の定数化 (DebugConfig) とデバッグスタート機能の実装計画

パズルプレイ中の状況操作や特定フェイズからのテスト開始を迅速に行うため、デバッグ用パラメータを集約した新規ファイル `DebugConfig.js` を作成し、既存の `ConfigScene.js` のマジックナンバーを排除します。また、指定した初期状態からパズルを開始できる「デバッグスタートボタン」を第12層（DEBUG_OVERLAY）に配置します。

---

## ユーザー確認要求

> [!IMPORTANT]
> - **デバッグスタートボタンの配置座標について**
>   - ボタンの配置座標として、デバッグ情報ウィンドウ（幅360px）の右隣である `X: 380`, `Y: 125`、サイズ `幅: 150`, `高さ: 40` を提案しています。この座標を `LayoutConfig.js` に新規定義として追加する設計でよろしいでしょうか。
> - **レベルジャンプ時の色アンロックシミュレーションについて**
>   - レベルが7などの状態で開始される場合、初期状態の宝石の色にアンロック済みの色が含まれるよう、`StageManager.onLevelUp` をレベル2からターゲットレベルまでループ実行して色解放をシミュレートする設計としています。これにより、通常プレイと完全に同じ状態を副作用なく再現します。

---

## オープンな質問
- なし（ソースファイルの調査により、すべての不明点が解消されました）

---

## 提案する変更内容

### 1. 新設コンポーネント

#### [NEW] [DebugConfig.js](file:///d:/ozlab/phaseout/js/core/DebugConfig.js)
デバッグ用の設定値、プリセット、有効化フラグを定義・エクスポートします。
- `ENABLE_DEBUG_OVERLAY` : デバッグオーバーレイ（第12層）の表示/非表示を一括切り替えするフラグ（本番ビルドでの無効化用）。
- `DEBUG_VALUES` : `ConfigScene.js` のDEBUGタブボタン用の設定値リスト。
- `START_PRESET` : デバッグスタート時の初期ゲーム状態（レベル、ライフ、各種ゲージ値）。

**実装イメージ:**
```javascript
export const ENABLE_DEBUG_OVERLAY = true;

export const DEBUG_VALUES = {
    BFS: [1, 2, 5],
    SCORE: [
        { label: 'x1', value: 1n },
        { label: 'x1万', value: 10000n },
        { label: 'x1億', value: 100000000n }
    ],
    LIFE_DECAY: [0, 1, 10],
    EXP: [1, 10, 50],
    SPEED: [0.5, 1.0, 2.0],
    WIREFRAME: [
        { label: 'ON', value: true },
        { label: 'OFF', value: false }
    ],
    SHIFT_DECAY: [
        { label: 'x0.0', value: 0 },
        { label: 'x1.0', value: 1 },
        { label: 'x5.0', value: 5 }
    ],
    SHIFT_GAUGE: [
        { label: '0', value: 0 },
        { label: '500', value: 500 },
        { label: 'MAX', value: 1000 }
    ],
    REVERSE_GAUGE: [
        { label: '0', value: 0 },
        { label: '500', value: 500 },
        { label: 'MAX', value: 1000 }
    ]
};

export const START_PRESET = {
    level: 7,
    life: 3000, // MAX_LIFE
    phaseGauge: 500,
    breakGauge: 0
};
```

---

### 2. 既存コンポーネントの修正

#### [MODIFY] [LayoutConfig.js](file:///d:/ozlab/phaseout/js/core/LayoutConfig.js)
- `DEBUG_OVERLAY` オブジェクトに、「DEBUG START」ボタン描画用のレイアウト設定を追加します。

```javascript
    DEBUG_OVERLAY: {
        ...
        START_BTN_X: 380,
        START_BTN_Y: 125,
        START_BTN_WIDTH: 150,
        START_BTN_HEIGHT: 40,
        START_BTN_FONT: 'bold 16px sans-serif'
    }
```

#### [MODIFY] [ConfigScene.js](file:///d:/ozlab/phaseout/js/scene/ConfigScene.js)
- マジックナンバーで直書きされていた各種配列（`bfsVals`, `scoreVals` 等）を、`DebugConfig.js` からインポートした `DEBUG_VALUES` 配列を参照するように修正します。

```javascript
import { DEBUG_VALUES } from '../core/DebugConfig.js';
...
// 例:
this.bfsBtns = createRightAlignedButtonGroup(DEBUG_VALUES.BFS, startY + cheatYStart, v => `x${v}`);
this.scoreBtns = createRightAlignedButtonGroup(DEBUG_VALUES.SCORE, startY + cheatYStart + cheatGapY * 1);
```

#### [MODIFY] [Visualizer.js](file:///d:/ozlab/phaseout/js/render/Visualizer.js)
- `BackgroundVisualizer` クラスの `drawDebug` メソッドにて、`ENABLE_DEBUG_OVERLAY` が有効、かつタイトル画面（`GameState.currentScene === 'TITLE'`）である場合のみ「DEBUG START」ボタンを描画します。
- ボタンの描画と同時に、`UIManager.updateButtonRect` を呼び出してヒット判定の座標を更新します。
- タイトル画面から別の画面に切り替わった際には `UIManager.deactivateButton('DEBUG_START_BTN')` を呼び出し判定を無効化します。

```javascript
import { ENABLE_DEBUG_OVERLAY } from '../core/DebugConfig.js';
import { UIManager } from '../core/UIManager.js';
...
drawDebug(ctx) {
    ...
    if (ENABLE_DEBUG_OVERLAY && GameState.currentScene === 'TITLE') {
        const btnConf = LAYOUT_CONFIG.DEBUG_OVERLAY;
        // ボタン背景と枠、テキストの描画
        ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.fillRect(btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);
        
        ctx.fillStyle = '#fff';
        ctx.font = btnConf.START_BTN_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEBUG START', btnConf.START_BTN_X + btnConf.START_BTN_WIDTH / 2, btnConf.START_BTN_Y + btnConf.START_BTN_HEIGHT / 2);

        // ヒットテストの登録 (第12層 = DEBUG_OVERLAY)
        UIManager.updateButtonRect('DEBUG_START_BTN', 12, btnConf.START_BTN_X, btnConf.START_BTN_Y, btnConf.START_BTN_WIDTH, btnConf.START_BTN_HEIGHT);
    } else {
        UIManager.deactivateButton('DEBUG_START_BTN');
    }
    ...
}
```

#### [MODIFY] [main.js](file:///d:/ozlab/phaseout/js/core/main.js)
- アプリ初期化の段階で「DEBUG START」ボタンのクリックコールバックを登録します。
- 押下時は、通常のパズル遷移処理を実行しつつ、デバッグスタート経由であることを示すフラグ `GameState.isDebugStart = true` を設定します。

```javascript
import { START_PRESET } from './DebugConfig.js';
...
// コールバック登録
UIManager.setButtonCallback('DEBUG_START_BTN', () => {
    soundManager.playSE('TAP');
    GameState.isDebugStart = true;
    GameState.currentScene = 'PUZZLE';
    GameState.reset();
    SceneManager.changeScene(new PlayScene());
});
```

#### [MODIFY] [physics.js](file:///d:/ozlab/phaseout/js/core/physics.js)
- `initPhysics` メソッド内、`StageManager.setupActiveColors()` の実行**直後**、かつ `spawnInitialGems()` の**前**のタイミングで、`GameState.isDebugStart` が `true` である場合に `START_PRESET` を適用（インジェクション）します。
- これにより、レベルに応じた色解放や、初期配置ジェムの色の整合性を保ちます。

```javascript
import { START_PRESET } from './DebugConfig.js';
...
export function initPhysics() {
    ...
    GameState.reset();
    StageManager.setupActiveColors();

    // デバッグスタート時のプリセット適用
    if (GameState.isDebugStart) {
        if (START_PRESET) {
            if (START_PRESET.level !== undefined) {
                GameState.level = START_PRESET.level;
                GameState.displayLevel = START_PRESET.level;
                GameState.nextLevelExp = Math.floor(10 * (1.5 ** (START_PRESET.level - 1))); // LEVEL_CONFIGに基づく
                // レベルに応じた色解放の再現
                for (let l = 2; l <= START_PRESET.level; l++) {
                    StageManager.onLevelUp(l);
                }
            }
            if (START_PRESET.life !== undefined) {
                GameState.life = START_PRESET.life;
            }
            if (START_PRESET.phaseGauge !== undefined) {
                PhaseManager.phaseGauge = START_PRESET.phaseGauge;
            }
            if (START_PRESET.breakGauge !== undefined) {
                PhaseManager.breakGauge = START_PRESET.breakGauge;
            }
        }
        GameState.isDebugStart = false; // フラグのリセット
    }
    
    // エフェクトの初期化
    clearAll();
    ...
    spawnInitialGems(); // 適用後の activeColors で宝石を生成
    ...
}
```

---

## 依存関係

- `ConfigScene.js` および `Visualizer.js`、`main.js`、`physics.js` は新設する `DebugConfig.js` に依存します。
- `UIManager.js` のレイヤーソート機能により、第12層として登録された「DEBUG START」ボタンは、他の下層UI（タイトル画面の全画面タップ等）よりも優先的にタップイベントを受け取り、背面への貫通を防ぎます。
- `physics.js` 内でのプリセット適用は `StageManager` の色解放管理（`StageManager.onLevelUp`）および `PhaseManager` に依存します。

---

## 検証計画

### 1. 単体検証 (設定値の分離)
- `DebugConfig.js` の `DEBUG_VALUES.BFS` や `DEBUG_VALUES.SCORE` などの値を書き換えた際、`ConfigScene.js` 内のDEBUGタブに表示されるボタン項目や、タップ時に適用される数値が自動的に追従して変更されることを確認します。

### 2. オーバーレイフラグの検証
- `ENABLE_DEBUG_OVERLAY = false` に設定した際、タイトル画面で「DEBUG START」ボタンが非表示になり、タップ判定も無効化されることを確認します。
- タイトルから通常の「TAP TO START」でパズル画面に遷移した際、ボタンが画面に表示されないこと、およびヒット判定が `deactivateButton` により確実に無効化されることを確認します。

### 3. デバッグスタート機能の検証
- 「DEBUG START」ボタンを押下してパズル画面に遷移した際：
  - 画面左上のレベル表示が `7` (あるいはプリセット指定値) になっていること。
  - 自然消費ライフがレベル7基準に上昇し、初期ライフが `3000` に設定されていること。
  - 初期配置ジェムの中に、レベル7時点でアンロックされているすべての色（赤、黄、水、紫、およびアンロックされた色）が正しく含まれていること。
  - シフトゲージが `500` の状態から開始され、減少または追加が正常に行われること。
- 通常のパズル遷移（TAP TO START）を行った場合には、これらのプリセットが一切干渉せず、レベル1から通常通りパズルが開始される（副作用がない）ことを確認します。
