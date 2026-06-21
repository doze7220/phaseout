# 実装指示書：ScreenEffects.js の責務分割とリファクタリング

## 目的
現在1000行を超え、単一ファイルに多数のCanvasエフェクト（ポップアップ、ヴィネット、フェイズトランジション等）が同居している `ScreenEffects.js` をリファクタリングする。
機能変更は一切行わず、既存の演出を維持したまま、アーキテクチャの健全性を回復するために責務ごとにクラスを分割する。

## 前提条件（アーキテクチャ厳守）
*   **機能変更の禁止**: 描画の見た目、アニメーションのタイミング（`gameDelta`, `realDelta`の適用）などのロジック自体は変更しないこと。
*   既存の `ScreenEffects.js` は、新設する各クラスのインスタンスを保持し、外部（`effects.js` や `MasterRenderer.js`）からの呼び出しを各クラスへ委譲する**Facade（ファサード）**としての役割に純化させること。

## 分割・新設するクラス構成
JavaScript（ES Modules）の慣習に従い、パスカルケース（頭文字大文字）でファイル名とエクスポートするクラス名を完全に一致させること。また、元のファイルの文脈が分かるように `ScreenEffect` をプレフィックスとして冠する。

以下の3つのファイルを `js/render/` ディレクトリ配下に新設し、`ScreenEffects.js` からロジックと状態（State）を移譲しなさい。

### 1. `ScreenEffectPopup.js`（エクスポートクラス名: `ScreenEffectPopup`）
*   **責務**: スコアポップアップ、フローティング数値（LIFE増減等）、チェイン数表示、レベルアップポップアップ等の「画面上に浮き上がるテキスト・UI系演出」の管理と描画。
*   **移行対象**: `chainPopupState`, `levelUpState`, `floatingTexts` などの状態変数と、`showChainPopup`, `showScorePopup`, `showFloatingNumber`, `showLevelUpPopup`, `drawPopups` などのメソッド。

### 2. `ScreenEffectVignette.js`（エクスポートクラス名: `ScreenEffectVignette`）
*   **責務**: ピンチ時（赤色）やステイシス時（白色）の画面周囲のヴィネット（暗転・色フィルター）演出の管理と描画。
*   **移行対象**: `isPinch`, `isStasis` などの状態変数と、`togglePinchEffect`, `toggleStasisEffect`, `drawInGamePostEffects` などのメソッド。

### 3. `ScreenEffectTransition.js`（エクスポートクラス名: `ScreenEffectTransition`）
*   **責務**: ホワイトフェイズやブラックフェイズなど、世界を塗り替えるフェイズ移行時のプロシージャルな大がかりなCanvasトランジション（大膨張、波紋ワイプ、トライバル描画など）の管理と描画。
*   **移行対象**: アステライア・トライバル展開、極大膨張、透明ワイプなどの描画ロジック。新色解放時のトライバル演出（`showTribalUnlockEffect`）もここに含めること。

### 4. `ScreenEffects.js` 本体（残存ロジック）
*   **責務**: `ScreenShake`（画面揺れ）など、上記に分類しきれないグローバルな描画オフセット制御の維持、および上記3クラスのインスタンス生成・処理の委譲。

## 実行要件
1.  まずは新規ファイルを作成し、コードをコピー＆ペーストして適切に `export` / `import` を設定すること。
2.  `ScreenEffects.js` のコンストラクタで新設クラスをインスタンス化し、既存メソッドから新設クラスの同等メソッドを呼び出すように書き換えること。
3.  テスト実行時にエラーが出ないよう、依存関係（`score.js` や `config.js` のインポート等）のパスが通っていることを必ず確認すること。
