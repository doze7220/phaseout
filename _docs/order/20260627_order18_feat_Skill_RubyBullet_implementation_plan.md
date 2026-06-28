# 実装計画書：スキルシステム基盤の構築（RUBY BULLET の実装）

ルビィの「RUBY BULLET」の仕様である「赤以外の宝石をランダムに10個、指定フレーム間隔で連射破壊する」処理を、安全な実行キューを用いて構築します。

## User Review Required

特になし。

## Open Questions

* 指示書には「バンッ！バンッと計10個物理的に消滅する」とありますが、現時点では `Matter.Composite.remove` による純粋な物理削除のみを予定しています。もしパーティクル生成やSE再生（`effects.js`の利用）が必要であれば、追加の指示をお願いします。

## Proposed Changes

### データ定義層

#### [MODIFY] [SkillData.js](file:///D:/ozlab/phaseout/js/core/SkillData.js)
`skill_ruby_bullet` のデータ定義を拡張します。
- `type: "DESTROY_EXCLUDE_COLOR"` を追加
- `excludeColorId: "RED"` を追加
- `effectValue: 10` を追加
- `intervalFrames: 10` を追加

### スキル発動管理層

#### [MODIFY] [SkillManager.js](file:///D:/ozlab/phaseout/js/core/SkillManager.js)
実行キュー（遅延連射）の実装を行います。
- `activeSkillQueues = []` 配列の定義
- `GameState` および `COLOR_CONFIG`、`SkillData` のインポート追加
- `activateSkill` の拡張：
  - `type === "DESTROY_EXCLUDE_COLOR"` の場合、盤面 (`GameState.GEMS`) から指定色以外の宝石をフィルタリングし、ランダムに最大 `effectValue` 個抽出。
  - 抽出した宝石配列と間隔フレームを `activeSkillQueues` に登録。
- `update()` メソッドの新設：
  - 毎フレーム `activeSkillQueues` を進行させ、指定間隔ごとに宝石を1個ずつ削除。
  - 削除前に、対象の宝石が `GameState.GEMS` 内に現在も存在しているかの存在確認を必ず行う。
  - 存在する場合のみ、`window.Matter.Composite.remove(GameState.engine.world, gem)` と配列からの削除を実行。スコアやチャージの加算処理は呼ばない。

### 物理エンジン層

#### [MODIFY] [physics.js](file:///D:/ozlab/phaseout/js/core/physics.js)
更新ループへの結線を行います。
- `SkillManager` のインポート追加
- `updatePhysics` 内の物理ステップループ（`while (GameState.accumulator >= timeStep)`内）にて、`Matter.Engine.update` 実行直後に `SkillManager.update()` を呼び出すように追加。

## Verification Plan

### Manual Verification
1. ゲームを開始し、パズル画面で赤色を消してルビィのゲージをMAXにする。
2. オートでスキルが発動し、ポップアップUIが表示されることを確認。
3. ポップアップと同時に、盤面にある「赤以外の宝石」が10フレーム（約0.16秒）間隔で1個ずつ、計10個消滅することを目視で確認する。
4. 消滅対象が10個未満の場合は、残っている対象分だけが消滅し、エラーにならないことをコンソールで確認する。
5. ユーザー操作等で対象が途中で消えた場合にも、キュー進行がクラッシュしないか（存在確認が機能するか）を確認する。
