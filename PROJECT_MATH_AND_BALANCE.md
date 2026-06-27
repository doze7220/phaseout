# PROJECT_MATH_AND_BALANCE.md
最終更新: 2026-06-24 (v0.26.52 時点)

本ドキュメントは、ゲームを構築するためのすべての計算式、固定値、マジックナンバーを集約した資料です。コアロジックから演出、サウンドに至るまで、プレイの手触りを構成する数値を完全に網羅し、調整の際のSingle Source of Truthとして機能します。

## 1. コアロジック層（ライフ・スコア・EXP）

### 1.1. スコア・LIFE・EXP関連の基本計算式
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **SCORE RATE (レート)** | `Level 1` = 1.5<br>`Level 2` = 15<br>`Level 3` = 310<br>`Level 4以降` = `310 * (10 ^ (Level - 3)) * (1.5 ^ (Level - 3))` | `config.js` (`getScoreRate()`)<br>レベルが上がるごとに劇的なインフレを引き起こす。 |
| **獲得スコア** | `RATE * 連鎖ボーナス * 階層ボーナス`<br>※連鎖ボーナス = `(連鎖数 - 2) ^ 2` (連鎖数≧3の場合、2以下は1)<br>※階層ボーナス = `(1 + (Depth / 10))` (Depth = 連鎖の最大深さ) | `logic.js`<br>連鎖数による二次関数的な伸びに加え、消し方の形(Depth)による倍率が掛かる。 |
| **スコア表示の桁数制限** | PC版とモバイル版で上限桁数（`SCORE_DIGIT_LIMITS`）を設定。超過時は単位（万、億等）付き表記に自動省略される。 | `config.js` (`AppConfig.SCORE_DIGIT_LIMITS`)<br>ブラックフェイズポップアップ等でもこの制限が適用される。 |
| **LIFE 自然減少量** | `0.5 * (1.15 ^ (Level - 1))` (1フレームあたり)<br>※秒間減少量 = `1フレーム減少量 * 60` | `config.js` (`INITIAL_DECAY`, `DECAY_MULTIPLIER`) |
| **LIFE タップ消費量** | `50 * (1.15 ^ (Level - 1))` | `config.js` (`TAP_COST`, `DECAY_MULTIPLIER`) |
| **LIFE 回復量 (消去時)** | `10 * 連鎖数`<br>※最大値 `MAX_LIFE` (3000) でクランプ | `config.js` (`RESTORE_BASE`) |
| **次レベル必要経験値** | `10 * (1.5 ^ (Level - 1))` (切り捨て) | `config.js` (`BASE_REQUIRE_EXP`, `EXP_CURVE_MULTIPLIER`) |
| **獲得経験値 (基本)** | `Round(連鎖数 * (CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY / (連鎖数 + CORE_MATH_CONFIG.EXP_BASE_EFFICIENCY)))` | `logic.js`<br>`100` は大チェインになるほど1ブロックあたりの経験値効率が減衰するマジックナンバー。 |
| **獲得経験値 (色減衰)** | `Ceil(基本経験値 * (最小破壊色カウント / 該当色破壊カウント))` | `logic.js`<br>特定の色だけを偏って消すと獲得EXPが減少するバランス調整。 |

### 1.2. PhaseShift System (フェイズシフト)
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **ゲージ加算 (フルリンク時)** | `(Base(100) + Chain(2 × n) + PrismDepth(15 × (1 + prismDepth / 10))) * (0.8 ^ ホワイトフェイズ通過回数)` | `logic.js` / `PhaseManager.js`<br>※加算は `prismDepth >= 6`（全7色リンク達成時）のみ行われる。<br>※ホワイトフェイズの完了（通過）回数に応じて獲得量が指数関数的に減衰する（初回突入時は0乗のため減衰なし）。ブレイクゲージへの加算には減衰は適用されない。 |
| **ゲージ減衰 (通常時)** | `DECAY_BASE(0.5) + DECAY_ACCEL_COEFF(2.0) * ((Current / Max) ^ DECAY_POWER(2)) * SHIFT_DECAY_MULT` | `PhaseManager.js`<br>ゲージが溜まるほど減衰速度が加速する。<br>コンフィグのシフト減衰倍率が適用される。 |
| **ゲージ減算 (ブレイク)** | `(通常時の減衰式と同様の割合計算) * 1000 * (deltaTime / 1000) * SHIFT_DECAY_MULT` | `PhaseManager.js`<br>ホワイトフェイズ中のプリズムリンクで蓄積し、全フェイズで常に減算され続ける。 |
| **ゲージ減衰 (White Phase)**| `(WHITE_DECAY_BASE + WHITE_DECAY_ACCEL_COEFF * (t / WHITE_DECAY_TIME_DIVISOR)^WHITE_DECAY_POWER) * SHIFT_DECAY_MULT` (毎秒) | `PhaseManager.js`<br>時間 `t` とともに二次関数的に加速するサバイバル仕様。<br>ゲージが0になると自動的に通常フェイズへ戻る。 |
| **臨界点 (Max)** | `GAUGE_MAX = 1000` | `config.js` (`PHASE_SHIFT_MATH`)<br>到達時、`PHASE_WHITE_ENTER` へ自動移行する。 |
| **ブレイクゲージ回復 (Black Phase)** | `BLACK_TAP_RESTORE (30)` | `logic.js` / `config.js` (`PHASE_SHIFT_MATH`)<br>ブラックフェイズ中の1タップにつき加算され、ブラックフェイズの寿命を押し留める（上限1000）。 |
| **ブレイクゲージ減衰 (Black Phase)** | `(BLACK_DECAY_BASE + BLACK_DECAY_ACCEL_COEFF * (t / BLACK_DECAY_TIME_DIVISOR)^BLACK_DECAY_POWER) * SHIFT_DECAY_MULT` (毎秒) | `PhaseManager.js`<br>時間 `t` とともに二次関数的に加速するサバイバル仕様。<br>ゲージが0になると自動的にブラックフェイズが終了する。 |

## 2. 物理エンジン層

### 2.1. 物理挙動・判定・各種クランプの隠しパラメータ
| 項目 | 設定値 / クランプ処理 | 関連変数・ファイル |
| :--- | :--- | :--- |
| **宝石サイズ生成** | `Mean: 40`, `StdDev: 5` (正規分布)<br>`STEP: 5` ごとに丸め<br>サイズ制限: `Min: 25`, `Max: 70` | `config.js` / `physics.js`<br>正規分布を用いて自然なばらつきを作りつつ、極端な大小を防ぐ。 |
| **物理マテリアル** | 反発係数: `0.05`, 密度: `0.5`, 摩擦: `0.05`, 空気抵抗: `0.001`, 静止摩擦: `0.5` | `config.js` (`PHYSICS_CONFIG`)<br>ガラスや石のような重みと、表面が滑る質感を演出する。 |
| **めり込み許容 (slop)**| `0.01` | `config.js` (`PHYSICS_CONFIG`)<br>宝石同士の重なりによる「グニャッ」としためり込みを最小化。 |
| **エンジン計算精度** | `positionIterations: 10`<br>`velocityIterations: 8` | `physics.js`<br>デフォルトより高く設定し、硬い質感とすり抜け防止を実現。 |
| **接続(連鎖)判定距離** | 宝石間の中心距離 `< (半径1 + 半径2 + 20)` | `config.js` (`CONNECTION_THRESHOLD`)<br>見た目よりも少しだけ離れていても繋がる猶予距離。 |
| **Delta(FPS低下)補正** | 最大値 `33ms` (30fps相当) でクランプ。負の値は `16.6ms` にフォールバック | `config.js` (`PHYSICS_MATH_CONFIG.MAX_DELTA_MS`, `FALLBACK_DELTA_MS`)<br>処理落ち時のDelta増大による物理トンネリング（すり抜け）を防止。 |

## 3. ブラックフェイズの仕様と計算式

ブラックフェイズ固有のサバイバル仕様や無限チェインに関する計算式です。

| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **サバイバル減衰（動的加速減衰）** | `decayAmount = BLACK_PHASE_CONFIG.BASE_DECAY_RATE + (elapsedTime^2 * BLACK_PHASE_CONFIG.DECAY_ACCEL_FACTOR)` | `PhaseManager.js`<br>ブラックフェイズ中は経過時間(`elapsedTime`)に応じてブレイクゲージの減衰量が二次関数的に加速し、生存難易度が上昇し続ける。 |
| **タップによるゲージ回復量** | `recovery = MAX_RECOVERY * (0.8 ^ (blackPhaseCount - 1))` | `logic.js`<br>1プレイ中のブラックフェイズ到達回数（`blackPhaseCount`）が増えるごとに、タップ時の回復量が0.8のべき乗で減少（サバイバル減衰）する。 |
| **特異点の引力（アトラクター）** | `force = BLACK_PHASE_CONFIG.ATTRACTOR_FORCE * (1.0 + (distance / CanvasWidth) * 1.5)` | `logic.js`<br>画面端（距離が遠い）ほど引力が強くなる補正をかけ、全宝石を中央の特異点へ強制的に吸い込ませる。 |
| **無限チェインスコア計算** | レベル倍率（`RATE`）や連鎖ボーナス（`^2`）など基本計算のみ適用 | `score.js`<br>ホワイトフェイズのような大チェイン減衰や、通常時の色偏り減衰（EXP）は適用されず、純粋な二次関数でスコアが青天井で増加する。 |
| **サバイバル機構によるゲージ獲得量減衰** | `addAmount = baseAmount * (0.8 ^ blackPhaseCount)` | `PhaseManager.js`<br>ブラックフェイズ通過回数に応じて、次回突入するためのブレイクゲージ獲得量が指数関数的に減衰する。 |
| **宝石補充制御モデル** | 確率: `SPAWN_RATE.BLACK = 0.8`<br>間隔: `SPAWN_INTERVAL_FRAMES.BLACK = 10` | `physics.js` / `config.js`<br>ブラックフェイズ中は宝石の補充頻度および確率が低下し、吸い込みと合わせて画面上の宝石密度が管理される。 |

## 4. 演出・サウンド層の動的計算ロジック

### 4.1. 視覚エフェクトとカメラ演出
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **レーザーアニメーション** | 1階層あたりの伝播時間 = `100ms` | `config.js` (`LASER_ANIMATION_MS`) |
| **盤面レベルインフレ係数** | `levelMultiplier = 1 + (Level - 1) * 0.1` | `renderer.js`<br>レベルアップに伴い演出の反動（強度）を強めるための係数。 |
| **レーザー到達時の沈み込み** | `Math.max(SHRINK_MIN, SHRINK_BASE - (levelMultiplier - 1) * SHRINK_LEVEL_MULTI)`<br>※下限 `0.5` 倍まで縮小 | `config.js` (`LASER_EFFECT_CONFIG`)<br>高レベルほどレーザー到達時に宝石が深く沈み込む。 |
| **レーザー到達時のフラッシュ強度** | `Math.min(FLASH_MAX, FLASH_BASE + (levelMultiplier - 1) * FLASH_LEVEL_MULTI)`<br>※上限アルファ値 `0.9` | `config.js` (`LASER_EFFECT_CONFIG`)<br>高レベルほど発光が激しくなる。 |
| **タップ起点の脈打ち幅** | `scale *= 1 + (PULSE_MULTI * levelMultiplier * Math.sin(time / PULSE_SPEED))` | `config.js` (`LASER_EFFECT_CONFIG`)<br>特異点となる宝石が時間経過で呼吸するように脈打つ。 |
| **パーティクル発生数** | 通常スパーク: `Math.floor(SPARK_COUNT_MULTI * levelMultiplier)`<br>バーストスパーク: `Math.floor(BURST_SPARK_COUNT_MULTI * levelMultiplier)` | `config.js` (`LASER_EFFECT_CONFIG` / `PARTICLE_CONFIG`)<br>レベルに応じて破壊時の火花の数が増加。 |
| **画面揺れ (Screen Shake)** | Canvas全体のtranslateによる揺らし | `config.js` (`SCREEN_SHAKE_CONFIG.SHAKE_DURATION_MS`)<br>連鎖終了時の衝撃。 |
| **波紋 (Ripple) アニメーション** | 発生からフェードで消滅 | `config.js` (`RIPPLE_CONFIG.RIPPLE_DURATION_MS`) |
| **フローティング数値** | 表示オフセット: DAMAGE(`-20`), HEAL(`20`), EXP(`40`) | `config.js` (`POPUP_EFFECT_CONFIG.FLOAT_TEXT_OFFSET`, `FLOAT_TEXT_DURATION_MS`) |

### 4.2. サウンド・BGM・オーディオビジュアライザ
| 項目 | 計算式 / ロジック | 関連変数・ファイル |
| :--- | :--- | :--- |
| **SE連鎖ピッチ上昇** | `playbackRate = Math.min(SE_PITCH_MAX, 1.0 + (ChainCount * SE_PITCH_STEP))` | `config.js` (`SOUND_MATH_CONFIG`)<br>連鎖が繋がるごとに音が甲高くなる。 |
| **BGM状態判定 (Pinch / Fever)** | Pinch: `LIFE < MaxLife * 0.15`<br>Fever: `盤面色数 >= 最大解放可能色数` (ホワイトフェイズ突入とは無関係) | `logic.js` (`determineCurrentBgmState`)<br>現在の状態に応じたBGM状態を決定し、遷移時にクロスフェードを要求する。 |
| **BGMフェード（クロスフェード）** | BGM状態遷移時のフェード期間、ボリューム比率追従 | `config.js` (`SOUND_MATH_CONFIG.BGM_FADE_DURATION_SWITCH`, `BGM_FADE_DURATION_RATIO`)<br>Pinch/Fever/Normalの切り替えを滑らかに行う。 |
| **BGMステイシスフィルター** | `isStasis = true` の場合、ローパスフィルター周波数を落とす | `config.js` (`SOUND_MATH_CONFIG.STASIS_FILTER_FREQ`, `NORMAL_FILTER_FREQ`)<br>コンフィグ画面などでBGMがこもった音になる表現。 |
| **ビジュアライザ 効率ターゲット** | `VisualTarget = 0.5 + 0.5 * ((Average - Count) / Average)` | `config.js` (`VISUALIZER_MATH_CONFIG.TARGET_EASING`)<br>色ごとの平均破壊数からの差分を算出し、±50%のブレ幅でX座標の基本位置を決定。 |
| **ビジュアライザ 振幅（WAVE）** | 基本の波形に「BGMの音量(FFT)」と「破壊時のスパイク」を掛け合わせて振幅を決定 | `config.js` (`VISUALIZER_MATH_CONFIG.WAVE_AMP_BASE`, `WAVE_AMP_AUDIO_MULTI`, `WAVE_POWER`) |
| **ビジュアライザ 脈動（BLOCK）** | サイバーメーターのランダムな揺らぎ、音量脈動 | `config.js` (`VISUALIZER_MATH_CONFIG.BLOCK_PULSE_SPEED_1`, `BLOCK_PULSE_AMP`等) |
