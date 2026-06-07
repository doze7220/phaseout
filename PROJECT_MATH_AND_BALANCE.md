# PROJECT_MATH_AND_BALANCE.md
（ゲームバランスおよび計算式仕様書）

最終更新: 2026-06-07 (v0.9.5 時点)

このドキュメントは、ゲームを構築するためのすべての計算式、固定値、マジックナンバーを集約した資料です。コアロジックから演出、サウンドに至るまで、プレイの手触りを構成する数値を完全に網羅し、調整の際のSingle Source of Truthとして機能します。

## 1. コアロジック層（ライフ・スコア・EXP）

### 1.1. スコア・LIFE・EXP関連の基本計算式
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **SCORE RATE (レート)** | `Level 1` = 1.5<br>`Level 2` = 15<br>`Level 3` = 310<br>`Level 4以降` = `310 * (10 ^ (Level - 3)) * (1.5 ^ (Level - 3))` | `config.js` (`getScoreRate()`)<br>レベルが上がるごとに劇的なインフレを引き起こす。 |
| **獲得スコア** | `RATE * 連鎖ボーナス`<br>※連鎖ボーナス = `(連鎖数 - 2) ^ 2` (連鎖数≧3の場合、2以下は1) | `logic.js` (`(chainCount - 2n) ** 2n`)<br>連鎖数による二次関数的な伸び。 |
| **LIFE 自然減少量** | `0.5 * (1.15 ^ (Level - 1))` (1フレームあたり)<br>※秒間減少量 = `1フレーム減少量 * 60` | `config.js` (`INITIAL_DECAY`, `DECAY_MULTIPLIER`) |
| **LIFE タップ消費量** | `50 * (1.15 ^ (Level - 1))` | `config.js` (`TAP_COST`, `DECAY_MULTIPLIER`) |
| **LIFE 回復量 (消去時)** | `10 * 連鎖数`<br>※最大値 `MAX_LIFE` (3000) でクランプ | `config.js` (`RESTORE_BASE`) |
| **次レベル必要経験値** | `10 * (1.5 ^ (Level - 1))` (切り捨て) | `config.js` (`BASE_REQUIRE_EXP`, `EXP_CURVE_MULTIPLIER`) |
| **獲得経験値 (基本)** | `Round(連鎖数 * (100 / (連鎖数 + 100)))` | `logic.js`<br>`100` は大チェインになるほど1ブロックあたりの経験値効率が減衰するマジックナンバー。 |
| **獲得経験値 (色減衰)** | `Ceil(基本経験値 * (最小破壊色カウント / 該当色破壊カウント))` | `logic.js`<br>特定の色だけを偏って消すと獲得EXPが減少するバランス調整。 |

## 2. 物理エンジン層

### 2.1. 物理挙動・判定・各種クランプの隠しパラメータ
| 項目 | 設定値 / クランプ処理 | 関連変数・ファイル |
| :--- | :--- | :--- |
| **宝石サイズ生成** | `Mean: 40`, `StdDev: 5` (正規分布)<br>`STEP: 5` ごとに丸め<br>サイズ制限: `Min: 25`, `Max: 70` | `config.js` / `physics.js`<br>正規分布を用いて自然なばらつきを作りつつ、極端な大小を防ぐ。 |
| **物理マテリアル** | 反発係数: `0.05`, 密度: `0.5`, 摩擦: `0.05`, 空気抵抗: `0.001`, 静止摩擦: `0.5` | `config.js` (`PHYSICS_CONFIG`)<br>ガラスや石のような重みと、表面が滑る質感を演出する。 |
| **めり込み許容 (slop)**| `0.01` | `config.js` (`PHYSICS_CONFIG`)<br>宝石同士の重なりによる「グニャッ」としためり込みを最小化。 |
| **エンジン計算精度** | `positionIterations: 10`<br>`velocityIterations: 8` | `physics.js`<br>デフォルトより高く設定し、硬い質感とすり抜け防止を実現。 |
| **接続(連鎖)判定距離** | 宝石間の中心距離 `< (半径1 + 半径2 + 20)` | `config.js` (`CONNECTION_THRESHOLD`)<br>見た目よりも少しだけ離れていても繋がる猶予距離。 |
| **Delta(FPS低下)補正** | 最大値 `33ms` (30fps相当) でクランプ。負の値は `16.6ms` にフォールバック | `physics.js`<br>処理落ち時のDelta増大による物理トンネリング（すり抜け）を防止。 |

## 3. 演出・サウンド層の動的計算ロジック

### 3.1. 視覚エフェクトとカメラ演出
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **レーザーアニメーション** | 1階層あたりの伝播時間 = `100ms` | `config.js` (`LASER_ANIMATION_MS`) |
| **盤面レベルインフレ係数** | `levelMultiplier = 1 + (Level - 1) * 0.1` | `renderer.js`<br>レベルアップに伴い演出の反動（強度）を強めるための係数。 |
| **レーザー到達時の沈み込み** | `Math.max(0.5, 0.85 - (levelMultiplier - 1) * 0.05)`<br>※下限 `0.5` 倍まで縮小 | `renderer.js`<br>高レベルほどレーザー到達時に宝石が深く沈み込む。 |
| **レーザー到達時のフラッシュ強度** | `Math.min(0.9, 0.6 + (levelMultiplier - 1) * 0.1)`<br>※上限アルファ値 `0.9` | `renderer.js`<br>高レベルほど発光が激しくなる。 |
| **タップ起点の脈打ち幅** | `scale *= 1 + (0.05 * levelMultiplier * Math.sin(time / 100))` | `renderer.js`<br>特異点となる宝石が時間経過で呼吸するように脈打つ。 |
| **パーティクル発生数** | 通常スパーク: `Math.floor(1 * levelMultiplier)`<br>バーストスパーク: `Math.floor(10 * levelMultiplier)` | `renderer.js` / `effects.js`<br>レベルに応じて破壊時の火花の数が増加。 |
| **画面揺れ (Screen Shake)** | クラス `.shake` を `500ms` 付与 | `ScreenEffects.js`<br>連鎖終了時の衝撃。 |
| **波紋 (Ripple) アニメーション** | 発生から `350ms` で消滅<br>前半(0〜55%): スケール `0→0.8`、アルファ `1.0→0.8`<br>後半(55〜100%): スケール `0.8→1.0`、アルファ `0.8→0` | `ScreenEffects.js` |
| **フローティング数値** | 表示期間 `2.4s`<br>X軸ランダムブレ: `-20px` 〜 `+20px`<br>表示オフセット: DAMAGE(`-20,-20`), HEAL(`20,20`), EXP(`0,40`) | `ScreenEffects.js` |

### 3.2. サウンド・BGM・オーディオビジュアライザ
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **SE連鎖ピッチ上昇** | `playbackRate = Math.min(2.0, 1.0 + (ChainCount * 0.05))` | `LaserEffect.js` / `SoundManager.js`<br>連鎖が繋がるごとに音が甲高くなる（最大2倍、15連鎖相当でカンスト）。 |
| **BGMフェード（クロスフェード）** | BGM状態遷移時のフェード期間 = `1.5s`<br>ボリューム比率（LIFE変動）追従 = `0.1s` | `SoundManager.js`<br>Pinch/Fever/Normalの切り替えを滑らかに行う。 |
| **BGMステイシスフィルター** | `isStasis = true` の場合、ローパスフィルター周波数を `800Hz` に落とす（通常時は `22050Hz`）。遷移時間は `0.5s` | `SoundManager.js`<br>コンフィグ画面などでBGMがこもった音になる表現。 |
| **ビジュアライザ 効率ターゲット** | `VisualTarget = 0.5 + 0.5 * ((Average - Count) / Average)` | `Visualizer.js`<br>色ごとの平均破壊数からの差分を算出し、±50%のブレ幅でX座標の基本位置を決定。 |
| **ビジュアライザ 振幅（WAVE）** | `(Width * 0.015) + (Width * 0.02) * AudioVol + (Width * 0.03) * (Spike / 4.0)` | `Visualizer.js`<br>基本の波形に「BGMの音量(FFT)」と「破壊時のスパイク」を掛け合わせて振幅を決定。FFT値は `val^1.2` で重み付け。 |
| **ビジュアライザ 脈動（BLOCK）** | `Math.sin(time*2 + i)*0.015 + Math.sin(time*3.5 - i)*0.015`<br>音量脈動: `AudioVol * 0.08 * Math.sin(time*15 + i*2)` | `Visualizer.js`<br>LITEモード用のサイバーメーターのランダムな揺らぎ。 |
