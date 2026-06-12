# PROJECT_ARCHITECTURE.md
## OzEngine基幹システム設計図

本ドキュメントは、『VANGUARDRIFTER』および基幹エンジン『OzEngine』の全体構造を定義する絶対遵守マニュアルである。
「個人開発のHTML+JSゲームにおけるスパゲッティ化」を完全に根絶するため、本設計図に反する実装を固く禁ずる。

### 1. エンジンの基本思想（実運用で破綻させないための絶対掟）

*   **Service Locatorパターンの「劇薬指定」と依存注入**
    各Managerが互いを直接呼び出すこと（循環参照）を防ぐため `Engine` オブジェクトを経由するが、**Engineから取得できるのは `AssetManager`, `EventBus`, `TimeManager`, `StorageManager` などインフラ層のみに制限する**。EntityやSystem同士は `constructor(eventBus)` のように依存注入（DI）を基本とし、何に依存しているかを見えやすくする。
*   **EventBusの「キュー方式」による完全な疎結合**
    「敵が死んだら音を鳴らす」といった直接呼び出しを禁ずる。すべて `emit("enemyDead")` として `eventQueue.push()` に貯め、**フレームの最後に一括処理（flush）する**ことで、誘爆などの連鎖による処理落ちや順番の破綻を防ぐ。
*   **DataとLogicの分離**
    Entityのパラメータ（HP、速度、攻撃力など）はクラス内に直書きせず、すべて `Data` 階層（JSON等の外部データ）として定義し、Entityはそれを読み込むだけとする。
*   **Entityは「どう動くか」のみ、描画は「Renderer」へ**
    物理計算と描画の責務を完全に分離する[1]。
*   **【労働基準法】Manager巨大化禁止ルール**
    **Managerの行数が500〜1000行を超え始めた場合、必ず新しいSystemへ分離すること。**Managerは司令塔であり、専門処理を抱え込んではならない。

---

### 2. キャンバス仕様（解像度と座標の完全分離）

いかなる実行環境（PC、スマホ、ブラウザズーム）においても物理演算を担保するための設計[2]。
*   **論理解像度（内部宇宙の絶対座標）:** `GameConfig` に定義された固定解像度。物理演算はすべてこれを基準とする[3]。
*   **表示解像度（モニター表示）:** CSSに一任する[3]。
*   **インプットの座標補正:** `InputManager` がスクリーン座標と論理解像度の比率を計算し、常に正しい論理座標へと逆算・補正する[4]。

---

### 3. モジュール構成（最強の8階層アーキテクチャ）

#### 📁 1. Configs（定数・パラメータ）
*   `GameConfig`, `PlayerConfig`, `LayoutConfig`, `SoundConfig`[5]

#### 📁 2. Core（基盤・インフラ）
*   `Engine`: ServiceLocator本体。取得許可は最小限に制限。
*   `SceneManager`: シーンを管理するインフラとしてCoreに配置[6]。
*   `TimeManager`: `deltaTime`の算出、スローモーション、ポーズなどの時間制御を司る。
*   `EventBus`: ゲーム内イベントの通知・キュー処理を統括。
*   `AssetManager`, `StorageManager`, `InputManager`[6]

#### 📁 3. Systems（中間層・専門処理ロジック）
*   `UpdateManager`: ゲームループの厳密な実行順序を「順番として定義するだけ」の存在。中にロジックを書かない。
*   `CollisionSystem`: 空間分割を用いた当たり判定計算。
*   `EffectSystem`: エフェクトの生成と寿命管理。
*   `CameraSystem`: RenderManagerから独立した撮影ドローン。追従、シェイク、ズームを専門に計算。
*   `EntityManager` / `ObjectPoolManager`: 生成(`create`)と破棄(`destroy`)、プールのみを管理。
*   `AISystem`: 敵の思考ロジックをすべて引き受ける。
*   `StateMachine`: SceneやボスAIなど、あらゆる状態遷移を管理する独立システム。

#### 📁 4. Renderers（描画特化層）
*   `RenderManager`: 描画の司令塔。実際の描画は行わない。
*   `Layer0Renderer`, `Layer1Renderer`, `EntityRenderer`, `ParticleRenderer`, `UIRenderer`, `DebugRenderer`: 実際の描画処理を行う実働部隊。

#### 📁 5. Entities（実体・器）
*   `PlayerShip`, `EnemyShip`, `Projectile` など。状態と物理ロジックのみを持つ。**EnemyShipは思考を持たず、AISystemに従うだけの器となる。**

#### 📁 6. Data（データ定義）
*   各種機体データ、武器データなどのJSONデータ群。

#### 📁 7. Scenes（シーン・状態管理）
*   `TitleScene`, `GarageScene`, `PlayingScene`, `ResultScene` など。
*   **【Sceneの責務（Orchestrator）】**
    **Sceneは指揮者である。以下の4つのみを担当する。**
    **1. 各Manager・UI・Entityの初期化**
    **2. update()の呼び出し**
    **3. render()の呼び出し**
    **4. シーン遷移のトリガー**
    **Entity生成、物理演算、描画ロジックをSceneに直書きして肥大化させることを固く禁ずる。**

#### 📁 8. Utils（開発補助）
*   `DebugManager`: FPS表示、当たり判定表示、無敵、ステージスキップ機能など。
*   汎用数学・物理計算ユーティリティ。

---

### 4. GameLoopの厳密な順序（絶対スケジュール表）

`UpdateManager` が順番のみを定義する、1フレーム内の絶対的な処理順序。

1.  **`TimeManager.update()`**（deltaTimeの取得）
2.  **`InputManager.update()`**（プレイヤー操作の取得）
3.  **`Scene.update()` 呼び出し**（以下、Scene指揮の元で実行）
    *   **`AISystem.update()`**（敵の思考決定）
    *   **`Player.update() / Enemy.update() / Projectile.update()`**（座標の移動）
4.  **`CollisionSystem.check()`**（移動確定後の座標で当たり判定を実行）
5.  **`EventBus.process()`**（フレーム内で溜まったイベントキューの一括処理・誘爆など）
6.  **`EntityManager.cleanup()`**（HP0になったEntityの回収・プール返却）
7.  **`CameraSystem.update()`**（全処理後の座標に合わせてカメラを動かす）
8.  **`RenderManager.draw()`**（司令塔として各Rendererに描画を指示）

---

### 5. 描画レイヤー構造（各Renderer統括）

*   **Layer 0:** 背景（星々、ブラックホール）
*   **Layer 1:** 背景オブジェクト（アステロイド、要塞）
*   **Layer 2:** デブリ・ジェム（散らばる破片や経験値）
*   **Layer 3:** トレイル（変態慣性ドリフトの軌跡）
*   **Layer 4:** エンティティ（自機、敵機、無人機）
*   **Layer 5:** プロジェクタイル（弾幕、ミサイル、レーザー）
*   **Layer 6:** エフェクト（爆発、火花、バーストの光）
*   **Layer 7:** InGameポストエフェクト（空間の歪み、カメラシェイク）
*   **Layer 8:** UI / HUD（レーダー、ヒートゲージなど）
*   **Layer 9:** Screenポストエフェクト（画面全体のブラー、暗転、トランジション）
*   **Layer 10:** デバッグレイヤー（コリジョン可視化など）