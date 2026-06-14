# ステージマネージャーの導入と落下色数のレベル連動実装

## Goal
現在の7色ランダム落下を廃止し、ゲーム開始時（STAGE_01のLv1〜Lv4）は「4色」固定の助走期間とし、レベルアップに応じて動的に新色がアンロックされる仕様を実装します。
その基盤として `StageConfig.js` と `StageManager.js` を新設し、既存の進行ロジックから色の解放・進行管理の責務を分離・統合します。

## 変更内容

### 1. `js/core/StageConfig.js` の新設
以下のコードをそのままファイルとして作成し、ステージごとの色解放データを定義してください。

```javascript
export const DEFAULT_STAGE = {
    // 制限なしのフル解放状態（ダミーのLv0を含む。Lv1以降はずっと7色）
    MAX_ACTIVE_COLORS: [0,7,7,7,7,7,7,7],
    INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE', 'GREEN', 'BLUE', 'ORANGE'],
    UNLOCKABLE_COLORS: []
};

export const STAGE_DATA = {
    DEFAULT: DEFAULT_STAGE,

    // 【ゲーム本編の最初のステージ】
    STAGE_01: {
        // Lv1〜4まで4色、Lv5から段階的に枠が広がるロードマップ仕様！
        MAX_ACTIVE_COLORS: [0,4,4,4,4,5,6,7],
        
        INITIAL_COLORS: ['RED', 'YELLOW', 'CYAN', 'PURPLE'],
        UNLOCKABLE_COLORS: ['GREEN', 'BLUE', 'ORANGE']
    }
};
```

### 2. js/core/StageManager.js の新設
- ゲームの進行・環境構築を管理する StageManager クラスを作成し、エクスポートします。
- config.js から GameState をインポートし、状態の管理を行います。
- init(stageId): 指定された STAGE_DATA[stageId] を読み込み（存在しない場合は DEFAULT にフォールバック）、現在のゲーム状態である GameState.activeColors を INITIAL_COLORS の配列で初期化（コピー）します。
- onLevelUp(newLevel): MAX_ACTIVE_COLORS[newLevel] を確認し、現在の GameState.activeColors.length よりも枠が増えていれば、UNLOCKABLE_COLORS の中から「まだアクティブになっていない色」を1つ選び、activeColors に追加します。（※選出基準は一旦配列順で構いません）
- getActiveColors(): 現在の GameState.activeColors を返します。

### 3. 既存コードからの繋ぎ変え（依存関係の修正）
- js/core/config.js: 下部で定義されている export const activeColors = ... の定数を削除してください。代わりに GameState オブジェクトのプロパティとして明示的に activeColors: [] を追加し、状態管理を完全に一元化します。
- js/scene/PlayScene.js: init() メソッドの先頭（initPhysics が呼ばれる直前）のベストタイミングで、明示的に StageManager.init('STAGE_01'); を呼び出し、ステージ環境を構築してください。（必要に応じてStageManagerをインポートすること）
- js/system/logic.js: finalizeDestruction などのレベルアップ処理の直後に StageManager.onLevelUp(GameState.level); を呼び出すようにフックを追加してください。
- js/render/physics.js: 古い activeColors のインポートを削除し、新たに import { StageManager } from '../core/StageManager.js' を追加してください。spawnInitialGems や盤面補充時の色決定において、従来の全体設定を参照している部分を、StageManager.getActiveColors() が返す色の中からランダムに選出するように置き換えてください。

### 4. ドキュメントおよびバージョンの更新
- changelog.js: 新しいバージョン（例: v0.18.6）として「StageManagerの導入と、落下色数のレベル連動（Lv5以降のアンロック）機能の実装」を追記してください。
- PROJECT_ARCHITECTURE.md と PROJECT_FUNCTION_INDEX.md: 先頭の最終更新バージョンを同期して更新してください。


## User Review Required
[!IMPORTANT] 上記の計画に基づき、physics.js や logic.js、PlayScene.js 側で不足している変更箇所がないか確認し、問題がなければ実装作業へ進む許可を求めてください。
