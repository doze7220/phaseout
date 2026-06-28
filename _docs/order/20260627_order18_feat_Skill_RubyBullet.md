# 実装指示書：スキルシステム基盤の構築（物理破壊ロジックと連射キューの追加）

スキルによる盤面への物理的干渉ロジックを実装する。
ルビィの「RUBY BULLET」の仕様である「赤以外の宝石をランダムに10個、指定フレーム間隔で連射破壊する」処理を、安全な実行キューを用いて構築せよ。

## 1. SkillData.js の拡張
*   **対象**: `skill_ruby_bullet` のデータ定義
*   **内容**: 破壊対象と連射性能のプロパティを追加せよ。
    *   `type: "DESTROY_EXCLUDE_COLOR"`
    *   `excludeColorId: "RED"`（この色以外を破壊）
    *   `effectValue: 10`（最大破壊数）
    *   `intervalFrames: 10`（連射間隔フレーム数）

## 2. SkillManager.js への実行キュー（遅延連射）の実装
*   モジュール内に、現在実行中のスキルを管理する配列 `activeSkillQueues = []` を定義せよ。
*   **`activateSkill(slotIndex)` の改修**:
    *   既存のゲージリセットとポップアップ表示は維持すること。
    *   `SkillData` を参照し、`type === "DESTROY_EXCLUDE_COLOR"` の場合：
        1. 盤面（`GameState.GEMS`）から `colorId !== skillData.excludeColorId` の宝石をフィルタリングし、最大 `effectValue` 個までランダムに抽出して配列化する（盤面に対象が少ない場合はその数だけ抽出）。
        2. `activeSkillQueues.push({ targets: 抽出した配列, interval: skillData.intervalFrames, currentFrame: 0 })` としてキューに登録せよ。
*   **`update()` メソッドの新設**:
    *   毎フレーム呼ばれる進行メソッドを新設せよ。
    *   `activeSkillQueues` をループし、`currentFrame` を 1 加算する。
    *   `currentFrame >= interval` に達した場合：
        1. `targets` から最初の宝石を取り出し（`shift`）、`currentFrame = 0` にリセットする。
        2. **【重要: 安全処理】** 取り出した宝石が、現在も `GameState.GEMS` 配列の中に存在しているか（プレイヤーのタップ等で既に消滅していないか）を必ず確認せよ。
        3. 存在する場合のみ、`Matter.Composite.remove(engine.world, gem)` および `GameState.GEMS` からの削除を実行せよ。（※無限ループを防ぐため、スコアやチャージの加算フローには絶対に流さないこと）
        4. `targets` が空になったオブジェクトはキューから除外せよ。

## 3. physics.js への更新ループ結線
*   **対象**: `js/core/physics.js` の `updatePhysics(delta)`
*   **内容**:
    *   ファイル上部で `SkillManager` をインポートせよ。
    *   `Engine.update(engine, delta)` の直後など、安全なタイミングで毎物理フレーム `SkillManager.update()` を呼び出すよう結線せよ。

## 4. 動作確認とドキュメント更新
*   パズルを実行し、赤色を消してルビィのゲージをMAXにする。
*   自動発動時、ポップアップUIが表示されると同時に、盤面の「赤以外の宝石」が10フレーム間隔で1個ずつ、バンッ！バンッと計10個物理的に消滅することを確認せよ。
*   （プレイヤーの操作で偶然赤以外の宝石が10個未満しかない場合、エラーにならずにある分だけ破壊されて終了することも確認すること）。
