# `logic.js` の責務分割（アルゴリズム層の分離）リファクタリング

## Goal
アーキテクチャ資料の「今後のリファクタリング・分離候補」に基づき、肥大化した `logic.js` からパズル盤面の探索アルゴリズム（BFS等）を独立したモジュール `ChainAlgorithm.js` として分離します。
これにより、将来の「プリズムリンク」実装時に、ゲーム進行管理部分（システム・経済層）への予期せぬ副作用を防ぐ、安全な開発基盤を構築します。

## Proposed Changes

### 1. [NEW] `js/core/ChainAlgorithm.js` の新設
純粋なパズル盤面の探索・計算のみを担当するモジュールを作成します。
*   **移行・リファクタリングする関数:**
    *   `areGemsTouching(g1, g2)` （宝石間の接触判定）
    *   `getAdjacencyList(activeGems)` （隣接リストの構築）
    *   BFS探索ロジック: 現在の `startChain` 内部にある「タップした宝石を起点に、同色で繋がっている宝石のグループ（配列）を抽出するアルゴリズム部分」を、例えば `findChainGroup(startGem, activeGems)` などの純粋な関数として切り出します。
*   **留意点:**
    *   このモジュールは、描画やエフェクト（`effects.js`）への依存、および `GameState` の直接的な書き換えを極力持たない「純粋な計算クラス」として設計してください。

### 2. [MODIFY] `js/core/logic.js` の純化（コントローラー化）
アルゴリズム層から結果を受け取り、ゲーム進行を統括するコントローラーとしてスリム化します。
*   **残す関数（進行・経済管理）:**
    *   `setupGameLogic`, `removeGameLogic`, `getCurrentLifeDecayRate`, `beforeUpdateHandler`, `checkGameOver`, `finalizeDestruction`
*   **`startChain` の改修:**
    *   関数自体は `logic.js` に残しますが、内部の探索処理は新設した `ChainAlgorithm.js`（例: `findChainGroup`）に委譲します。
    *   探索結果（連鎖グループ）を受け取った後、`animateLaserLevels` の呼び出しや、レーザー完了後の `finalizeDestruction` の実行といった「演出とゲーム進行のフロー制御」のみを担当するようにします。
*   **インポートの整理:**
    *   分離により不要になったモジュールのインポートを整理し、新たに `ChainAlgorithm` をインポートしてください。

### 3. Documentation & Versioning
*   **[MODIFY] `changelog.js`**: 
    *   マイナーバージョンをインクリメント（例: `v0.20.7`）し、「リファクタリング: `logic.js` の責務を分割し、パズル探索アルゴリズム部分を `ChainAlgorithm.js` として分離・独立」といった旨を追記してください。
*   **[MODIFY] `PROJECT_ARCHITECTURE.md`**:
    *   先頭の最終更新バージョンを同期してください。
    *   「今後のリファクタリング・分離候補」から `logic.js` の責務分割タスクを完了済（削除または完了の注記）にしてください。
    *   「2. ディレクトリ・ファイル構成と厳密な責務」の【システム・ロジック層】に `ChainAlgorithm.js` を追加し、「盤面の接続判定とBFS探索アルゴリズムを担当する純粋な計算モジュール。UIや状態変更には干渉しない」旨を記載してください。`logic.js` の説明文も実態に合わせて更新してください。
*   **[MODIFY] `PROJECT_FUNCTION_INDEX.md`**:
    *   先頭の最終更新バージョンを同期してください。
    *   `logic.js` から移動した関数を `ChainAlgorithm.js` の項目として新設・移動させてください。

## User Review Required
> [!IMPORTANT]
> このリファクタリングは内部構造の整理であり、既存の連鎖処理（タップからレーザー発火、破壊、スコア獲得、エフェクト発生まで）のゲームプレイ体験が **1ドット・1フレームも変わっていないこと** が絶対条件です。
> 分割後の `ChainAlgorithm.js` のインターフェース設計（引数と戻り値）について、実装を進める前にアプローチに問題がないか確認を求めてください。
