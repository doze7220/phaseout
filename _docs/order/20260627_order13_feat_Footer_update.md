# 実装指示書：フッターUIの受肉とチュートリアル編成の再現

キャラクターマネージャーの基盤完成を受け、フッター領域（`FooterUIManager.js`）へキャラクター情報を描画するUIの刷新を行う。
世界観設定（チュートリアル）に基づき、初期状態は「ルビィ1名のみ」が接続されている状態とし、以下の仕様で実装せよ。

## 1. 初期編成（チュートリアル状態）の確認
*   **対象**: `js/core/config.js`
*   **内容**: `GameState.party` の初期値、および `GameState.reset()` 内の再設定処理を `[ "char_ruvie", null, null ]` に変更せよ。枠2と枠3は未編成（空枠）として扱う。この変更作業はすでに終わっている。

## 2. CharacterPuzzleManager の null 許容対応
*   **対象**: `js/core/CharacterPuzzleManager.js`
*   **内容**: `init(partyIds)` 内で、配列の要素が `null` （未編成）の場合でもエラーにならず、内部ステートとして `null` を保持できるようにせよ。また、UIから呼ばれる `getSlotData(index)` も、対象が空枠の場合は `null` を返すようにすること。

## 3. FooterUIManager.js のUI刷新（受肉）
*   **対象**: `js/render/FooterUIManager.js`
*   **内容**: 毎フレームの描画において、現在の3分割枠それぞれについて `CharacterPuzzleManager.getSlotData(index)` を呼び出し、以下の描画分岐を行うこと。
    *   **データが `null` の場合（空枠）**:
        *   現状の「NO SIGNAL」エフェクト（走査線、グリッチ等）をそのまま継続して描画する。
    *   **データが存在する場合（ルビィ）**: 
        *   「NO SIGNAL」エフェクトの描画を停止する。
        *   キャラクターの名前（ルビィ）、スキル名（Ruby Bullet）、現在のスキルチャージゲージをCanvas描画する。
        *   ルビィの画像は用意してある。200x200pxのpngである。CharacterData.jsに定義済み。

上記を反映し、UIへのキャラクター実装（第一段階）を完遂せよ。
