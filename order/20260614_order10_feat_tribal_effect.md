# 新色アンロック時のトライバル拡散演出実装

## Goal
ロードマップ機能として、`StageManager` によるレベル連動で「新色」が追加された瞬間に、パズル画面中央へその色（陣営）のトライバル（シンボル画像）がフワッと浮かび上がり、大きく拡散しながら消えていくCanvas演出を実装します。

## 変更内容

### 1. `js/render/ScreenEffects.js` の改修
- クラス内部の初期化処理（constructor等）に `this.tribalEffects = [];` を追加し、演出状態を管理する配列を用意します。
- **メソッド追加:** `showTribalUnlockEffect(colorStr)`
  - 引数として受け取った `colorStr`（HEX値）を元に `config.js` の `COLOR_CONFIG` を検索し、該当する色の `symbolKey`（'symbol_1' 等）を取得します。
  - `startTime` などのアニメーション開始情報とともに、配列にオブジェクトを登録します。
- **描画・更新ロジックの追加:** `drawTribalEffects(ctx)` などの処理を作成します。
  - アニメーション期間（例: 2000ms〜2500ms程度）。
  - 経過時間に応じて、スケール（例: 等倍から2倍以上へ徐々に拡大）と、アルファ値（フェードイン後にフェードアウト）をイージング計算します。
  - `SpriteCacheManager.get(symbolKey)` で取得した画像を画面中央に描画します。
  - **演出の極意:** `ctx.save()` から `ctx.restore()` の間で、`globalCompositeOperation = 'lighter'` に設定し、`shadowColor` に対象のカラーコード（colorStr）、`shadowBlur` を強めにかけて、その陣営の光でシンボルが妖しく発光しているように描画してください。
- **レイヤー登録:** この描画処理を `MasterRenderer` の第6層（`IN_GAME_POST_EFFECT`）あたり、または既存のUIの下（宝石の上）の適正な層に組み込んでください。（`drawInGamePostEffects` への統合でも可）

### 2. `js/render/effects.js` (Facade) の改修
- `ScreenEffects` の該当メソッドを呼び出すための Facade 関数 `showTribalUnlockEffect(colorStr)` を追加し、エクスポートしてください。

### 3. `js/core/StageManager.js` の改修
- `onLevelUp(newLevel)` メソッド内において、新色が `UNLOCKABLE_COLORS` から選出され `activeColors` 配列に追加された**直後のタイミング**で、追加した色のHEXコードを引数として `effects.showTribalUnlockEffect(newColorHex)` を呼び出してください。
- （※ `logic.js` や `physics.js` の流れを阻害しないよう、`effects.js` をインポートして呼び出すだけで完結させてください）

### 4. ドキュメントおよびバージョンの更新
- `changelog.js`: 新しいバージョン（例: `v0.19.1`）として「機能追加: レベルアップに伴う新色アンロック時に、画面中央へ陣営のトライバルシンボルが浮かび上がる拡散演出を追加」を追記してください。

## User Review Required
> [!IMPORTANT]
> 既存のCanvas描画パイプライン（MasterRenderer）に沿った形でエフェクトが追加できるか確認し、問題がなければ実装（コードの書き換え）へ進む許可を求めてください。
