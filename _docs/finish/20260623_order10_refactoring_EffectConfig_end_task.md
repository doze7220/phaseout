 【プロンプト】PROJECT_FUNCTION_INDEX.md のコンフィグ定義更新
# 目的
`effectConfig.js` の大規模リファクタリングが完了したことに伴い、関数リファレンスインデックス（`PROJECT_FUNCTION_INDEX.md`）の古い記述を最新の状態に更新（浄化）する。

# 変更対象ファイル
- `PROJECT_FUNCTION_INDEX.md`

# 実行手順
1. 最新の `effectConfig.js` を読み込み、現在エクスポートされているすべての定数（`PARTICLE_CONFIG`, `LASER_EFFECT_CONFIG`, `POPUP_EFFECT_CONFIG` など）と、そのコメントアウトから「何を制御しているか」の概要を解析する。
2. `PROJECT_FUNCTION_INDEX.md` の `1. config.js`（またはそれに類する設定ファイルの項目）内にある、古い `EFFECT_MATH_CONFIG` の行を完全に削除する。
3. 削除した箇所に、解析した新しい各コンフィグオブジェクト群（`PARTICLE_CONFIG` 等）をテーブル形式で追記し、それぞれの内容と概要を適切に記述する。
4. **【絶対厳守】** `PROJECT_FUNCTION_INDEX.md` の他の部分（各モジュールの関数リストなど）には **一切の変更を加えないこと**。コンフィグの定義テーブル部分のみをピンポイントで差し替えること。

# 作業完了後
更新が完了したら、ユーザーに「ドキュメントの浄化が完了しました」と報告すること。
