# 実装指示書：Step 3 パズルロジックとのチャージ結線

フッターUIへのキャラクター表示実装完了を受け、パズルロジック（宝石の破壊）とキャラクターのスキルゲージを加算するロジックの結線を行う。

## 1. CharacterPuzzleManager.js の加算ロジック実装
*   **対象**: `addCharge(colorId, amount)` メソッド（プレースホルダーの具体化）
*   **内容**:
    *   内部の `this.slots` をループし、データが存在（`!== null`）し、かつ `slot.colorId === colorId` であるキャラクターを探す。
    *   対象が見つかった場合、`slot.currentCharge += amount` を実行する。
    *   加算後、`slot.currentCharge` がマスターデータ（`CharacterData`）の `maxCharge` を超えないようクランプ（`Math.min`）する処理を実装せよ。

## 2. logic.js からのチャージ通知の結線
*   **対象**: `js/core/logic.js` の `finalizeDestruction` 関数
*   **内容**:
    *   宝石の破壊が確定し、スコア・EXPの計算が行われる箇所（各色の破壊数 `colorDestroyCounts` が更新された直後など）に処理を追加する。
    *   破壊された各色（`colorId` または `colorStr`）について、破壊した数（または連鎖数等の任意の量）を `amount` として、`CharacterPuzzleManager.addCharge(colorId, amount)` を呼び出すよう結線せよ。

## 3. 動作確認とインデックスの更新
*   パズルを実行し、赤色（ルビィと同じ色）の宝石を破壊した際に、フッターUIのルビィのゲージ（現在デバッグログで監視中）が正しく増加して描画されることを確認せよ。
*   実装と動作確認が完了したら、`FEATURE_ADD_CHARACTER.md` を更新し、Step 3 が完了した旨を記録せよ。
