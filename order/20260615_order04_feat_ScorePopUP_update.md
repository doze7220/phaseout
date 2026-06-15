投下用プロンプト：ポップアップの実RATE表記＆2段組みUI実装
以下の実装指示に従い、『PHASE OUT』の連鎖ポップアップ表示における「RATE表記」を、実際のRATE数値（上位7桁表示）を組み込んだサイバーパンクな2段組み・長体レイアウトへと改修してください。
1. 目的
数式ポップアップ内の「RATE」という固定文字表記を廃止し、「極小のRATEラベル」と「長体化（Xスケール圧縮）された巨大な実RATE数値（上位7桁）」の2段組みに変更する。 また、UIの微調整を容易にするため、文字と数値の相対座標およびXYスケールを LayoutConfig.js へ完全に分離する。
2. 対象ファイル
js/core/LayoutConfig.js
js/render/ScreenEffects.js
3. 修正内容詳細
【1】 LayoutConfig.js の改修（定数の追加） LAYOUT_CONFIG 内の POPUPS (または数式ポップアップの設定箇所) に、以下のRATE描画用コンフィグを追加してください。
RATE_LABEL: 小さな「RATE」文字用の設定
OFFSET_X: (例: 0) ベース座標からのXズレ
OFFSET_Y: (例: -15) 数値の上に配置するためのYズレ
SCALE_X: 0.35 (文字の幅)
SCALE_Y: 0.35 (文字の高さ)
RATE_VALUE: 巨大な実数字用の設定
OFFSET_X: (例: 0) ※LABELと同じ値にして「左寄せ」を担保する
OFFSET_Y: (例: 5)
SCALE_X: 0.8 (長体化による省スペース)
SCALE_Y: 1.0 (高さは維持)
【2】 ScreenEffects.js の改修（ポップアップ描画ロジックの変更） drawPopups (または数式を描画しているメソッド) 内の RATE 描画処理を以下のように書き換えてください。
実RATEの取得とパース:
現在の GameState.level から getScoreRate(GameState.level) を用いて現在のRATE実数値を取得する。
score.js の generateScoreData(rateValue, 7) を呼び出し、上位7桁＋単位のトークン配列を生成する。
RATEラベルの描画（1段目）:
ポップアップのベース描画座標 (startX, startY) を基準に、LayoutConfig の RATE_LABEL.OFFSET_X / Y を加算。
ScoreRenderer.drawString を用いて、RATE_LABEL.SCALE_X / Y のスケールで「RATE」という文字列を描画する。
実RATE数値の描画（2段目 / 左寄せ）:
同じくベース座標を基準に、LayoutConfig の RATE_VALUE.OFFSET_X / Y を加算。
ScoreRenderer.drawScoreData を用いて、先ほど生成した7桁のトークン配列を RATE_VALUE.SCALE_X / Y のスケールで描画する。
※ XY個別のスケール引数はすでに ScoreRenderer に実装済み（v0.15.4）のため、そのまま引数として渡すこと。
数式「× (Chain - 2)² ...」の追従（Xオフセットの動的計算）:
ScoreRenderer.measureScoreData に7桁トークンと RATE_VALUE.SCALE_X を渡し、RATE数値の実際の描画幅 (Width) を取得する。
RATE数値のWidth と RATEラベルのWidth を比較し、大きい方を後続の数式の「Xオフセット（押し出し幅）」として採用する。
計算したXオフセットに一定のマージン（例: 10px）を足した位置から、続く数式文字列を描画する。
4. 確認事項
DOMは一切使用せず、すべてCanvasへの描画として完結していること。
レベルアップでRATEの桁数（万、億など）が増減しても、RATEラベルと実数字の「1桁目の左端」が常にピタッと揃っている（左寄せされている）こと。
X軸が圧縮された長体フォントとして実RATEが描画され、かつ後続の数式と文字被りを起こしていないこと。
ディレクター、このプロンプトをそのま