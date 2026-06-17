# 結晶破片の生ポリゴン化と角度連動キラキラ反射の実装

## Goal
宝石が破壊された際に発生する破片（Particle）の描画を「回転する三角形の生ポリゴン＋角度連動のキラキラ反射」へと刷新します。
ただし、パフォーマンス保護のため、このリッチな描画は `AppConfig.EFFECT_LEVEL === 'FULL'` の場合のみ適用し、`'LITE'` や `'NONE'` の場合は従来の「四角形ドット（fillRect）」による軽量描画を維持する設計とします。

## 変更内容

### 1. `js/render/ParticleManager.js` の改修
*   **設定のインポート**:
    *   `config.js` から `AppConfig` をインポートしてください（すでにインポートされていればそれを利用）。
*   **パーティクル生成時 (`spawnParticles`)**:
    *   各パーティクルオブジェクトに、初期の回転角度 `rotation` (0〜Math.PI*2) と、回転速度 `angularVelocity` (ランダムな値、例: -0.2 〜 0.2) を追加します。
    *   三角形の形状を表現するための頂点情報（相対的な3つの座標など）もプロパティとして生成・保持させてください。
*   **パーティクル更新・描画時 (`updateAndDraw`)**:
    *   `AppConfig.EFFECT_LEVEL === 'FULL'` の場合：
        1.  `rotation` に `angularVelocity` を毎フレーム加算します。
        2.  `ctx.save()` / `ctx.restore()` と `ctx.translate(p.x, p.y)` / `ctx.rotate(p.rotation)` を用いて、保持している頂点情報から三角形のパス（`beginPath`〜`fill`）を描画します。
        3.  **角度連動キラキラ反射**: `Math.sin(p.rotation)` の絶対値が特定の閾値（例: 0.95）を超えた瞬間のみ、一時的に `ctx.globalCompositeOperation = 'lighter'` とし、塗りつぶし色を純白（またはそれに近い色）にして反射光を表現します。それ以外の角度では元の陣営色（`p.color`）で描画します。
    *   `AppConfig.EFFECT_LEVEL !== 'FULL'` （LITE, NONE等）の場合：
        1.  回転などの複雑な計算はスキップし、現在のコードと同じく `ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size)` を用いて指定色（`p.color`）で軽量に四角形を描画します。

### 2. ドキュメントおよびバージョンの更新
*   **`changelog.js`**: `v0.18.5` として「エフェクトFULL設定時において、破片パーティクルの描画を角度連動でキラキラ反射する回転生ポリゴン（三角形）へ刷新」を追記する。

## User Review Required
> [!IMPORTANT]
> 1. `ParticleManager.js` にて大量のパーティクルを描画する際、パス描画や `save/restore` が頻発することになります（FULL時）。条件分岐を含めた現在の軽量な描画ループの構造において、著しいパフォーマンス低下やメモリリークの懸念がないかコードの事前確認を行い報告してください。
> 2. 問題がなければ、この計画のまま実装作業に進む許可を求めてください。
