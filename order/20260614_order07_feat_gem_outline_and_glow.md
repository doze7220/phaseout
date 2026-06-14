# 宝石のアウトライン＆グレア（GEM_OUTLINE）設定の実装

## Goal
宝石の同色クラスター（塊）の視認性を極限まで高めるため、SpriteCacheManagerによる事前生成キャッシュ画像に対して「3pxの同色のアウトライン」と「同色のグレア（発光）」を追加します。
また、コンフィグ画面からこの描画設定を「FULL（LINE+GLOW）」「LINE（LINEのみ）」「NONE（オフ）」の3段階でリアルタイムに切り替えられるようにします。

## 変更内容

### 1. `js/core/config.js` の改修
*   `AppConfig.GRAPHICS_CONFIG` に `GEM_OUTLINE: 'FULL'` （デフォルト値）を追加します。取り得る値は `['FULL', 'LINE', 'NONE']` です。
*   `config.js` の初期化処理ブロック（localStorageからの復元）に、`phaseout_gem_outline` キーから設定を読み込み、バリデーションを行って復元するロジックを追加します。

### 2. `js/render/SpriteCacheManager.js` の改修
*   宝石のキャッシュ画像を生成する処理（`generateAllCaches` または `_drawRichGem`、`_drawFlatGem` 周辺）において、`AppConfig.GRAPHICS_CONFIG.GEM_OUTLINE` の値を参照します。
*   **描画ロジックの追加**:
    *   宝石の形状描画のベースとして（あるいは直後に）、その宝石の原色（`colorDef.color`）を用いて `lineWidth = 3` の実線（`stroke()`）を「宝石の外側」に描画します。
    *   設定が `'FULL'` の場合のみ、このアウトラインに対して `shadowBlur`（15px程度）と `shadowColor`（原色）を設定し、強烈な発光（グレア）を適用します。
    *   設定が `'LINE'` の場合は、`shadowBlur` を 0 にしてソリッドなマット線のみを描画します。
    *   設定が `'NONE'` の場合は、アウトラインもグレアも描画しません（現在のまま）。
*   **【重要】パディングの確保**:
    *   アウトライン（3px）やグレア（15px）がCanvasの枠をはみ出して見切れないよう、一時Canvasの生成サイズ（`width`, `height`）を基本の直径（radius * 2）より大きめ（＋40px程度）に確保し、中心座標（描画オフセット）を適切に調整してください。

### 3. `js/scene/ConfigScene.js` の改修
*   「設定」タブのUI構築ロジック内に、「GEM OUTLINE（宝石のオーラ）」設定を追加します。
*   既存の「エフェクト設定」のロジックを参考に、`TextButton` を用いた3段階排他ボタン（FULL / LINE / NONE）を構成してください。
*   ボタンタップ時のコールバック処理にて：
    1.  `AppConfig.GRAPHICS_CONFIG.GEM_OUTLINE` を更新する。
    2.  `localStorage.setItem('phaseout_gem_outline', value)` で保存する。
    3.  `SpriteCacheManager.generateAllCaches()` を呼び出し、即座に盤面の宝石の見た目を再生成・反映させる。

### 4. ドキュメントおよびバージョンの更新
*   **`changelog.js`**: `v0.18.4` として「宝石の視認性を向上させる GEM OUTLINE 設定（FULL / LINE / NONE）を追加」を追記する。
*   **`PROJECT_ARCHITECTURE.md`**: 先頭の最終更新バージョンを `v0.18.4` に更新する。
*   **`PROJECT_FUNCTION_INDEX.md`**: 先頭の最終更新バージョンを `v0.18.4` に更新する。

## User Review Required
> [!IMPORTANT]
> 1. 上記の計画に基づき、オフスクリーンCanvasのサイズ拡張（パディング）による描画ズレなどの懸念点がないか確認・レビューを行い、報告してください。
> 2. 問題がなければ、実装作業に進む許可を求めてください。
