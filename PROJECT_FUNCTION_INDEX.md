# PROJECT_FUNCTION_INDEX.md

# PHASE OUT: Function & Component Index
> 最終更新バージョン: v0.19.0

最終更新: 2026-06-14 (v0.19.0 時点)

> **【重要】v0.9.8 以降の Canvas 完全移行 (Phase 4) に伴い、DOMに関連する各種表示ロジックは廃止または統合されました。現在全てのUI描画は `MasterRenderer.js` 配下の各Renderer（ResultRenderer 等）および各Scene（ConfigScene 等）へ統合されています。v0.12.2 時点で DOM 操作は完全に廃止済みです。**

---

#### 1. config.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GameState#reset | L108 | なし | なし | physics.jsのinitPhysics | ゲーム初期化時 | Write(全般) | `GameState` の全プロパティを初期状態にリセットする。 |
| saveConfig | - | なし | なし | ConfigScene.js, config.js(初期化時) | 設定変更時 | なし | 現在の設定値を `changelog.js` の最新バージョン情報とともに単一JSON(`phaseout_config`)として `localStorage` に保存する。 |

| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| COLOR_CONFIG | L77 | 各色の名前、HEXコード、有効/無効フラグ、刻印設定(symbolKey, symbolColor) | プロジェクト全体のベースとなる7色の定義。 |
| THEME_COLORS | L87 | キーバリューのカラーマップ | `COLOR_CONFIG`から生成される各色のHEX値マップ。描画時の参照用。 |
| activeColors (廃止) | - | - | 旧定数。v0.19.0で廃止され `GameState.activeColors` での動的状態管理へ移行。 |
| GRAPHICS_CONFIG | - | GEM_STYLE, GEM_OUTLINE, SHOW_SYMBOL, SYMBOL_ALPHA | 宝石の描画スタイル（H.LIGHT/OVERLAY/FLAT）、強調表示（GEM_OUTLINE）、刻印シンボルの表示設定などを定義する。 |
| AppConfig | - | EFFECT_LEVEL, DEFAULT_SETTINGS 等 | ゲームの基本設定（音量やエフェクトレベル等）および端末ごとの初期設定（`DEFAULT_SETTINGS`）を保持する。 |
| EFFECT_MATH_CONFIG | - | PARTICLE, RESULT_GLITCH, SHAKE_DURATION_MS 等 | 破片パーティクルの生成パラメータ(PARTICLE)や、画面揺れ、グリッチ演出(RESULT_GLITCH)等のエフェクト演出に関する数学的パラメータや描画設定値を定義する。 |

#### 1.5. StageConfig.js
| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| DEFAULT_STAGE | L8 | MAX_ACTIVE_COLORS, INITIAL_COLORS, UNLOCKABLE_COLORS | 制限なしのフル解放状態デフォルトステージ定義。Lv1以降は常に7色アクティブ。 |
| STAGE_DATA | L20 | DEFAULT, STAGE_01 の各ステージ定義 | 全ステージの色解放データマップ。STAGE_01はLv1、4色スタート、Lv5以降に段階解放。 |

#### 1.6. StageManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| StageManager#init | - | stageId | なし | PlayScene.init() | ゲーム開始時 | なし | 指定ステージIDのSTAGE_DATAを読み込み内部に保持する。存在しないIDはDEFAULTにフォールバック。 |
| StageManager#setupActiveColors | - | なし | なし | physics.js(initPhysics内) | GameState.reset()直後 | Write(activeColors, colorDestroyCounts, totalScorePerColor) | GameState.activeColorsをINITIAL_COLORSのHEX配列で初期化し、colorDestroyCounts / totalScorePerColorも一括設定する。 |
| StageManager#onLevelUp | - | newLevel | なし | logic.js(finalizeDestruction) | レベルアップ時 | Write(activeColors, colorDestroyCounts, totalScorePerColor) | MAX_ACTIVE_COLORS[newLevel]を確認し、格の拡大時はUNLOCKABLE_COLORSから未アクティブの色を1つ選出してactiveColorsに追加する。 |
| StageManager#getActiveColors | - | なし | string[] | physics.js(createGem) | 宝石生成時 | Read(activeColors) | 現在のGameState.activeColors（HEX配列）を返す。 |

#### 2. audioConfig.js
| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| AUDIO_SETTINGS | L2 | BGM_VOLUME, SE_VOLUME, VOICE_VOLUME | 各カテゴリのマスター音量を定義する。 |
| AUDIO_ASSETS | L8 | BGM, SE, VOICE の各音声ファイルパスと個別音量 | 再生用キーと対応する `src` および `volume` を定義する。 |

#### 2.1. InputManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| InputManager#init | - | targetElement | なし | main.js | 初期化時 | なし | 指定要素にイベントリスナを登録する。 |
| InputManager#getLogicalPosition | - | clientX, clientY | Object | _handlePointerDown等 | タップ時 | なし | ブラウザの実座標をCanvasの論理座標に変換し、余白を考慮して計算する。 |
| InputManager#onPointerDown | - | callback, priority | なし | main.js等 | 初期化時 | なし | 優先度付きでポインターダウン時のコールバックを登録する。 |

#### 2.1.1. UIManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| UIManager#updateButtonRect | - | id, layer, x, y, width, height | なし | 各シーン等 | 描画時 | なし | UIボタンのヒットエリア座標を更新・登録する。 |
| UIManager#setButtonCallback | - | id, callback | なし | main.js等 | 初期化時 | なし | UIボタンがクリックされた時の処理を登録する。 |
| UIManager#deactivateButton | - | id | なし | 各シーン等 | 非表示時 | なし | ボタンのヒット判定を無効化する。 |
| UIManager#handlePointerDown | - | pos, originalEvent | boolean | InputManager | タップ時 | なし | layer順にヒット判定を行い、処理された場合はtrueを返して貫通を防ぐ。 |

#### 1.5. LayoutConfig.js
| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| LAYOUT_CONFIG | - | GAME_AREA, UI, GAUGE, POPUPS, RESULT_SCENE 等 | 各種UIの論理座標・レイアウトや、リザルト画面の全描画座標・オフセット・右寄せ設定を定義する。 |

#### 2.2. SpriteCacheManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SpriteCacheManager#preloadAssets | - | なし | Promise | main.js | 初期化時 | なし | 非同期で画像アセットを読み込む。 |
| SpriteCacheManager#generateAllCaches | - | なし | なし | main.js | 初期化/設定変更時 | なし | 定義されている全ての形状と色のスプライトキャッシュ（無効化されたものも含む）をグローバルインデックスをキーとして事前生成しメモリに保持する。 |
| SpriteCacheManager#get | - | key | Canvas | 描画処理 | 描画時 | なし | キャッシュからCanvasを取得する。 |
| SpriteCacheManager#getGem | - | shape, colorId | Canvas | renderer.js等 | 描画時 | なし | 宝石スプライトのCanvasを取得する。 |
| SpriteCacheManager#_drawRichGem | - | ctx, x, y, radius, shape, colorDef | なし | SpriteCacheManager#generateAllCaches | キャッシュ生成時 | なし | FLATスタイル時は基本図形を描画し、RICHスタイル時は画像ベースのティント着色を行う。またGEM_OUTLINE設定に応じ、画像由来の単色シルエットから抽出した5pxのアウトラインおよび発光（グレア）の合成描画も行う。 |
| SpriteCacheManager#_applySymbolStamp | - | ctx, x, y, radius, colorConfig | なし | SpriteCacheManager#_drawRichGem | キャッシュ生成時 | なし | 指定されたシンボル画像を読み込み、色を合成して宝石キャンバスの中央に焼き付ける。 |

#### 2.3. MasterRenderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| MasterRenderer#init | - | canvas | なし | main.js | ゲーム初期化時 | なし | Canvas要素を受け取り、2D Contextを取得してレンダーパイプラインを初期化する。 |
| MasterRenderer#registerLayer | - | layerId, callback | なし | 各種描画モジュール | システム構築時 | なし | 指定した層(1〜12)に描画コールバックを登録する。 |
| MasterRenderer#registerGlobalUpdate | - | callback | なし | renderer.js等 | システム構築時 | なし | 描画前に状態更新（スコア等）を行うコールバックを登録する。 |
| MasterRenderer#registerPreRender | - | callback | なし | ScreenEffects等 | システム構築時 | なし | 全体描画前に行う処理（画面揺れの適用など）のコールバックを登録する。 |
| MasterRenderer#registerPostRender | - | callback | なし | ScreenEffects等 | システム構築時 | なし | 全体描画後に行う処理（フィルタ解除や状態リセットなど）のコールバックを登録する。 |
| MasterRenderer#setLayerFilterCallback | - | callback | なし | renderer.js等 | システム構築時 | なし | 特定のレイヤー描画時にコンテキストへフィルタ（ステイシス時など）を適用するコールバックを登録する。 |
| MasterRenderer#renderAll | - | なし | なし | (内部イベントフック) | 毎フレーム描画時 | なし | 全12層を順番に呼び出して描画する。 |
| MasterRenderer#start | - | なし | なし | main.js等 | 初期化時 | なし | 描画ループ(requestAnimationFrame)を開始する。 |
| MasterRenderer#stop | - | なし | なし | 各種 | 停止時 | なし | 描画ループを停止する。 |
| MasterRenderer#loop | - | time | なし | (内部) | 毎フレーム | なし | SceneManager.needsDeltaResetによるTime Spike（初期フレームの巨大delta）を検知・正規化し、グローバル更新およびレイヤー描画を実行する。 |

#### 2.4. RippleManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| RippleManager#createRipple | - | x, y | なし | effects.js(createRipple) | タップ時 | なし | 論理座標(x, y)に波紋エフェクトを発生させる。 |
| RippleManager#updateAndDraw | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 発生中の波紋を第11層(SYSTEM_TOP)へ描画し、時間経過で消去する。 |

#### 2.5. SceneManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SceneManager#changeScene | - | newSceneInstance, useFade | なし | main.js等 | 画面切り替え時 | なし | 非同期トランジション（Black Out / Black Inおよび暗転中のグリッチ波線描画、合計1600ms）を伴って画面を入れ替える。useFade=falseで即時遷移も可能。 |
| SceneManager#pushScene | - | newSceneInstance | なし | logic.js等 | 画面加算時 | なし | スタック上に新シーンを重ねて積む。init()の完了後に needsDeltaReset=true を立てTime Spikeを防止する。 |
| SceneManager#popScene | - | なし | なし | UIイベント等 | 画面戻る時 | なし | スタック最前面のシーンを破棄し前の画面に戻る。pop後に needsDeltaReset=true を立てTime Spikeを防止する。 |
| SceneManager#update | - | deltaTime | なし | MasterRenderer | 毎フレーム更新時 | なし | スタック最前面のシーンの更新処理(update)を呼び出す。 |
| SceneManager#draw | - | ctx, layerId | なし | MasterRenderer | 毎フレーム描画時 | なし | スタック内の全シーンの下から順に描画処理(draw)を呼び出す。 |
| SceneManager#handleInput | - | pointerInfo, e | boolean | InputManager | タップ時 | なし | スタック最前面のシーンに入力を伝播し、必要なら消費する。 |

#### 2.6. Scene Classes (BaseScene, TitleScene, ConfigScene, PlayScene, ResultScene, BootScene)
| クラス名 | メソッド | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| BaseScene | constructor | - | - | 各シーンクラス | インスタンス化時 | isActiveフラグをfalse、isTransitioningをtrueで初期化する。 |
| BaseScene#init | - | なし | なし | SceneManager#pushScene | シーンロード時 | isActiveフラグをtrueにする。各シーンでオーバーライドしてUI生成等を行う。 |
| BaseScene#onFadeInStart | - | なし | なし | SceneManager#update | トランジション（FADE_IN）開始時 | isTransitioningフラグをfalseにして時間を動かす。BGMの再生等、画面が明るくなり始める瞬間に同期させたい処理を記述する。 |
| BaseScene#update | - | deltaTime | なし | SceneManager#update | 毎フレーム更新時 | 各シーンのロジック・アニメーション更新処理（オーバーライド用）。派生クラスで if (this.isTransitioning) return; でガードする。 |
| BaseScene#draw | - | ctx | なし | SceneManager#draw | 毎フレーム描画時 | 各シーンの描画処理（オーバーライド用）。 |
| BaseScene#handleInput | - | pos | boolean | SceneManager#handleInput | タップ時 | 入力処理（オーバーライド用）。 |
| BaseScene#destroy | - | なし | なし | SceneManager#popScene | 破棄時 | 終了処理・クリーンアップ（オーバーライド用）。 |
| PlayScene | init, onFadeInStart, update, draw, handleInput, destroy | - | - | SceneManager | ゲームプレイ中 | 物理演算のセットアップ(initPhysics)、入力や描画の連携を行う。 |
| PlayScene#update | - | deltaTime | なし | SceneManager#update | 毎フレーム更新時 | isActiveかつisTransitioningがfalseな間のみ、物理エンジン（updatePhysics）を更新しゲームを進行させる。 |
| PlayScene#onFadeInStart | - | なし | なし | SceneManager#update | トランジション（FADE_IN）開始時 | BGMを再生する。Time Spike防止のためSceneManagerへデルタリセットを要求する。 |
| PlayScene#destroy | - | なし | なし | SceneManager | パズル終了時 | 物理エンジンの破棄(destroyPhysics)とイベント解除を行う。 |
| ResultScene | init, onFadeInStart, update, draw, handleInput, destroy | - | - | SceneManager | ゲームオーバー時 | ResultRendererを起動してCanvasベースのリザルト画面を表示する。 |
| BootScene | init, update, draw, handleInput, destroy | - | - | SceneManager | 初期起動時 | システム起動タイポグラフィ演出を描画し、初回タップでグリッチエフェクトを伴ってタイトル画面へ遷移する。 |
| TitleScene | init, update, draw, handleInput, destroy | - | - | SceneManager | タイトル画面表示時 | 全画面タップ(FullScreenTap)による開始と、TAP TO STARTの明滅アニメーション等のUIを管理する。 |
| ConfigScene | init, update, draw, handleInput, destroy | - | - | SceneManager | 加算ロード時 | 4タブ構成のコンフィグモーダル構築、各種設定・宝石強調表示・刻印の即時適用、ステイシス管理を行う。 |

#### 3. main.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| (無名関数) | L20 | なし | なし | DOMContentLoaded | ロード時 | Read(engine, displayScore等) | Canvas・SceneManager・InputManager等の初期化とゲームループを起動する。DOM由来の波紋生成(createRipple)等のレガシー処理は削除済み。 |

#### 3. logic.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| checkGameOver | L15 | なし | なし | pointerDownHandler, beforeUpdateHandler | タップ時, beforeUpdate内 | Read(isGameOver), Write(isGameOver) | ライフが0以下になった場合にゲームオーバー状態へ移行する。 |
| setupGameLogic | L56 | engine, render | なし | physics.jsのinitPhysics | 初期化時 | Read/Write(life, level等) | タップ入力や時間経過によるライフ減少のイベントリスナー・フックを登録する。 |
| setupGameLogic#beforeUpdateHandler | L106 | なし | なし | Matter.Events | 毎物理ステップ更新前 | Write(playTimeMs, life) | GameState.playTimeMsへ固定ステップ（16.6ms）を加算し、レベルに応じたLIFEの自然減少を実行し、ゲームオーバーを判定する。 |
| removeGameLogic | L166 | なし | なし | physics.jsのinitPhysics | リセット時 | Read(render, engine) | 登録済みのイベントリスナーやフックを解除する。廃止されたCanvasの判定を排除しハンドラ残留・多重発火を防ぐ。 |
| areGemsTouching | L177 | g1, g2 | boolean | getAdjacencyList | タップ時(startChain経由) | なし | 宝石同士の距離を判定し接触・近接しているかを返す。 |
| getAdjacencyList | L184 | activeGems | Map | startChain | タップ時 | なし | 画面上の全宝石の隣接リストを生成する。 |
| startChain | L201 | startGem | なし | pointerDownHandler | タップ時 | Read(GEMS), Write(isAnimating) | BFSで同色の繋がっている宝石を探索し、レーザー演出を開始する。 |
| finalizeDestruction | L249 | chain | なし | startChain(コールバック) | レーザー完了後 | Read/Write(actualScore, life, level, exp, totalExp, colorDestroyCounts等) | 宝石を削除し、スコア・経験値の獲得計算、レベルアップ判定、LIFE回復を行う。 |

#### 4. physics.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| initPhysics | L10 | なし | なし | main.js等 | 初期化時 | Write(engine, render, runner等) | Matter.jsエンジンの初期化、壁生成、ゲームループ(requestAnimationFrame)の開始を行う。リザルト画面移行後の完全停止・スキップ制御も含む。 |
| updatePhysics | L76 | delta | なし | PlayScene | 毎フレーム更新時 | Read/Write | 物理エンジンの時間を進める。ステイシス中やゲームオーバー確定後は更新をスキップする。 |
| destroyPhysics | L110 | なし | なし | PlayScene | パズル終了時 | Write(engine, runner) | 物理エンジンの停止、ワールド内の全ボディや制約のクリア、およびイベントリスナーの解除を確実に行う。 |
| generateNormalRandom | L124 | mean, stdDev | number | createGem | 宝石生成時 | なし | 正規分布の乱数を生成する。 |
| pickGemShape | L132 | なし | string | createGem | 宝石生成時 | Read(GEMS) | 画面上の各形状の数をカウントし、設定された上限・ウェイトに基づいて次に生成する宝石の形状を決定する。 |
| createGem | L166 | x, y | gem (Body) | spawnInitialGems, finalizeDestruction | 宝石生成時 | なし | Matter.jsのBodyを生成し、色や形状のカスタムプロパティ（キャッシュキー用のcolorIdには全色グローバルインデックスを使用）を付与する。 |
| spawnInitialGems | L221 | なし | なし | initPhysics | 初期化時 | Read(engine), Write(GEMS) | 画面上部に初期配置の宝石を生成する。 |

#### 5. score.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| generateScoreData | L10 | value, maxDigits | Array | ScoreRenderer.js, ScreenEffects.js等 | UI描画時 | なし | スコアを計算し、桁スライスや単位情報を持たせたオブジェクト配列（トークン）を生成する。 |
| renderScoreToHtml | L49 | scoreData | String | (後方互換用) | - | なし | トークン配列からHTML文字列を生成する。現在はDOM出力は行わず、スコアはCanvas描画に統一済み。 |
| renderScoreToText | L81 | scoreData | String | - | - | なし | トークン配列から純粋な文字列を生成する。 |

#### 6. renderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| setupGemRenderer | - | GameState | なし | main.js | 初期化時 | Read(level), Write(displayScore) | MasterRendererへ各種フックを登録し、宝石描画とスコアのドラムロール処理を行う。 |

#### 6.1. ScoreRenderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| getScoreSprite | L169 | key | HTMLCanvasElement | drawHeaderUI, drawResultScoreToCanvas, createScoreCanvas | UI描画時 | なし | キャッシュからスコア・単位用スプライトを取得する。 |
| createScoreCanvas | L174 | scoreValue | Canvas | ScreenEffects.js等 | UI更新時 | なし | スコアのCanvasスプライトを結合したCanvas要素を生成する。 |
| drawHeaderUI | L214 | timerStr, decayStr, tapCostValue, scoreValue, rateValue | なし | GaugeManager.js | 毎フレーム | なし | タイマー、コスト、スコア、SCORE RATEなどを単一のヘッダーCanvasへ一括で描画し、自動スケール調整と2段組みレイアウトを行う。 |
| drawString | L241 | str, prefix, startX, startY, scale, letterSpacing | number | drawHeaderUI等 | 文字列描画時 | なし | スプライト文字を指定位置に描画し、描画幅を返す。 |
| measureString | L256 | str, prefix, scale, letterSpacing | number | drawHeaderUI等 | 描画前 | なし | スプライト文字列の描画幅をピクセル単位で事前計測する。 |
| measureScoreData | L267 | data, scale | number | drawHeaderUI等 | 描画前 | なし | パース済みスコアデータの描画幅を計測する。 |
| drawScoreData | L282 | data, startX, startY, scale | number | drawHeaderUI等 | 描画時 | なし | パース済みスコアデータを指定位置に描画する。 |
| drawResultScoreToCanvas | L390 | scoreValue | なし | scene.js | リザルト画面 | なし | リザルト用の詳細スコアをCanvasに描画する。 |

#### 6.2. UIComponents.js
| クラス名 | メソッド | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| BaseControl | constructor | x, y, width, height, options | - | 継承先 | インスタンス化時 | 座標、サイズ、ホバー/タップ状態管理、ヒット領域判定 (`contains`) の共通基底クラス。`contains` は `visible===false` または `alpha<=0` の場合に `false` を返し、非表示・透明UIによる入力ブロックを防ぐ。 |
| TextButton | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。角丸背景（オプション）、アクティブ状態（`isActive`）対応、枠線、中央テキスト描画。 |
| ImageButton | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。画像スケール描画。 |
| ToggleSwitch | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。角丸背景と丸ノブ付きデザイン。ON/OFF状態保持、色切り替え。 |
| Window | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。背景、枠線、タイトルバー描画。`isModal` フラグによる暗幕描画対応。 |
| FullScreenTap | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。全画面透明タップ判定用コントロール。 |
| ScrollArea | updateAndDraw | ctx, x, y, width, height, items, options | なし | 各種UIレンダラー | UI描画時 | 旧 `ScrollableTextUI`。擬似スクロールUIの描画と領域管理を行う。 |
| TabGroup | updateAndDraw, handleInput | ctx, pos | なし/boolean | 描画・UIイベント | UI描画/操作時 | `BaseControl` 継承。配列で渡されたタブの水平配置・選択状態の管理と描画を行う。 |

#### 6.3. ResultRenderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ResultRenderer#startResult | - | なし | なし | ResultScene | リザルト開始時 | Read | 最終スコアや各色別スコア・消去数を生成し初期化する。 |
| ResultRenderer#draw | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | Read | LayoutConfig.js(RESULT_SCENE)の設定に基づくHUDレイアウトでのリザルト描画、ドラムロール演出、および完了時のグリッチ演出処理を行う。桁数や単位不足に応じたパディングで右寄せ揃えも処理する。 |

#### 7. effects.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| clearAll | L19 | なし | なし | physics.jsのinitPhysics | リセット時 | なし | 各マネージャーに委譲し、全エフェクトをクリアする。 |
| clearLasers | L24 | なし | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | レーザーエフェクトをクリアする。 |
| showChainPopup | L32 | count, color | なし | LaserEffect.js等 | レーザー進行時 | なし | 連鎖ポップアップ表示を委譲する（ScreenEffects側でdepthをデフォルト引数として受け取る）。 |
| hideChainPopup | L40 | なし | なし | logic.js(finalizeDestruction) | 単発消去時等 | なし | 連鎖ポップアップの非表示を委譲する。 |
| showScorePopup | L44 | points | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | スコアポップアップ表示を委譲する。 |
| showFloatingNumber | L48 | text, type, x, y, delay | なし | logic.js | LIFE・EXP変動時 | なし | フローティング数値のCanvas描画オブジェクト生成をScreenEffectsへ委譲する。DOM操作は一切行わない。 |
| animateLaserLevels | L52 | levels, chainGems, glowColor, onComplete | なし | logic.js(startChain) | 連鎖開始時 | なし | レーザーアニメーション開始を委譲する。 |
| spawnParticles | L56 | x, y, colorStr | なし | logic.js(finalizeDestruction) | 宝石消去時 | なし | 破片パーティクル生成を委譲する。（EFFECT_LEVELにより間引きあり） |
| spawnSparks | L63 | x, y, colorStr, speedMult, count | なし | renderer.js | 脈打ち描画時 | なし | 火花パーティクル生成を委譲する。（FULL以外スキップ） |
| spawnBurstSparks | L69 | x, y, colorStr, speedMult, burstCount, sizeMult | なし | renderer.js | バースト時 | なし | バースト火花パーティクル生成を委譲する。 |
| showLevelUpPopup | L74 | oldLevel, newLevel, oldRate, newRate, oldCost, newCost | なし | logic.js(finalizeDestruction) | レベルアップ時 | なし | レベルアップ演出のCanvas描画をScreenEffectsへ委譲する。 |
| triggerScreenShake | L78 | なし | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | 画面揺れ演出を委譲する。 |
| triggerVisualizerSpike | L83 | color | なし | logic.js等 | 宝石破壊時 | なし | 指定色の波形ビジュアライザのスパイク演出をVisualizerへ委譲する。 |
| setupEffectsRenderer | L90 | なし | なし | main.js | 初期化時 | なし | MasterRendererへ各エフェクト層（第1・3・4・6・7・8・11・12層）の描画コールバックを登録する。 |
| togglePinchEffect | L142 | isPinch | なし | logic.js | ライフ変動時 | なし | ピンチ（画面赤ヴィネット）演出切替を委譲する。 |
| toggleStasisEffect | L146 | isStasis | なし | logic.js等 | ステイシス遷移時 | なし | ステイシスエフェクト切替を委譲する。 |
| playStageBgmSet | L154 | key | なし | PlayScene等 | BGMセット再生時 | なし | ステージ固有BGMセットの同時再生をSoundManagerへ委譲する。 |
| switchStageBgmState | L158 | state | なし | logic.js等 | 状態遷移時 | なし | BGMクロスフェードをSoundManagerへ委譲する。 |
| setStageBgmVolumeRatio | L162 | ratio | なし | logic.js等 | 音量調整時 | なし | BGMセットの音量比率変更をSoundManagerへ委譲する。 |
| playSceneBGM | L166 | key | なし | TitleScene, BootScene等 | BGM再生時 | なし | 単一シーンBGMの再生をSoundManagerへ委譲する。 |
| stopBGM | L170 | なし | なし | 各シーン等 | BGM停止時 | なし | BGM停止をSoundManagerへ委譲する。 |
| playSE | L174 | key, options | なし | logic.js等 | SE再生時 | なし | SEの再生をSoundManagerへ委譲する。 |
| playVoice | L178 | key | なし | logic.js等 | VOICE再生時 | なし | VOICEの再生をSoundManagerへ委譲する。 |

#### 8. ScreenEffects.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ScreenEffects#showChainPopup | - | count, color, depth | なし | effects.js(Facade) | レーザー進行時 | なし | Canvas上で「Chain数」「Depth(階層)」「数式」および「リアルタイムスコア(ドラムロール)」を描画するキューを登録する。 |
| ScreenEffects#hideChainPopup | - | なし | なし | effects.js(Facade) | 単発消去時等 | なし | 連鎖・数式ポップアップをフェードアウトさせる。 |
| ScreenEffects#showScorePopup | - | points | なし | effects.js(Facade) | 連鎖終了時 | なし | 獲得スコアポップアップをCanvas描画キューへ登録する。 |
| ScreenEffects#showLevelUpPopup | - | oldLevel, newLevel... | なし | effects.js(Facade) | レベルアップ時 | なし | 画面中央に大きくレベルアップ演出をCanvas描画で表示する。 |
| ScreenEffects#triggerScreenShake | - | magnitude | なし | logic.js等 | 大ダメージ時等 | なし | 画面揺れエフェクト(Canvas)の開始時刻と強度を設定する。 |
| ScreenEffects#applyShake | - | ctx | なし | MasterRenderer | PreRender時 | なし | 画面揺れ状態に応じてContext全体をランダムにtranslateし、画面全体を揺らす。 |
| ScreenEffects#showFloatingNumber | - | text, type, x, y, delay | なし | effects.js(Facade) | LIFE・EXP変動時 | なし | フローティングテキスト用スプライトを生成し、Canvas描画オブジェクトとして登録する。DOM操作は一切行わない。 |
| ScreenEffects#togglePinchEffect | - | isPinch | なし | effects.js(Facade) | ライフ変動時 | なし | ピンチ（赤ヴィネット）エフェクトのフラグを切り替える（Canvas描画）。 |
| ScreenEffects#toggleStasisEffect | - | isStasis | なし | effects.js(Facade) | ステイシス遷移時 | なし | ステイシス（白ヴィネット）エフェクトのフラグを切り替える（Canvas描画）。 |
| ScreenEffects#drawInGamePostEffects | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 第6層として、ステイシスやピンチのヴィネットエフェクトをCanvasに描画する。 |
| ScreenEffects#drawPopups | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 第8層として、登録されたポップアップ・フローティング数値をCanvasに一括描画する。 |

#### 8.1. GaugeManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GaugeManager#init | L22 | life | なし | logic.js | 初期化時 | なし | LIFEゲージおよびEXPゲージの内部アニメーション状態を初期化する。SVGやDOM操作は行わない。 |
| GaugeManager#triggerDamage | L106 | actualLife | なし | logic.js | タップ時 | なし | ダメージ時の赤ゲージアニメーションフラグを立てる。 |
| GaugeManager#triggerHeal | L124 | actualLife | なし | logic.js | 回復時 | なし | ヒール時の緑ゲージアニメーションフラグを立てる。 |
| GaugeManager#isDecayPaused | L140 | なし | boolean | logic.js | beforeUpdate内 | なし | ゲージアニメーション中かどうかを判定する。 |
| GaugeManager#update | - | deltaTime, actualLife, maxLife, exp, nextLevelExp, currentLifeDecayRate | なし | logic.js | 毎フレーム更新時 | Read | ゲージアニメーションやレベルアップフラッシュ等の状態更新を行う。 |
| GaugeManager#draw | - | ctx | なし | effects.js(BASE_UI) | 毎フレーム描画時 | BASE_UI(第7層) | Canvasに対して外周ライフゲージ、EXPゲージ、ヘッダーUIの描画処理を実行する。 |

#### 9. ParticleManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ParticleManager#spawnParticles | - | x, y, colorStr, countMult | なし | effects.js(Facade), title-animation.js | 宝石破壊時 | なし | EFFECT_MATH_CONFIG.PARTICLEの定数に基づき、破壊時の破片パーティクル（回転・頂点情報含む）を生成し配列に追加する。 |
| ParticleManager#spawnSparks | - | x, y, colorStr, speedMult, count | なし | effects.js(Facade) | 脈打ち時 | なし | 火花パーティクルを配列に追加する。 |
| ParticleManager#spawnBurstSparks | - | x, y, colorStr, speedMult, burstCount, sizeMult | なし | effects.js(Facade), title-animation.js | バースト時 | なし | バースト火花パーティクルを配列に追加する。 |
| ParticleManager#updateAndDraw | - | ctx | なし | effects.js(hook) | afterRender | なし | 全パーティクルの座標・寿命を更新しCanvas描画を行う。EFFECT_LEVEL === 'FULL'時は回転する三角形生ポリゴンと角度連動キラキラ反射を描画する。 |
| ParticleManager#clear | - | なし | なし | effects.js(Facade) | リセット時 | なし | パーティクル配列を初期化する。 |

#### 10. LaserEffect.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| LaserEffect#animateLaserLevels | L13 | levels, chainGems, glowColor, onComplete, GameState, screenEffects | なし | effects.js(Facade) | 連鎖開始時 | なし | レーザー接続を階層ごとに発火させ、完了後コールバックを呼ぶ。 |
| LaserEffect#updateAndDraw | L60 | ctx, GameState | なし | effects.js(hook) | afterRender | Read(GEMS) | レーザーアニメーション更新と描画。内部状態で沈み込み・バーストを管理。 |
| LaserEffect#clear | L115 | なし | なし | effects.js(Facade) | リセット時等 | なし | レーザー配列を初期化する。 |

#### 11. scene.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| changeScene | - | sceneId | なし | 古いコード | 非推奨 | Write | 旧来のDOM遷移関数の名残。現在はSceneManagerへ移行済み。 |
| showResultOverlay | - | なし | なし | ResultScene | リザルト表示時 | Write(currentScene) | ResultRendererのstartResultを呼び出し初期化する。 |
| hideResultOverlay | - | なし | なし | ResultScene | リザルト終了時 | なし | 状態リセット用（現在は処理なし）。 |

#### 12. title-animation.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| initTitleAnimation | L14 | なし | なし | TitleScene | タイトル遷移時 | なし | タイトルアニメに必要なパーティクルマネージャー等を初期化する。 |
| stopTitleAnimation | L22 | なし | なし | TitleScene | タイトル離脱時 | なし | 内部タイマー(gemSpawnTimer)を明示的にリセットし、パーティクルをクリアするなど、状態のクリーンアップを堅牢に行う。 |
| updateTitleAnimation | L59 | deltaTime, width, height | なし | TitleScene | 毎フレーム更新時 | なし | 宝石とパーティクルの座標・寿命を更新する。 |
| spawnGem | L43 | width, height | なし | initTitleAnimation, updateTitleAnimation | 生成タイミング | なし | 全色・全図形からランダムに宝石を生成し、グローバルインデックスをcolorIdとして付与する。 |
| drawTitleAnimation | L107 | ctx, width, height | なし | TitleScene | 毎フレーム描画時 | なし | 波形ビジュアライザ、宝石、パーティクルを描画する。 |

#### 13. Visualizer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| RenderStrategies | L7 | (ctx等各種描画パラメータ) | なし | BackgroundVisualizer | 毎フレーム描画時 | なし | StrategyパターンによりWAVE/BLOCK/GLITCHの各描画モードのロジックを分離・カプセル化する。WAVEモード時はパズル背景として控えめに描画するため振幅を半減(0.5倍)させている。 |
| BackgroundVisualizer#triggerSpike | L346 | color | なし | effects.js(Facade) | 破壊時 | なし | 特定の色の波形振幅（スパイク倍率）を跳ね上げる。 |
| BackgroundVisualizer#updateAndDraw | L352 | ctx, GameState | なし | effects.js(hook) | afterRender | Read(colorDestroyCounts, activeColors) | VISUALIZER_MODEに応じたモード判定と、EFFECT_LEVELを加味したRenderStrategiesへの描画委譲。コンストラクタ時点では activeColors が未設定なため、この処理の開始時に動的に振幅等の初期化および新色アンロックの追従を行う。 |
| BackgroundVisualizer#drawDebug | L500 | ctx | なし | effects.js(hook) | 毎フレーム描画時 | なし | 第12層として、FPSやゲーム進行のデバッグ統計情報をCanvas描画する。 |

#### 14. SoundManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SoundManager#initContext | L14 | なし | なし | loadAllAudio, resumeContext | Context初期化時 | なし | AudioContextおよびAnalyserNodeを初期化する。 |
| SoundManager#updateMuteState | - | なし | なし | ConfigScene等 | 設定変更時 | なし | AppConfig.AUDIO_ENABLEDに応じてマスターゲイン(masterGainNode)を即座に1/0へ切り替える。 |
| SoundManager#resumeContext | L25 | なし | Promise | play系メソッド, tap時 | ユーザーアクション時 | なし | 自動再生ポリシーに対応するため、AudioContextを再開する。 |
| SoundManager#loadAllAudio | L32 | なし | Promise | main.js | ロード時 | なし | 全音声アセットを事前ロードしてバッファにキャッシュする。エラー時はスルーする。 |
| SoundManager#playStageBgmSet | L110 | setKey | なし | effects.js | BGM再生時 | なし | ステージ固有のBGMセット（normal/pinch/fever）を全て同時再生し、normalのみ音量を1にする。 |
| SoundManager#switchStageBgmState | L151 | targetState | なし | effects.js | 状態遷移時 | なし | 稼働中のBGMセットの中で、指定された状態の音量をフェードインし、他をフェードアウトする（クロスフェード）。 |
| SoundManager#stopBGM | L175 | なし | なし | effects.js | BGM停止時 | なし | 再生中のBGMをすべて停止し、ステートを初期化する。 |
| SoundManager#playSE | L210 | key, options | なし | effects.js | SE再生時 | なし | SEをスケジューリング再生する。配列ランダム再生やピッチ変更(`playbackRate`)に対応。 |
| SoundManager#playSceneBGM | L253 | key | なし | effects.js | シーン遷移時 | なし | TITLEやRESULTなど単一のシーンBGMをループ再生する。 |
| SoundManager#setStasisFilter | L266 | isStasis | なし | main.js | ステイシス切替時 | なし | BGMのローパスフィルタの周波数を変更し、ステイシス演出（こもった音）を適用する。 |
| SoundManager#getBgmFrequencyData | L279 | なし | Uint8Array | Visualizer.js等 | 描画毎等 | なし | BGMの周波数データ(FFT)を取得する。 |
| SoundManager#getFrequencyCompensation | - | freqHz | number | (内部) | (内部) | なし | 周波数に対する聴感補正係数(EQ)を計算する。 |
| SoundManager#getProcessedVisualizerData | - | stateKey, ranges, waveStepX, width, isPartitioned | Float32Array | title-animation.js, Visualizer.js | 描画毎等 | なし | 指定された周波数帯域範囲(ranges)ごとに、EQ補正、対数スケーリング圧縮、Attack/Releaseスムージング、Bass Pulse処理を施した描画用振幅データを取得する。 |
| SoundManager#playVoice | L284 | key | なし | effects.js | VOICE再生時 | なし | VOICEを再生する。（将来用スタブ） |
