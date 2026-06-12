# PROJECT_ARCHITECTURE.md
## OzEngine 基幹システム設計図

本ドキュメントは、OzEngineおよびその上で動作するゲーム群の絶対遵守設計図である。

目的は、

- スパゲッティコード化の防止
- 描画とロジックの完全分離
- データ駆動化
- 大規模化に耐える構造
- リファクタリング頻度の低減

である。

---

# 1. キャンバス仕様（論理座標と表示座標の完全分離）

## 論理解像度

GameConfigで固定する。

例：

- 1920×1080

物理演算、移動速度、当たり判定はすべて論理座標系で処理する。

## 表示解像度

実画面への拡縮はCSSに委譲する。

- object-fit: contain

などを利用する。

## Input座標補正

InputManagerは、

- マウス
- タッチ
- パッド

の入力を受け取った瞬間に、

画面座標
↓

論理座標

へ変換してゲーム側へ渡す。

---

# 2. ディレクトリ構成
src/
│
├─ core/
│
├─ configs/
│
├─ managers/
│
├─ systems/
│
├─ entities/
│
├─ renderers/
│
├─ scenes/
│
├─ data/
│
├─ ui/
│
├─ utils/
│
└─ assets/


---

# 3. Config

ゲーム全体で使用する定数群。

### GameConfig

- 論理解像度
- FPS
- 宇宙サイズ
- 摩擦係数

### LayoutConfig

- UI配置
- レイヤー定義

### SoundConfig

- BGM音量
- SE音量

### PlayerConfig

- 初期性能
- 最大速度

---

# 4. Core Managers

インフラ担当。

## AssetManager

画像、音声などを起動時にロード。

キャッシュを保持する。

## SceneManager

シーン遷移管理。

- Title
- Garage
- Playing

など。

## StorageManager

セーブデータ管理。

- 借金
- 恒常強化
- オプション

を保存する。

## InputManager

入力取得。

- キーボード
- マウス
- タッチ
- ゲームパッド

を統合する。

## SoundManager

BGM、SE再生。

## UpdateManager

ゲーム全体の更新順序を管理する。

更新順序：

Input
↓

StateMachine

↓

Entity

↓

AI

↓

Physics

↓

Collision

↓

Effects

↓

UI

---

# 5. Systems

ゲームの処理系。

## TimeSystem

時間制御。

提供：

- deltaTime
- pause
- slowMotion
- hitStop
- replay
- 倍速

## EventBus

イベント通知システム。

emit()

on()

によって疎結合化する。

例：

enemyDead

↓

ScoreSystem

EffectSystem

SoundSystem

GemSystem

AchievementSystem

が反応する。

## CollisionSystem

当たり判定専門。

空間分割を利用する。

## AISystem

敵AI更新。

## EffectSystem

パーティクル生成。

## CameraSystem

カメラ追従。

- ズーム
- シェイク
- 回転

を担当する。

## DebugSystem

開発支援。

- FPS表示
- 当たり判定可視化
- AI状態表示
- 無敵
- ステージスキップ
- 敵召喚

---

# 6. Entities

実体。

責務：

「どう動くか」

のみ。

描画禁止。

他システムへの直接アクセス禁止。

## PlayerShip

自機。

## EnemyShip

敵。

## Projectile

弾。

## Debris

破片。

## Drone

無人機。

Entityは

update()

のみ持つ。

---

# 7. Data

ゲームデータ。

JSON化を前提とする。

## EnemyData

敵パラメータ。

- HP
- 攻撃力
- 移動速度

## WeaponData

武器。

## StageData

ステージ構成。

## ItemData

アイテム。

## UpgradeData

恒常強化。

EntityはDataを読むだけとする。

---

# 8. EntityManager

生成と破棄のみ担当。

責務：

create()

destroy()

のみ。

更新処理禁止。

描画禁止。

---

# 9. ObjectPoolManager

大量生成物専用。

対象：

- 弾
- パーティクル
- デブリ

再利用を行う。

---

# 10. Renderers

描画専用。

ロジック禁止。

## RenderManager

描画全体の司令塔。

各Rendererを統括する。

### SpriteRenderer

スプライト描画。

### ParticleRenderer

パーティクル描画。

### TextRenderer

文字描画。

### UIShaderRenderer

UIエフェクト。

### PostEffectRenderer

画面全体の演出。

### CameraRenderer

カメラ変換。

---

# 11. 描画レイヤー

Layer 0

背景

Layer 1

背景オブジェクト

Layer 2

デブリ・ジェム

Layer 3

トレイル

Layer 4

エンティティ

Layer 5

プロジェクタイル

Layer 6

エフェクト

Layer 7

InGameポストエフェクト

Layer 8

UI/HUD

Layer 9

Screenポストエフェクト

Layer 10

デバッグ

---

# 12. Scene

大きな画面単位。

## TitleScene

タイトル。

## GarageScene

ガレージ。

## PlayingScene

ゲーム本編。

## ResultScene

リザルト。

---

# 13. StateMachine

シーン内部状態。

例：

PlayingScene

Ready

↓

Playing

↓

Pause

↓

GameOver

↓

Result

Sceneを増やしすぎない。

---

# 14. UI

Canvas完全描画。

DOM要素禁止。

対象：

- HUD
- レーダー
- ダメージ数値
- ボタン
- ウィンドウ

---

# 15. Utils

共通処理。

## RandomUtil

乱数。

## MathUtil

数学処理。

## Vector2

2次元ベクトル。

## Timer

タイマー。

## Easing

補間関数。

---

# 16. 基本原則

## マジックナンバー禁止

必ずConfigまたはDataに置く。

---

## 描画とロジックを混在させない

Entity

↓

Renderers

の一方向のみ。

---

## Entity間の直接依存禁止

EventBus経由で通信する。

---

## System間の循環参照禁止

依存方向を一方向に保つ。

---

## update()とdraw()を分離する

update()

↓

draw()

の順序を厳守する。

---

## Data駆動を基本とする

コードではなくデータで調整する。

---

## Managerは司令塔

処理を書き込みすぎない。

巨大化したらSystemへ分離する。

---

## Rendererは描画だけ

ゲームロジック禁止。

---

## 「迷ったらSystemを増やす」

巨大Managerや巨大Entityを作らない。

それがOzEngineの絶対原則である。

