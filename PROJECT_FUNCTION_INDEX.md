# PROJECT_FUNCTION_INDEX.md

PHASE OUT: Cluster Stirring — 関数インデックスと依存関係

最終更新: 2026-06-07 (v0.9.3 時点)

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

#### 3. main.js
| 関数名 | 行番号 | 引数 | 戻り値 | 呼び出し元 | 実行タイミング | GameState | 概要 |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| (無名関数) | L9 | なし | なし | DOMContentLoaded | ロード時 | Read(engine, displayScore等) | 各種DOMイベントリスナーを登録し、初期化を行う。 |
| closeConfigModal | L148 | なし | なし | btnConfigCloseクリック時 | イベント駆動 | Write(isStasis等) | コンフィグモーダルを閉じ、ステイシス状態を解除する。 |
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
| initScoreSpriteCache | L8 | なし | なし | renderer.js(initCanvasCache) | キャッシュ生成時 | なし | スコアおよびフローティングテキスト用のCanvasスプライトを事前生成する。 |
| getScoreSprite | L170 | key | Canvas | ScreenEffects.js等 | UI更新時 | なし | キャッシュ済みの文字・単位スプライトを取得する。 |
| createScoreCanvas | L174 | scoreValue | Canvas | ScreenEffects.js等 | UI更新時 | なし | スコアのCanvasスプライトを結合したCanvas要素を生成する。 |
| drawHeaderUI | L214 | timerStr, decayStr, tapCostValue, scoreValue, rateValue | なし | GaugeManager.js | 毎フレーム | なし | タイマー、コスト、スコア、SCORE RATEなどを単一のヘッダーCanvasへ一括で描画し、自動スケール調整と2段組みレイアウトを行う。 |
| drawString | L241 | str, prefix, startX, startY, scale, letterSpacing | number | drawHeaderUI等 | 文字列描画時 | なし | スプライト文字を指定位置に描画し、描画幅を返す。 |
| measureString | L256 | str, prefix, scale, letterSpacing | number | drawHeaderUI等 | 描画前 | なし | スプライト文字列の描画幅をピクセル単位で事前計測する。 |
| measureScoreData | L267 | data, scale | number | drawHeaderUI等 | 描画前 | なし | パース済みスコアデータの描画幅を計測する。 |
| drawScoreData | L282 | data, startX, startY, scale | number | drawHeaderUI等 | 描画時 | なし | パース済みスコアデータを指定位置に描画する。 |
| drawResultScoreToCanvas | L390 | scoreValue | なし | scene.js | リザルト画面 | なし | リザルト用の詳細スコアをCanvasに描画する。 |

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
| ScreenEffects#triggerScreenShake | L244 | なし | なし | effects.js(Facade) | 連鎖終了時 | なし | `game-wrapper` DOMに揺れクラスを付与する。 |
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
| GaugeManager#update | L144 | deltaTime, actualLife, maxLife, exp, nextLevelExp, currentLifeDecayRate | なし | logic.js | beforeUpdate内 | なし | 各ゲージタイマーの更新とEXPゲージのDOM反映を行う。引数で減少レートを受け取る。 |
| GaugeManager#render | L248 | actualLife, maxLife | なし | GaugeManager#update, init | 毎フレーム等 | なし | LIFEゲージSVG要素のスタイル（色・dashoffset）を更新する。 |

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
| BackgroundVisualizer#updateAndDraw | L38 | GameState | なし | effects.js(hook) | afterRender | Read(colorDestroyCounts) | EFFECT_LEVELに応じたモード(WAVE/BLOCK/BLOCK_NONE)で破壊数のビジュアライザ描画およびデバッグ表示を行う。 |

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
