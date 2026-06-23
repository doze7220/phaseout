# PHASE OUT ∴ Cluster Stirring - 関数リファレンスインデックス
最終更新: 2026-06-24 (v0.26.41 時点)

---

#### 1. config.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GameState#reset | L108 | なし | なし | physics.jsのinitPhysics | ゲーム初期化時 | Write(全般) | `GameState` の全プロパティを初期状態にリセットする。 |
| saveConfig | - | なし | なし | ConfigScene.js, config.js(初期化時) | 設定変更時 | なし | 現在の設定値を `changelog.js` の最新バージョン情報とともに単一JSON(`phaseout_config`)として `localStorage` に保存する。 |

| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| COLOR_CONFIG | L77 | 各色の名前、HEXコード、有効/無効フラグ、刻印設定(symbolKey, symbolColor)、陣営名(faction) | プロジェクト全体のベースとなる7色の定義。 |
| THEME_COLORS | L87 | キーバリューのカラーマップ | `COLOR_CONFIG`から生成される各色のHEX値マップ。描画時の参照用。 |
| GRAPHICS_CONFIG | - | GEM_STYLE, GEM_OUTLINE, SHOW_SYMBOL, SYMBOL_ALPHA | 宝石の描画スタイル（H.LIGHT/OVERLAY/FLAT）、強調表示（GEM_OUTLINE）、刻印シンボルの表示設定などを定義する。 |
| AppConfig | - | EFFECT_LEVEL, DEFAULT_SETTINGS 等 | ゲームの基本設定（音量やエフェクトレベル等）および端末ごとの初期設定（`DEFAULT_SETTINGS`）を保持する。 |
| EFFECT_MATH_CONFIG | - | PARTICLE, RESULT_GLITCH, TRIBAL_UNLOCK, PRISM_LINK, WHITE_SCORE_GLOW 等 | 破片パーティクル(PARTICLE)やグリッチ(RESULT_GLITCH)、新色解放(TRIBAL_UNLOCK)、プリズムリンク(PRISM_LINK)、ホワイトフェイズ中のスコア虹色後光(WHITE_SCORE_GLOW)などのエフェクト演出に関するパラメータや描画設定値を定義する。 |

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
| StageManager#onLevelUp | - | newLevel | なし | logic.js(finalizeDestruction) | レベルアップ時 | Write(activeColors, colorDestroyCounts, totalScorePerColor) | MAX_ACTIVE_COLORS[newLevel]を確認し、枠の拡大時はUNLOCKABLE_COLORSから未アクティブの色を1つ選出してactiveColorsに追加する。その際、既存アクティブ色の破壊数平均を初期値として設定する。 |
| StageManager#getActiveColors | - | なし | string[] | physics.js(createGem) | 宝石生成時 | Read(activeColors) | 現在のGameState.activeColors（HEX配列）を返す。 |
| StageManager#getMaxActiveColors | - | なし | number | logic.js(determineCurrentBgmState) | BGM状態判定時 | Read(level) | 現在のステージとレベルにおける最大解放可能色数を返す。Fever状態（熱狂状態）の判定基準として使用される。 |

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
| LAYOUT_CONFIG | - | GAME_AREA, UI, GAUGE, FOOTER_UI, POPUPS, RESULT_SCENE, DEBUG_OVERLAY 等 | 各種UIの論理座標・レイアウトや、リザルト画面の全描画座標・オフセット・フッター領域のアニメーション設定、デバッグオーバーレイ描画座標等を定義する。 |

###### 1.6. DebugConfig.js
| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| ENABLE_DEBUG_OVERLAY | - | booleanフラグ | 第12層（DEBUG_OVERLAY）の描画およびヒット判定の有効/無効を一括で切り替えるためのフラグ。将来の本番ビルド移行時に使用する。 |
| DEBUG_VALUES | - | スコア倍率、ゲージ操作値の配列 | ConfigScene.js の DEBUGタブに動的生成されるボタンの表記名（label）と適用数値（value）のリスト。UIロジックからのマジックナンバー排除を担う。 |
| DEBUG_START_INITIAL_VALUES | - | 各種デバッグ設定の初期値プリセット | タイトル画面の「DEBUG START」ボタン経由でゲームを開始した際に、GameState.debug や AppConfig へ自動でインジェクションされるデバッグ設定（ゲームスピード、経験値倍率など）のプリセット。 |

#### 2.2. SpriteCacheManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SpriteCacheManager#preloadAssets | - | なし | Promise | main.js | 初期化時 | なし | 非同期で画像アセットを読み込む。 |
| SpriteCacheManager#generateAllCaches | - | isWhitePhase | なし | main.js, PhaseManager.js | 初期化/設定変更/フェイズ移行時 | なし | 定義されている全ての形状と色のスプライトキャッシュ（無効化されたものも含む）をグローバルインデックスをキーとして事前生成しメモリに保持する。isWhitePhase=true時は白化処理を追加。 |
| SpriteCacheManager#get | - | key | Canvas | 描画処理 | 描画時 | なし | キャッシュからCanvasを取得する。 |
| SpriteCacheManager#getGem | - | shape, colorId | Canvas | renderer.js等 | 描画時 | なし | 宝石スプライトのCanvasを取得する。 |
| SpriteCacheManager#_drawRichGem | - | ctx, x, y, radius, shape, colorDef, isWhitePhase | なし | SpriteCacheManager#generateAllCaches | キャッシュ生成時 | なし | FLATスタイル時は基本図形を描画し、RICHスタイル時は画像ベースのティント着色を行う。またGEM_OUTLINE設定に応じ、画像由来の単色シルエットから抽出した5pxのアウトラインおよび発光（グレア）の合成描画も行う。isWhitePhase=true時は加算合成による白化オーバードライブを描画する。 |
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
| PlayScene#onFadeInStart | - | なし | なし | SceneManager#update | トランジション（FADE_IN）開始時 | ゲーム開始時の初期BGM状態（GameState.currentBgmState）を引き継いでBGMの再生を開始する。Time Spike防止のためSceneManagerへデルタリセットを要求する。 |
| PlayScene#destroy | - | なし | なし | SceneManager | パズル終了時 | 物理エンジンの破棄(destroyPhysics)とイベント解除を行う。 |
| ResultScene | init, onFadeInStart, update, draw, handleInput, destroy | - | - | SceneManager | ゲームオーバー時 | ResultRendererを起動してCanvasベースのリザルト画面を表示する。 |
| BootScene | init, update, draw, handleInput, destroy | - | - | SceneManager | 初期起動時 | システム起動タイポグラフィ演出を描画し、初回タップでグリッチエフェクトを伴ってタイトル画面へ遷移する。 |
| TitleScene | init, update, draw, handleInput, destroy | - | - | SceneManager | タイトル画面表示時 | 全画面タップ(FullScreenTap)による開始と、TAP TO STARTの明滅アニメーション等のUIを管理する。 |
| ConfigScene | init, update, draw, handleInput, destroy | - | - | SceneManager | 加算ロード時 | 4タブ構成のコンフィグモーダル構築、各種設定・宝石強調表示・刻印の即時適用、ステイシス管理を行う。 |

#### 3. main.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| (無名関数) | L20 | なし | なし | DOMContentLoaded | ロード時 | Read(engine, displayScore等) | Canvas・SceneManager・InputManager等の初期化とゲームループを起動する。DOM由来の波紋生成(createRipple)等のレガシー処理は削除済み。 |

#### 3.0. ChainAlgorithm.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| pointToSegmentDistance | L16 | px, py, ax, ay, bx, by | number | areGemsTouching内部 | BFS探索時 | なし | 点と線分の最短距離（垂線または端点への距離）を計算する。 |
| getBaseRadius | L35 | body | number | areGemsTouching内部 | BFS探索時 | なし | 宝石の基本となる判定半径を算出・取得する。 |
| getCapsuleSegment | L63 | body | Object | areGemsTouching内部 | BFS探索時 | なし | 長方形の中心から長辺に沿った内部の線分（芯）の座標を算出する。 |
| areGemsTouching | L113 | g1, g2, connectionThreshold, bfsMultiplier | boolean | getAdjacencyList内部 | BFS探索時 | なし | 2つの宝石間の距離を判定し接触・近接しているかを返す。長方形の場合はカプセル判定（芯からの最短距離）を用いて繋がりやすさを向上させている。 |
| isPrismLinked | L177 | colorId1, colorId2, isWhitePhase | boolean | findChainGroup内部 | BFS探索時 | なし | 2つの宝石がプリズムリンクの条件を満たすかを判定する。通常時はスペクトル順（一方通行: 0->1->...->6->0）、`isWhitePhase`がtrueの場合はスペクトル逆順（リバースリンク）で判定する。 |
| getAdjacencyList | L153 | activeGems, connectionThreshold, bfsMultiplier | Map&lt;number, Body[]&gt; | findChainGroup内部 | BFS探索時 | なし | 画面上の全宝石の隣接リスト（無向グラフ）を構築する。 |
| findChainGroup | L195 | startGem, activeGems, connectionThreshold, bfsMultiplier | &#123; chainGems: Body[], levels: Array&lt;&#123;from, to&#125;[]&gt; &#125; | logic.js(startChain) | タップ時 | なし | BFS探索により起点宝石から繋がっている連鎖グループを抽出する。現在の階層の全同色ノード展開を完了してからプリズムリンクの探索へ移行する。ホワイトフェイズ時はリバースリンクの深度（Prism Depth）加算をスキップする。 |

#### 3.1. PhaseManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| PhaseManagerImpl#init | - | なし | なし | PlayScene, コンストラクタ | 初期化時 | なし | フェイズを `PHASE_START` にリセットし、タイマーを初期化する。 |
| PhaseManagerImpl#setGameOver | - | なし | なし | logic.js | ライフ0到達時 | Write(isGameOver) | フェイズを `PHASE_GAMEOVER` に移行し、`timeScale=0.2`・ステイシスエフェクト有効化・各フラグの初期化を行う。キャンセルは `cancelGameOver()` で行う。 |
| PhaseManagerImpl#cancelGameOver | - | なし | なし | logic.js(finalizeDestruction) | チェイン終了・LIFE回復時 | Write(isGameOver) | `setGameOver()` が変更した全状態（currentPhase, stateTimer, isFinalGameOverTriggered, isGameOver, timeScale, gravity.y, ステイシスエフェクト）を一括で生存状態へ戻す。`PHASE_GAMEOVER` 以外のフェイズから呼ばれた場合は何もしない。 |
| PhaseManagerImpl#addPhaseGauge | - | total, prismDepth | なし | logic.js | フルリンク達成時 | Read(whitePhaseCount) | `prismDepth >= 6` の場合に、連鎖数と深度から算出したスコア（ホワイトフェイズ突入回数に応じた減衰適用後）をフェイズゲージに加算する。最大値到達で `enterWhitePhase` をトリガーする。 |
| PhaseManagerImpl#enterWhitePhase | - | なし | なし | addPhaseGauge | ゲージ最大到達時 | Write(timeScale, isPuzzlePaused) | フェイズを `PHASE_WHITE_ENTER` に移行し、物理エンジンを完全停止（ステイシス）、専用フラッシュ等の突入演出を発火する。 |
| PhaseManagerImpl#update | - | deltaTime | なし | PlayScene | 毎フレーム更新時 | Write(timeScale, isPuzzlePaused, isSystemPaused, whitePhaseCount) | ゲージの減衰処理やフェイズごとの経過時間を管理する。`PHASE_WHITE_ENTER` 後は2秒で `PHASE_WHITE` へ本格移行しステイシスを解除する。`PHASE_WHITE`中はタイマーを減算し、0で `PHASE_WHITE_EXIT` (ステイシス移行・トライバル逆再生・波紋状のワイプアウトによる色および背景の復元) へ移行し、演出完了後に `whitePhaseCount` を加算し `PHASE_NORMAL` へ復帰するサイクルを回す。 |
| PhaseManagerImpl#setTimeScaleTarget | - | target, duration, onComplete | なし | PhaseManagerImpl内部 | ステイシス移行/解除時 | Write(stasisTimeScale) | 物理エンジンのタイムスケールを指定した時間(duration)をかけて目標値(target)へ滑らかにフェードさせる。フェード完了時にonCompleteコールバックを実行する。 |
| PhaseManagerImpl#isNormalPhase | - | なし | boolean | logic.js | 各種操作時 | なし | 現在のフェイズが `PHASE_NORMAL` または確認用として `PHASE_WHITE` であるかを返す。 |
| PhaseManagerImpl#getCurrentPhaseName | - | なし | string | Visualizer.js | デバッグ描画時 | なし | 現在のフェイズ名を文字列として返す。 |

#### 3. logic.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| checkGameOver | L17 | なし | なし | pointerDownHandler, beforeUpdateHandler | タップ時, beforeUpdate内 | Read(isGameOver) | ライフが0以下になった場合に `PhaseManager.setGameOver()` を呼び出しフェイズを移行させる。ホワイトフェイズ（`PHASE_WHITE`）中はタップによるLIFE消費を無効化する。 |
| setupGameLogic | L58 | engine, render | なし | physics.jsのinitPhysics | 初期化時 | Read/Write(life, level, currentBgmState等) | タップ入力やライフ減少のイベント登録を行う。また、BGMセットの抽選と、ゲーム開始時の盤面色数に基づく初期BGM状態（fever等）の判定・設定を行う。 |
| setupGameLogic#beforeUpdateHandler | L107 | なし | なし | Matter.Events | 毎物理ステップ更新前 | Write(playTimeMs, life) | `PHASE_NORMAL` 時に限り、プレイ時間の加算およびライフの自然減少を実行し、ゲームオーバーを判定する。ホワイトフェイズ（`PHASE_WHITE`）中は時間経過によるLIFE減少をスキップする。 |
| removeGameLogic | L165 | なし | なし | physics.jsのinitPhysics | リセット時 | Read(render, engine) | 登録済みのイベントリスナーやフックを解除する。廃止されたCanvasの判定を排除しハンドラ残留・多重発火を防ぐ。 |
| startChain | L178 | startGem | なし | pointerDownHandler | タップ時 | Read(GEMS), Write(isAnimating) | `findChainGroup`（ChainAlgorithm.js）へ探索を委譲し、レーザー演出を開始する。 |
| finalizeDestruction | L197 | chain | なし | startChain(コールバック) | レーザー完了後 | Read/Write(actualScore, life, level, exp, totalExp, colorDestroyCounts等) | 宝石を削除し、色別の按分に基づくスコア・経験値の獲得計算、レベルアップ判定、LIFE回復を行う。スコア計算は `calculateChainScore` に委譲し、`PHASE_WHITE` 中は大チェイン減衰・色減衰をスキップする特例処理を適用する。 |
| determineCurrentBgmState | - | なし | string | updateBgmState | 毎フレーム・イベント更新時 | Read(life, maxLife, activeColors) | 現在のライフおよび盤面色数（`getMaxActiveColors`との比較）に基づき、BGMの状態文字列（'normal', 'pinch', 'fever'）を決定する内部関数。 |
| updateBgmState | - | なし | なし | pointerDownHandler, beforeUpdateHandler等 | 状態変化時 | Read/Write(currentBgmState) | `determineCurrentBgmState`の結果をもとに `GameState.currentBgmState` を更新し、状態変化時にのみSoundManagerへクロスフェードを要求する。ライフ残量に基づく全体の音量減衰もここで処理される。 |

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
| calculateChainScore | - | chainCount, depth, phaseName, currentLevel | BigInt | logic.js, ScreenEffects.js | スコア確定時・描画時 | なし | チェイン数、深度、現在のフェイズ、現在のレベルに基づき、ホワイトフェイズの3乗化特例を含むスコア計算を行う。 |
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
| getScoreSprite | L8 | key | HTMLCanvasElement | drawHeaderUI, drawResultScoreToCanvas, createScoreCanvas | UI描画時 | なし | キャッシュからスコア・単位用スプライトを取得する。 |
| createScoreCanvas | L12 | scoreValue | Canvas | ScreenEffects.js等 | UI更新時 | なし | スコアのCanvasスプライトを結合したCanvas要素を生成する。 |
| drawScoreData | L54 | ctx, data, startX, startY, scaleX, scaleY | number | drawHeaderUI, ScreenEffects.js等 | 描画時 | なし | パース済みスコアデータを指定位置に描画し、描画幅を返す。 |
| drawString | L72 | ctx, str, prefix, startX, startY, scaleX, scaleY, letterSpacing | number | drawHeaderUI, ScreenEffects.js等 | 文字列描画時 | なし | スプライト文字を指定位置に描画し、描画幅を返す。 |
| measureString | L88 | str, prefix, scaleX, letterSpacing | number | drawHeaderUI, ScreenEffects.js等 | 描画前 | なし | スプライト文字列の描画幅をピクセル単位で事前計測する。 |
| measureScoreData | L99 | data, scaleX | number | drawHeaderUI, ScreenEffects.js等 | 描画前 | なし | パース済みスコアデータの描画幅を計測する。 |
| ScoreRenderer#drawHeaderUI | L119 | ctx, timerStr, decayStr, tapCostValue, scoreValue, rateValue, levelValue | なし | GaugeManager.js | 毎フレーム | Read(displayExp) | タイマー、コスト、スコア、SCORE RATEに加え、3段構成のレベル表示ボックスを単一のヘッダーCanvasへ一括描画する。引数リレーを廃止し、現在経験値・必要経験値は `GameState.displayExp` および `LEVEL_CONFIG` から直接読み込んで描画する。 |
| drawResultScoreToCanvas | L262 | scoreValue | なし | scene.js | リザルト画面 | なし | リザルト用の詳細スコアをCanvasに描画する。 |

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
| showTribalUnlockEffect | - | colorStr | なし | StageManager.js | 新色アンロック時 | なし | 新色アンロック時のトライバル拡散演出をScreenEffectsへ委譲する。 |
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

#### 8. ScreenEffects.js (Facade) 及び関連クラス (Popup, Vignette, Transition)
| クラス/関数名 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ |
| **ScreenEffects.js** | - | - | - | - | 下記3クラスをインスタンス化し、外部からの呼び出しを委譲するFacade。画面揺れ(`triggerScreenShake`, `applyShake`)のみ本体で管理する。 |
| ScreenEffects#triggerScreenShake | magnitude | なし | logic.js等 | 大ダメージ時等 | 画面揺れエフェクト(Canvas)の開始時刻と強度を設定する。 |
| ScreenEffects#applyShake | ctx | なし | MasterRenderer | PreRender時 | 画面揺れ状態に応じてContext全体をランダムにtranslateし、画面全体を揺らす。 |
| **ScreenEffectPopup.js** | - | - | - | - | プリズムリンクUIの展開・昇華演出やオーバードライブ発光演出など、複雑なUI演出を管理するFacadeクラス。内部で `ChainScoreRenderer` や `FloatingNumberRenderer`、`PrismLinkRenderer` 等へ委譲を行う。 |
| showChainPopup | count, color, depth | なし | effects.js | レーザー進行時 | `ChainScoreRenderer` に処理を委譲する。 |
| hideChainPopup | なし | なし | effects.js | 単発消去時等 | `ChainScoreRenderer` に処理を委譲する。 |
| showScorePopup | points | なし | effects.js | 連鎖終了時 | `ChainScoreRenderer` に処理を委譲する。 |
| showLevelUpPopup | oldLevel, newLevel... | なし | effects.js | レベルアップ時 | `LevelUpRenderer` に処理を委譲する。 |
| showFloatingNumber | text, type, x, y, delay | なし | effects.js | LIFE・EXP変動時 | `FloatingNumberRenderer` に処理を委譲し、フローティングテキスト用スプライトを生成する。 |
| triggerPrismLinkStep | step, baseColorId... | なし | effects.js等 | プリズムリンク進行時 | `PrismLinkRenderer` に処理を委譲する。 |
| drawPopups | ctx | なし | MasterRenderer | 毎フレーム描画時 | 登録された各種ポップアップ演出や、委譲先の描画処理（ChainScoreRenderer.drawなど）をまとめて実行する。 |
| **FloatingNumberRenderer.js** | - | - | - | - | ScreenEffectPopupから分離された、フローティング数値描画専任クラス。 |
| update | gameDelta | なし | ScreenEffectPopup | 毎フレーム更新時 | フローティング数値の寿命やアニメーション進行を管理する。 |
| showFloatingNumber | text, type, x, y, delay | なし | ScreenEffectPopup | LIFE・EXP変動時 | フローティングテキスト用スプライトを生成し、オフスクリーンCanvas描画オブジェクトとして登録する。 |
| draw | ctx | なし | ScreenEffectPopup | 毎フレーム描画時 | CSSアニメーション（.floatUp）を再現し、数値を描画する。 |
| **ChainScoreRenderer.js** | - | - | - | - | ScreenEffectPopupから分離された、連鎖・スコアポップアップ描画専任クラス。 |
| update | gameDelta | なし | ScreenEffectPopup | 毎フレーム更新時 | 連鎖ポップアップの寿命やアニメーション進行を管理する。 |
| showChainPopup | count, color, depth | なし | ScreenEffectPopup | レーザー進行時 | Chain数、Depth、数式、リアルタイムスコア(ドラムロール)を描画するキューを登録する。 |
| hideChainPopup | なし | なし | ScreenEffectPopup | 単発消去時等 | 連鎖・数式ポップアップをフェードアウトさせる。 |
| showScorePopup | points | なし | ScreenEffectPopup | 連鎖終了時 | 獲得スコアポップアップをCanvas描画キューへ登録する。 |
| draw | ctx | なし | ScreenEffectPopup | 毎フレーム描画時 | 数式・Depthを含む連鎖ポップアップやドラムロールスコアを描画する。 |
| **PrismLinkRenderer.js** | - | - | - | - | ScreenEffectPopupから分離された、プリズムリンクUIおよびアステライア昇華演出の描画専任クラス。 |
| update | realDelta, gameDelta | なし | ScreenEffectPopup | 毎フレーム更新時 | プリズムリンクと昇華演出のアニメーション進行を管理する。 |
| triggerPrismLinkStep | step, baseColorId... | なし | ScreenEffectPopup | プリズムリンク進行時 | プリズムリンクの各ステップアイコンを落下・点灯させる演出状態を登録する。 |
| triggerSublimationIfNeeded | なし | なし | ScreenEffectPopup | 昇華判定時 | プリズムリンクが最大深度（6以上）かつ通常フェイズの場合、昇華演出を発動しUIを移行させる。条件未達の場合はグリッチによるフェードアウトを発動する。 |
| draw | ctx, _triggerScreenShake | なし | ScreenEffectPopup | 毎フレーム描画時 | プリズムリンクUIの点灯アニメーションおよびアステライア昇華演出の結合・膨張・ログ描画を行う。 |
| **LevelUpRenderer.js** | - | - | - | - | ScreenEffectPopupから分離された、レベルアップポップアップ演出の描画専任クラス。 |
| update | gameDelta | なし | ScreenEffectPopup | 毎フレーム更新時 | レベルアップ演出のアニメーション進行を管理する。 |
| showLevelUpPopup | oldLevel, newLevel... | なし | ScreenEffectPopup | レベルアップ時 | レベルアップ演出の初期化と状態登録を行う。 |
| draw | ctx | なし | ScreenEffectPopup | 毎フレーム描画時 | レベルアップポップアップ（帯、テキスト等）のCanvas描画を行う。 |
| **ScreenEffectVignette.js** | - | - | - | - | ヴィネット効果や新色解放時の演出など、ポストエフェクト寄りの描画を管理するクラス。 |
| showTribalUnlockEffect | colorStr | なし | effects.js | 新色アンロック時 | トライバルシンボルを画面中央に拡散・発光させる演出状態を登録する。 |
| togglePinchEffect | isPinch | なし | effects.js | ライフ変動時 | ピンチ（赤ヴィネット）エフェクトのフラグを切り替える。 |
| toggleStasisEffect | isStasis | なし | effects.js | ステイシス遷移時 | ステイシス（白ヴィネット）エフェクトのフラグを切り替える。 |
| drawInGamePostEffects | ctx | なし | MasterRenderer | 毎フレーム描画時 | ステイシスやピンチのヴィネットエフェクトを描画する。 |
| **ScreenEffectTransition.js** | - | - | - | - | ホワイトフェイズ等の画面全体を覆うトランジション演出を管理するクラス。 |
| triggerWhiteFlash | なし | なし | effects.js等 | フェイズ移行時 | ホワイトフェイズ終了時等のフラッシュトランジションをトリガーする。 |
| drawGlobalPostEffects | ctx | なし | MasterRenderer | 毎フレーム描画時 | ホワイトフェイズ突入演出など、画面全体へのポストエフェクト描画を管理する。 |

#### 8.1. GaugeManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GaugeManager#init | L22 | life | なし | logic.js | 初期化時 | なし | LIFEゲージおよびEXPゲージの内部アニメーション状態を初期化する。SVGやDOM操作は行わない。 |
| GaugeManager#triggerDamage | L106 | actualLife | なし | logic.js | タップ時 | なし | ダメージ時の赤ゲージアニメーションフラグを立てる。 |
| GaugeManager#triggerHeal | L124 | actualLife | なし | logic.js | 回復時 | なし | ヒール時の緑ゲージアニメーションフラグを立てる。 |
| GaugeManager#isDecayPaused | L140 | なし | boolean | logic.js | beforeUpdate内 | なし | ゲージアニメーション中かどうかを判定する。 |
| GaugeManager#update | - | deltaTime, actualLife, maxLife, exp, nextLevelExp, currentLifeDecayRate | なし | logic.js | 毎フレーム更新時 | Read | ゲージアニメーションやレベルアップフラッシュ等の状態更新を行う。 |
| GaugeManager#draw | - | ctx, gameTime | なし | effects.js(BASE_UI) | 毎フレーム描画時 | BASE_UI(第7層) | Canvasに対して外周ライフゲージ、ヘッダーUIの描画処理を実行する（EXPゲージは将来拡張用に温存）。ホワイトフェイズ時はシフトゲージ残量に応じた白化と明滅エフェクトを描画する。 |

#### 8.2. FooterUIManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| FooterUIManager#updateAndDraw | - | ctx, GameState | なし | MasterRenderer | 毎フレーム描画時 | Read | 第7層（UI_BASE）としてフッター領域に3分割のモニターパネルを描画し、EFFECT_LEVEL に連動した「NO SIGNAL」エフェクト（走査線、明滅、グリッチ）を適用する。 |

#### 8.3. BackgroundManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| BackgroundManagerImpl#clear | - | なし | なし | constructor | 初期化時 | なし | 管理している星の配列、および波紋のエミッター・パーティクル配列を初期化する。 |
| BackgroundManagerImpl#clearPrismFluctuation | - | なし | なし | PhaseManager.js | フェイズシフト突入時 | なし | 画面上に残存している波紋のエミッターとパーティクルの配列を空にし、以前のフェイズの波紋を消去する。 |
| BackgroundManagerImpl#_initStar | - | star, centerX, centerY, isInitial | Object | drawStarrySky等 | 星生成・再利用時 | なし | 星オブジェクトの角度、速度、初期距離、サイズ、アルファ増減速度、色などのプロパティをランダムに設定（再利用）する。 |
| BackgroundManagerImpl#updateAndDraw | - | ctx, GameState, PhaseManager | なし | MasterRenderer | 毎フレーム描画時 | Read | 第1層（BACKGROUND）として背景を最奥に描画する。黒背景やホワイトフェイズ時の白塗りつぶし等のベース色制御を行い、星空描画や物理的な波紋（PrismFluctuation）等の描画を呼び出す。 |
| BackgroundManagerImpl#drawStarrySky | - | ctx, centerX, centerY, width, height | なし | updateAndDraw | 毎フレーム描画時 | なし | `STARRYSKY_CONFIG` に基づき星オブジェクトの座標・アルファ値を更新し、放射状に広がる星空を描画する。画面外に出た星はプールとして再利用（初期化）される。 |
| BackgroundManagerImpl#spawnPrismFluctuation | - | x, y, colorHex, addedGauge | なし | logic.js | プリズムリンク達成時 | なし | 追加されたフェイズゲージ量を初期エネルギーとして持つ波源（エミッター）を生成し、`rippleEmitters` 配列に登録する。 |
| BackgroundManagerImpl#drawPrismFluctuations | - | ctx, GameState, PhaseManager | なし | updateAndDraw | 毎フレーム描画時 | Read | エミッターから一定間隔で波紋パーティクルを生成（同時にエネルギー減衰）し、パーティクルを描画する。シフトゲージ残量が50%を超えると色が白へシームレスに変化する演出も行う。 |

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
| LaserEffect#animateLaserLevels | L13 | levels, chainGems, glowColor, onComplete, GameState, screenEffects | なし | effects.js(Facade) | 連鎖開始時 | なし | レーザー接続を階層ごとに発火させ、完了後コールバックを呼ぶ。`PHASE_WHITE`中は、レーザー描画色(`glowColor`)を強制的に白(`#ffffff`)に上書きする。 |
| LaserEffect#updateAndDraw | L60 | ctx, GameState | なし | effects.js(hook) | afterRender | Read(GEMS) | レーザーアニメーション更新と描画。内部状態で沈み込み・バーストを管理。 |
| LaserEffect#clear | L115 | なし | なし | effects.js(Facade) | リセット時等 | なし | レーザー配列を初期化する。 |

#### 11. scene.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
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

#### 13.1. DebugManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| DebugManager#init | - | options | なし | physics.js, main.js | 初期化時 | Write(debug) | isDebugStartに応じてAppConfigおよびGameState.debugのデバッグ状態・パラメータをリセットまたはインジェクションする。 |
| DebugManager#draw | - | ctx | なし | effects.js(hook) | 毎フレーム描画時 | Read | 第12層として、FPSやゲーム進行のデバッグ統計情報をCanvas描画する。 |

#### 14. SoundManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SoundManager#initContext | L14 | なし | なし | loadAllAudio, resumeContext | Context初期化時 | なし | AudioContextおよびAnalyserNodeを初期化する。 |
| SoundManager#updateMuteState | - | なし | なし | ConfigScene等 | 設定変更時 | なし | AppConfig.AUDIO_ENABLEDに応じてマスターゲイン(masterGainNode)を即座に1/0へ切り替える。 |
| SoundManager#resumeContext | L25 | なし | Promise | play系メソッド, tap時 | ユーザーアクション時 | なし | 自動再生ポリシーに対応するため、AudioContextを再開する。 |
| SoundManager#loadAllAudio | L32 | なし | Promise | main.js | ロード時 | なし | 全音声アセットを事前ロードしてバッファにキャッシュする。エラー時はスルーする。 |
| SoundManager#playStageBgmSet | L110 | setKey | なし | effects.js | BGM再生時 | なし | ステージ固有のBGMセット（normal/pinch/fever）を全て同時再生し、normalのみ音量を1にする。 |
| SoundManager#switchStageBgmState | L151 | targetState | なし | effects.js | 状態遷移時 | なし | 稼働中のBGMセットの中で、指定された状態の音量をフェードインし、他をフェードアウトする（クロスフェード）。 |
| SoundManager#stopBGM | L175 | なし | なし | effects.js | BGM停止時 | なし | 再生中のBGMをすべてフェードアウトしながら停止し、ステートを初期化する。 |
| SoundManager#instantStopBGM | - | なし | なし | PhaseManager | ホワイトフェイズ終了時 | なし | 再生中の全BGMをフェードなしで即座に停止する。 |
| SoundManager#restartCurrentStageBgm | - | なし | なし | PhaseManager | ホワイトフェイズ復帰時 | なし | 現在のフェイズ・ステージ状態に応じたBGMセットを再計算し、最初から再生を再開する。 |
| SoundManager#playSE | L210 | key, options | なし | effects.js | SE再生時 | なし | SEをスケジューリング再生する。配列ランダム再生やピッチ変更(`playbackRate`)に対応。 |
| SoundManager#playSceneBGM | L253 | key | なし | effects.js | シーン遷移時 | なし | TITLEやRESULTなど単一のシーンBGMをループ再生する。 |
| SoundManager#startPhaseShiftBgmFromZero | - | なし | なし | PhaseManager | フェイズシフト本格移行時 | なし | フェイズシフト用の専用BGM (`phase_shift`) を初期化し、先頭から音量をフェードインさせて再生する。 |
| SoundManager#setStasisFilter | L266 | isStasis | なし | main.js, PhaseManager | ステイシス切替時 | なし | BGMのローパスフィルタの周波数を変更し、ステイシス演出（こもった音）を適用する。 |
| SoundManager#getBgmFrequencyData | L279 | なし | Uint8Array | Visualizer.js等 | 描画毎等 | なし | BGMの周波数データ(FFT)を取得する。 |
| SoundManager#getFrequencyCompensation | - | freqHz | number | (内部) | (内部) | なし | 周波数に対する聴感補正係数(EQ)を計算する。 |
| SoundManager#getProcessedVisualizerData | - | stateKey, ranges, waveStepX, width, isPartitioned | Float32Array | title-animation.js, Visualizer.js | 描画毎等 | なし | 指定された周波数帯域範囲(ranges)ごとに、EQ補正、対数スケーリング圧縮、Attack/Releaseスムージング、Bass Pulse処理を施した描画用振幅データを取得する。 |
| SoundManager#playVoice | L284 | key | なし | effects.js | VOICE再生時 | なし | VOICEを再生する。（将来用スタブ） |
