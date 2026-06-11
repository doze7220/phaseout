# PROJECT_FUNCTION_INDEX.md

# PHASE OUT - Function & File Index
> 最終更新バージョン: v0.11.7

最終更新: 2026-06-11 (v0.11.7 時点)

> **【重要】v0.9.8 以降の Canvas 完全移行 (Phase 4) に伴い、DOMに関連する各種表示ロジックは廃止または統合されました。本インデックスには旧アーキテクチャの記述（ScreenEffects.jsのDOM操作など）が一部残存していますが、現在全てのUI描画は `MasterRenderer.js` 配下の各Renderer（ResultRenderer, SceneRenderer等）および各Scene（ConfigScene等）へ統合されています。**

---

#### 1. config.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GameState#reset | L108 | なし | なし | physics.jsのinitPhysics | ゲーム初期化時 | Write(全般) | `GameState` の全プロパティを初期状態にリセットする。 |

#### 2. audioConfig.js
| オブジェクト名 | 行番号 | 内容 | 概要 |
| ------ | ------ | ------ | ------ |
| AUDIO_SETTINGS | L2 | BGM_VOLUME, SE_VOLUME, VOICE_VOLUME | 各カテゴリのマスター音量を定義する。 |
| AUDIO_ASSETS | L8 | BGM, SE, VOICE の各音声ファイルパスと個別音量 | 再生用キーと対応する `src` および `volume` を定義する。 |

#### 2.1. InputManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| InputManager#init | - | targetElement | なし | logic.js | 初期化時 | なし | 指定要素にイベントリスナを登録する。 |
| InputManager#getLogicalPosition | - | clientX, clientY | Object | _handlePointerDown等 | タップ時 | なし | ブラウザの実座標をCanvasの論理座標に変換する。 |
| InputManager#onPointerDown | - | callback | なし | logic.js | 初期化時 | なし | ポインターダウン時のコールバックを登録する。 |

#### 2.2. ScreenEffects.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ScreenEffects#showChainPopup | - | count, color | なし | ScoreManager等 | チェイン発生時 | なし | Canvas上で「Chain数」を描画するキューを登録する。 |
| ScreenEffects#hideChainPopup | - | なし | なし | ScoreManager等 | チェイン終了時 | なし | Chainポップアップをフェードアウトさせる。 |
| ScreenEffects#showScorePopup | - | points | なし | ScoreManager等 | スコア獲得時 | なし | Chain表示の下に獲得スコアを描画するキューを追加する。 |
| ScreenEffects#showLevelUpPopup | - | ... | なし | ScoreManager等 | レベルアップ時 | なし | 画面中央に大きくレベルアップ演出をCanvas描画で表示する。 |
| ScreenEffects#showFloatingNumber | - | text, type, x, y, delay | なし | logic.js等 | タップ時など | なし | タップ位置に浮かび上がるダメージや回復数値を配列に登録する。 |
| ScreenEffects#drawInGamePostEffects | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 第6層として、ステイシスやピンチのヴィネットエフェクトをCanvasに描画する。 |
| ScreenEffects#drawPopups | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 第8層として、登録されたフローティング情報（数字・ポップアップ）をCanvasに描画する。 |

#### 2.2. SpriteCacheManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SpriteCacheManager#preloadAssets | - | なし | Promise | main.js | 初期化時 | なし | 非同期で画像アセットを読み込む。 |
| SpriteCacheManager#generateAllCaches | - | なし | なし | main.js | 初期化/設定変更時 | なし | 全てのスプライトキャッシュを事前生成しメモリに保持する。 |
| SpriteCacheManager#get | - | key | Canvas | 描画処理 | 描画時 | なし | キャッシュからCanvasを取得する。 |
| SpriteCacheManager#getGem | - | shape, colorId | Canvas | renderer.js等 | 描画時 | なし | 宝石スプライトのCanvasを取得する。 |

#### 2.3. MasterRenderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| MasterRenderer#init | - | Events, render | なし | physics.js | ゲーム初期化時 | なし | Matter.jsのレンダリングフックを一本化し、全体パイプラインを初期化する。 |
| MasterRenderer#registerLayer | - | layerId, callback | なし | 各種描画モジュール | システム構築時 | なし | 指定した層(1〜12)に描画コールバックを登録する。 |
| MasterRenderer#registerGlobalUpdate | - | callback | なし | renderer.js等 | システム構築時 | なし | 描画前に状態更新（スコア等）を行うコールバックを登録する。 |
| MasterRenderer#renderAll | - | なし | なし | (内部イベントフック) | 毎フレーム描画時 | なし | 全12層を順番に呼び出して描画する。 |

#### 2.4. RippleManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| RippleManager#createRipple | - | x, y | なし | InputManager等 | タップ時 | なし | 論理座標(x, y)に波紋エフェクトを発生させる。 |
| RippleManager#updateAndDraw | - | ctx | なし | MasterRenderer | 毎フレーム描画時 | なし | 発生中の波紋を第10層へ描画し、時間経過で消去する。 |

#### 2.5. SceneManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SceneManager#changeScene | - | newSceneInstance | なし | main.js等 | 画面切り替え時 | なし | スタックを全て破棄して新シーンを積む。 |
| SceneManager#pushScene | - | newSceneInstance | なし | logic.js等 | 画面加算時 | なし | スタック上に新シーンを重ねて積む。 |
| SceneManager#popScene | - | なし | なし | UIイベント等 | 画面戻る時 | なし | スタック最前面のシーンを破棄し前の画面に戻る。 |
| SceneManager#update | - | deltaTime | なし | MasterRenderer | 毎フレーム更新時 | なし | スタック最前面のシーンの更新処理(update)を呼び出す。 |
| SceneManager#draw | - | ctx, layerId | なし | MasterRenderer | 毎フレーム描画時 | なし | スタック内の全シーンの下から順に描画処理(draw)を呼び出す。 |
| SceneManager#handleInput | - | pointerInfo, e | boolean | InputManager | タップ時 | なし | スタック最前面のシーンに入力を伝播し、必要なら消費する。 |

#### 2.6. BaseScene.js, PlayScene.js, ResultScene.js
| クラス名 | メソッド | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| BaseScene | init, update, draw, handleInput, destroy | - | - | SceneManager | ライフサイクルイベント | 全シーンクラスの基底インターフェース。 |
| ConfigScene | init, draw, handleInput, destroy | - | - | SceneManager | 加算ロード時 | UI.Windowを用いたコンフィグモーダルの構築・描画と、枠外タップやXボタンの判定、およびパズル進行のステイシス管理を行う。 |
| PlayScene | init | - | なし | SceneManager | パズル開始時 | 物理エンジンやゲームロジック(initPhysics)を初期化する。 |
| PlayScene | update | deltaTime | なし | SceneManager | 毎フレーム | 物理エンジン(Matter.js)のDeltaクランプと更新処理を実行する。 |
| PlayScene | destroy | - | なし | SceneManager | パズル終了時 | 物理エンジンの破棄(destroyPhysics)とイベント解除を行う。 |
| ResultScene | init | - | なし | SceneManager | ゲームオーバー時 | 既存のリザルト画面DOMを表示(showResultOverlay)する。 |
| ResultScene | destroy | - | なし | SceneManager | リザルト終了時 | リザルト画面DOMを非表示(hideResultOverlay)にする。 |

#### 3. main.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| (無名関数) | L9 | なし | なし | DOMContentLoaded | ロード時 | Read(engine, displayScore等) | 各種DOMイベントリスナーを登録し、初期化を行う。 |
| createRipple | L211 | e | なし | mousedown, touchstart | イベント駆動 | なし | タップ位置に波紋（ショックウェーブ）DOM要素を生成する。 |

#### 3. logic.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| checkGameOver | L11 | なし | なし | pointerDownHandler, beforeUpdateHandler | タップ時, beforeUpdate内 | Read(isGameOver), Write(isGameOver) | ライフが0以下になった場合にゲームオーバー状態へ移行する。 |
| setupGameLogic | L23 | engine, render | なし | physics.jsのinitPhysics | 初期化時 | Read/Write(life, level等) | タップ入力や時間経過によるライフ減少のイベントリスナー・フックを登録する。 |
| removeGameLogic | L122 | なし | なし | physics.jsのinitPhysics | リセット時 | Read(render, engine) | 登録済みのイベントリスナーやフックを解除する。 |
| areGemsTouching | L134 | g1, g2 | boolean | getAdjacencyList | タップ時(startChain経由) | なし | 宝石同士の距離を判定し接触・近接しているかを返す。 |
| getAdjacencyList | L141 | activeGems | Map | startChain | タップ時 | なし | 画面上の全宝石の隣接リストを生成する。 |
| startChain | L158 | startGem | なし | pointerDownHandler | タップ時 | Read(GEMS), Write(isAnimating) | BFSで同色の繋がっている宝石を探索し、レーザー演出を開始する。 |
| finalizeDestruction | L206 | chain | なし | startChain(コールバック) | レーザー完了後 | Read/Write(actualScore, life, level, exp, totalExp, colorDestroyCounts等) | 宝石を削除し、スコア・経験値の獲得計算、レベルアップ判定、LIFE回復を行う。 |

#### 4. physics.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| initPhysics | L8 | なし | なし | main.js等 | 初期化時 | Write(engine, render, runner等) | Matter.jsエンジンの初期化、壁生成、ゲームループ(requestAnimationFrame)の開始を行う。リザルト画面移行後の完全停止・スキップ制御も含む。 |
| generateNormalRandom | L118 | mean, stdDev | number | createGem | 宝石生成時 | なし | 正規分布の乱数を生成する。 |
| createGem | L126 | x, y | gem (Body) | spawnInitialGems, finalizeDestruction | 宝石生成時 | なし | Matter.jsのBodyを生成し、色や形状のカスタムプロパティを付与する。 |
| spawnInitialGems | L181 | なし | なし | initPhysics | 初期化時 | Read(engine), Write(GEMS) | 画面上部に初期配置の宝石を生成する。 |

#### 5. score.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| generateScoreData | L10 | value, maxDigits | Array | ScoreRenderer.js, ScreenEffects.js等 | UI描画時 | なし | スコアを計算し、桁スライスや単位情報を持たせたオブジェクト配列（トークン）を生成する。 |
| renderScoreToHtml | L49 | scoreData | String | ScreenEffects.js, scene.js等 | DOM更新時 | なし | トークン配列からDOM表示用のHTML文字列を生成する。 |
| renderScoreToText | L81 | scoreData | String | - | - | なし | トークン配列から純粋な文字列を生成する。 |

#### 6. renderer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| AssetManager#loadAssets | L10 | なし | Promise | main.js | ロード時 | なし | 宝石の画像を非同期でロードしキャッシュする。 |
| initCanvasCache | L144 | なし | なし | main.js | 初期化時・設定変更時 | なし | 宝石の各種バリエーションを事前レンダリングしCanvasキャッシュを生成する。 |
| drawRichGem | L160 | ctx, x, y, radius, shape, color | なし | initCanvasCache | キャッシュ生成時 | なし | Canvas APIを使って宝石の基本図形とアウトライン・テクスチャを描画する。 |
| hookCustomRenderer | L243 | Events, render, GEMS | なし | physics.jsのinitPhysics | 初期化時(フック登録)・afterRender | Read(level), Write(displayScore) | 宝石スタンプ描画とドラムロール処理を行う。 |

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
| BaseControl | constructor | x, y, width, height, options | - | 継承先 | インスタンス化時 | 座標、サイズ、ホバー/タップ状態管理、ヒット領域判定 (`contains`) の共通基底クラス。 |
| TextButton | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。矩形背景、枠線、中央テキスト描画。 |
| ImageButton | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。画像スケール描画。 |
| ToggleSwitch | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。ON/OFF状態保持、色切り替え。 |
| Window | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。背景、枠線、タイトルバー描画。`isModal` フラグによる暗幕描画対応。 |
| FullScreenTap | updateAndDraw | ctx | なし | 描画ループ | UI描画時 | `BaseControl` 継承。全画面透明タップ判定用コントロール。 |
| ScrollArea | updateAndDraw | ctx, x, y, width, height, items, options | なし | 各種UIレンダラー | UI描画時 | 旧 `ScrollableTextUI`。擬似スクロールUIの描画と領域管理を行う。 |

#### 7. effects.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| clearAll | L13 | なし | なし | physics.jsのinitPhysics | リセット時 | なし | 各マネージャーに委譲し、全エフェクトをクリアする。 |
| clearLasers | L18 | なし | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | レーザーエフェクトをクリアする。 |
| showChainPopup | L26 | count, color | なし | LaserEffect.js等 | レーザー進行時 | なし | 連鎖ポップアップ表示を委譲する。 |
| hideChainPopup | L30 | なし | なし | logic.js(finalizeDestruction) | 単発消去時等 | なし | 連鎖ポップアップの非表示を委譲する。 |
| showScorePopup | L34 | points | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | スコアポップアップ表示を委譲する。 |
| showFloatingNumber | L38 | text, type, x, y, delay | なし | logic.js | LIFE・EXP変動時 | なし | フローティング数値のCanvasスプライト結合・DOM表示を委譲する。 |
| animateLaserLevels | L42 | levels, chainGems, glowColor, onComplete | なし | logic.js(startChain) | 連鎖開始時 | なし | レーザーアニメーション開始を委譲する。 |
| spawnParticles | L42 | x, y, colorStr | なし | logic.js(finalizeDestruction) | 宝石消去時 | なし | 破片パーティクル生成を委譲する。（EFFECT_LEVELにより間引きあり） |
| spawnSparks | L47 | x, y, colorStr, speedMult, count | なし | renderer.js | 脈打ち描画時 | なし | 火花パーティクル生成を委譲する。（FULL以外スキップ） |
| spawnBurstSparks | L52 | x, y, colorStr, speedMult, burstCount, sizeMult | なし | renderer.js | バースト時 | なし | バースト火花パーティクル生成を委譲する。 |
| triggerScreenShake | L56 | なし | なし | logic.js(finalizeDestruction) | 連鎖終了時 | なし | 画面揺れ演出を委譲する。 |
| hookEffectsRenderer | L65 | Events, render | なし | physics.js(initPhysics) | 初期化時(フック登録)・afterRender | Read(GameState) | Matter.js描画ループにエフェクト層をフックする。 |
| updateLevelDisplay | L77 | level | なし | logic.js | レベルアップ時等 | なし | レベル表示更新を委譲する。 |
| togglePinchEffect | L85 | isPinch | なし | logic.js | ライフ変動時 | なし | ピンチ（画面赤枠）演出切替を委譲する。 |
| toggleStasisEffect | L89 | isStasis | なし | logic.js等 | ステイシス遷移時 | なし | ステイシス（画面グレー化等）演出切替を委譲する。 |
| playBGM | L99 | key | なし | scene.js等 | BGM再生時 | なし | SoundManagerへのBGM再生を委譲する。 |
| stopBGM | L103 | なし | なし | scene.js等 | BGM停止時 | なし | SoundManagerへのBGM停止を委譲する。 |
| playSE | L107 | key | なし | logic.js等 | SE再生時 | なし | SoundManagerへのSE再生を委譲する。 |
| playVoice | L111 | key | なし | logic.js等 | VOICE再生時 | なし | SoundManagerへのVOICE再生を委譲する。 |

#### 8. ScreenEffects.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ScreenEffects#showChainPopup | L198 | count, color | なし | effects.js(Facade) | レーザー進行時 | なし | 連鎖数のポップアップDOMを更新・表示する。 |
| ScreenEffects#hideChainPopup | L216 | なし | なし | effects.js(Facade) | 単発消去時等 | なし | 連鎖ポップアップを非表示・フェードアウトさせる。 |
| ScreenEffects#showScorePopup | L224 | points | なし | effects.js(Facade) | 連鎖終了時 | なし | 獲得スコアのポップアップDOMを更新・表示する。 |
| ScreenEffects#triggerScreenShake | - | magnitude | なし | logic.js等 | 大ダメージ時等 | なし | 画面揺れエフェクト(Canvas)の開始時刻と強度を設定する。 |
| ScreenEffects#applyShake | - | ctx | なし | MasterRenderer | PreRender時 | なし | 画面揺れ状態に応じてContext全体をランダムにtranslateし、画面全体を揺らす。 |
| ScreenEffects#showFloatingNumber | L326 | text, type, x, y, delay | なし | effects.js(Facade) | LIFE・EXP変動時 | なし | フローティングテキスト用のスプライトを結合し、一時的なCanvas+DOMとして表示する。 |
| ScreenEffects#updateLevelDisplay | L409 | level | なし | effects.js(Facade) | レベル変動時 | なし | ヘッダーレベル表示DOMを更新する。 |
| ScreenEffects#togglePinchEffect | L323 | isPinch | なし | effects.js(Facade) | ライフ変動時 | なし | 画面全体ピンチエフェクト用CSSクラスを切り替える。 |
| ScreenEffects#toggleStasisEffect | L330 | isStasis | なし | effects.js(Facade) | ステイシス遷移時 | なし | 画面全体ステイシスエフェクト用CSSクラスを切り替える。 |

#### 8.1. GaugeManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| GaugeManager#init | L13 | life | なし | logic.js | 初期化時 | なし | LIFEゲージのSVG Pathや内部状態を初期化する。 |
| GaugeManager#triggerDamage | L106 | actualLife | なし | logic.js | タップ時 | なし | ダメージ時の赤ゲージアニメーションフラグを立てる。 |
| GaugeManager#triggerHeal | L124 | actualLife | なし | logic.js | 回復時 | なし | ヒール時の緑ゲージアニメーションフラグを立てる。 |
| GaugeManager#isDecayPaused | L140 | なし | boolean | logic.js | beforeUpdate内 | なし | ゲージアニメーション中かどうかを判定する。 |
| GaugeManager#update | - | deltaTime, actualLife, maxLife, exp, nextLevelExp, currentLifeDecayRate | なし | logic.js | 毎フレーム更新時 | Read | ゲージアニメーションやレベルアップフラッシュ等の状態更新を行う。 |
| GaugeManager#draw | - | ctx | なし | effects.js(BASE_UI) | 毎フレーム描画時 | BASE_UI(第7層) | Canvasに対して外周ライフゲージ、EXPゲージ、ヘッダーUIの描画処理を実行する。 |

#### 9. ParticleManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| ParticleManager#spawnParticles | L9 | x, y, colorStr | なし | effects.js(Facade), title-animation.js | 宝石破壊時 | なし | 破壊時の破片パーティクルを配列に追加する。 |
| ParticleManager#spawnSparks | L27 | x, y, colorStr, speedMult, count | なし | effects.js(Facade) | 脈打ち時 | なし | 火花パーティクルを配列に追加する。 |
| ParticleManager#spawnBurstSparks | L45 | x, y, colorStr, speedMult, burstCount, sizeMult | なし | effects.js(Facade), title-animation.js | バースト時 | なし | バースト火花パーティクルを配列に追加する。 |
| ParticleManager#updateAndDraw | L62 | ctx | なし | effects.js(hook) | afterRender | なし | 全パーティクルの座標・寿命を更新しCanvas描画を行う。 |
| ParticleManager#clear | L108 | なし | なし | effects.js(Facade) | リセット時 | なし | パーティクル配列を初期化する。 |

#### 10. LaserEffect.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| LaserEffect#animateLaserLevels | L13 | levels, chainGems, glowColor, onComplete, GameState, screenEffects | なし | effects.js(Facade) | 連鎖開始時 | なし | レーザー接続を階層ごとに発火させ、完了後コールバックを呼ぶ。 |
| LaserEffect#updateAndDraw | L60 | ctx, GameState | なし | effects.js(hook) | afterRender | Read(GEMS) | レーザーアニメーション更新と描画。内部状態で沈み込み・バーストを管理。 |
| LaserEffect#clear | L115 | なし | なし | effects.js(Facade) | リセット時等 | なし | レーザー配列を初期化する。 |

#### 11. scene.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| changeScene | L8 | sceneId | なし | main.js等 | ボタンタップ時 | なし | DOMシーンを遷移させ、タイトルアニメを制御する。 |
| showResultOverlay | L28 | scoreStirring | なし | logic.js | ゲームオーバー後 | Read(level, playStartTime等) | リザルト画面DOMを構築しフェードインで表示する。 |
| hideResultOverlay | L198 | なし | なし | main.js | リザルト終了時 | なし | リザルト画面DOMを非表示にする。 |

#### 12. title-animation.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| initTitleAnimation | L14 | なし | なし | scene.js | タイトル遷移時 | なし | タイトルアニメCanvasを初期化しループ開始する。 |
| stopTitleAnimation | L30 | なし | なし | scene.js | タイトル離脱時 | なし | アニメーションループを停止しCanvasをクリアする。 |
| resize | L45 | なし | なし | 初期化, resizeイベント | リサイズ時 | なし | Canvasサイズを親要素に合わせる。 |
| spawnGem | L57 | なし | なし | update | 毎フレーム | なし | 背景用の宝石を生成する。 |
| explodeGem | L73 | gem | なし | update | 毎フレーム | なし | 専用のParticleManagerを用いて宝石破壊時の火花およびパーティクルを生成する。 |
| update | L91 | deltaTime | なし | loop | 毎フレーム | なし | 宝石とパーティクルの座標・寿命を更新する。 |
| draw | L138 | なし | なし | loop | 毎フレーム | なし | タイトルCanvasへの描画を行う。 |
| loop | L192 | timestamp | なし | requestAnimationFrame | 毎フレーム | なし | アニメーションループ(requestAnimationFrame)を管理する。 |

#### 13. Visualizer.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| BackgroundVisualizer#getCanvas | L14 | なし | Canvas | updateAndDraw | レンダリング毎等 | なし | ヘッダー背景のCanvas要素を取得しコンテキストを初期化する。 |
| BackgroundVisualizer#resize | L24 | なし | なし | constructor, getCanvas | リサイズ時等 | なし | Canvasのサイズを親要素に合わせる。 |
| BackgroundVisualizer#triggerSpike | L32 | color | なし | effects.js(Facade) | 破壊時 | なし | 特定の色の波形振幅（スパイク倍率）を跳ね上げる。 |
| BackgroundVisualizer#updateAndDraw | L38 | GameState | なし | effects.js(hook) | afterRender | Read(colorDestroyCounts) | EFFECT_LEVELに応じたモード(WAVE/BLOCK/BLOCK_NONE)で破壊数のビジュアライザ描画を行う。 |
| BackgroundVisualizer#drawDebug | - | ctx | なし | effects.js(hook) | 毎フレーム描画時 | なし | 第12層として、FPSやゲーム進行のデバッグ統計情報をCanvas描画する。 |

#### 14. SoundManager.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| SoundManager#initContext | L14 | なし | なし | loadAllAudio, resumeContext | Context初期化時 | なし | AudioContextおよびAnalyserNodeを初期化する。 |
| SoundManager#resumeContext | L25 | なし | Promise | play系メソッド, tap時 | ユーザーアクション時 | なし | 自動再生ポリシーに対応するため、AudioContextを再開する。 |
| SoundManager#loadAllAudio | L32 | なし | Promise | main.js | ロード時 | なし | 全音声アセットを事前ロードしてバッファにキャッシュする。エラー時はスルーする。 |
| SoundManager#playStageBgmSet | L110 | setKey | なし | effects.js | BGM再生時 | なし | ステージ固有のBGMセット（normal/pinch/fever）を全て同時再生し、normalのみ音量を1にする。 |
| SoundManager#switchStageBgmState | L151 | targetState | なし | effects.js | 状態遷移時 | なし | 稼働中のBGMセットの中で、指定された状態の音量をフェードインし、他をフェードアウトする（クロスフェード）。 |
| SoundManager#stopBGM | L175 | なし | なし | effects.js | BGM停止時 | なし | 再生中のBGMをすべて停止し、ステートを初期化する。 |
| SoundManager#playSE | L210 | key, options | なし | effects.js | SE再生時 | なし | SEをスケジューリング再生する。配列ランダム再生やピッチ変更(`playbackRate`)に対応。 |
| SoundManager#playSceneBGM | L253 | key | なし | effects.js | シーン遷移時 | なし | TITLEやRESULTなど単一のシーンBGMをループ再生する。 |
| SoundManager#setStasisFilter | L266 | isStasis | なし | main.js | ステイシス切替時 | なし | BGMのローパスフィルタの周波数を変更し、ステイシス演出（こもった音）を適用する。 |
| SoundManager#getBgmFrequencyData | L279 | なし | Uint8Array | Visualizer.js等 | 描画毎等 | なし | BGMの周波数データ(FFT)を取得する。 |
| SoundManager#playVoice | L284 | key | なし | effects.js | VOICE再生時 | なし | VOICEを再生する。（将来用スタブ） |
