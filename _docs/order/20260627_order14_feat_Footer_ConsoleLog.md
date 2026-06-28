# デバッグ指示：フッターUIキャラクター非表示問題の調査

キャラクター画像がフッターに表示されない不具合の切り分けを行うため、関連モジュールにブラウザコンソールへのデバッグログを追加せよ。
※重要：`FooterUIManager` などの描画ループ内で無条件に `console.log` を実行するとブラウザがクラッシュするため、以下の「初回限定フラグ」を用いた安全な方法で実装すること。また、ログの形式は既存システムに合わせ `[モジュール名]` のプレフィックスを付けること。

## 1. CharacterPuzzleManager.js へのログ追加
*   **対象メソッド**: `init(partyIds)`
*   **追加内容**: 初期化完了直後（`GameState.party` を読み込んだ後）に、生成された内部ステートの内容をコンソールに出力せよ。
    *   実装コード: `console.log("[CharPzMng] 初期化完了. Slots:", this.slots);`

## 2. FooterUIManager.js への初回限定ログ追加
*   **追加内容**: モジュールスコープに `let debugLogDone = false;` というフラグを定義せよ。
*   **対象メソッド**: `updateAndDraw`
*   **追加内容**: メソッドの先頭付近で、最初の1フレーム目だけ、枠0（ルビィ）のデータ取得状態と画像ロード状態を出力し、フラグを折れ。
    *   実装例:
        ```javascript
        if (!debugLogDone) {
            const slotData = CharacterPuzzleManager.getSlotData(0);
            console.log("[Footer] 初回フレーム - Slot 0 Data:", slotData);
            if (slotData) {
                // AssetManager.images に実画像がロードされてキャッシュされているか確認
                const img = AssetManager.images[slotData.id];
                console.log(`[Footer] 画像ロード状態 (${slotData.id}):`, !!img, img);
            }
            debugLogDone = true;
        }
        ```

上記を実装し、一時的にデバッグログを出力させる状態にせよ。
