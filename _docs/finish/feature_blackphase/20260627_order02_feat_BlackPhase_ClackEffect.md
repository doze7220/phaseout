# 実装指示書：ブラックフェイズ予兆のヒビ割れ演出（セット管理・動的閾値・シーケンス実装）

ブラックフェイズ（またはブレイクゲージ蓄積時）の絶望感を最大化するため、シーケンス画像を用いた進行型のヒビ割れ演出（Layer 5描画）を実装する。その際、将来的なアセット追加や仕様変更に耐えうるよう、セット管理モデルとゼロ除算ガードを備えた動的計算アーキテクチャを構築せよ。

## 1. アセット命名規則とコンフィグ定義（セット管理）
*   `js/core/effectConfig.js` の `BLACK_PHASE_EFFECT_CONFIG` 内に、以下の `CRACK_SETS` を追加せよ（マジックナンバー排除）。
今後 PATTERN_02 などを追加するだけで拡張可能な構造とする。

    CRACK_SETS: {
        CRACKSET_01: {
            basePath: "assets/img/ui/crack/crack01_",
            extension: ".png",
            sequenceCount: 5,
            maxThreshold: 0.9, // 最初のヒビが入るゲージ残量割合(例: 90%)
            minThreshold: 0.1, // 最後のヒビが入るゲージ残量割合(例: 10%)
            compositeOp: "multiply"
        }
    }

## 2. アセットの事前ロードとキャッシュ
*   `js/render/SpriteCacheManager.js` 等の適切な箇所にて、`CRACK_SETS` に登録されているすべてのキー（`CRACKSET_01` 等）をイテレートし、各セットの `sequenceCount` 分の画像をすべて事前ロードしてメモリにキャッシュせよ（例: `crack01_01.png` 〜 `crack01_05.png`）。ゼロ埋め（01, 02）などの桁数フォーマットに注意すること。

## 3. パターンのランダム決定（状態管理）
*   `js/core/config.js` の `GameState` に `currentCrackSetKey: null` を追加。
*   ヒビ割れを描画するフェイズ（ホワイトフェイズ等）に突入したタイミング（`PhaseManager.js` 等）で、`Object.keys(BLACK_PHASE_EFFECT_CONFIG.CRACK_SETS)` からランダムに1つのキーを選び、`GameState.currentCrackSetKey` にセットせよ。

## 4. 動的閾値計算（ゼロ除算ガード）とゲージ連動描画
*   `js/render/ScreenEffectVignette.js` 等のパズル画面前面エフェクト描画処理にて、対象ゲージの残量割合 `ratio`（0.0 〜 1.0）を取得する。
*   `GameState.currentCrackSetKey` が設定されていれば、対応するセットのコンフィグを取得する。
*   以下の「ゼロ除算ガード」を備えた動的計算式を用いて、各シーケンス間の閾値ステップを計算せよ。
    `const step = (set.maxThreshold - set.minThreshold) / Math.max(1, set.sequenceCount - 1);`
*   `ratio` の値と計算した閾値を比較し、現在の進行度に応じたシーケンス番号（1 〜 sequenceCount、または描画なし）を決定せよ。
*   決定したシーケンス番号の画像をキャッシュから取得し、フル画面サイズ（論理座標 720x1280）でパズルエリア上へ描画せよ。合成モードはコンフィグの `compositeOp` を適用すること。

---
### 【開発・運用ルール】
*   バージョン管理のパッチバージョン（ZZ）を1つカウントアップ。
*   履歴とベースキャンプ（`changelog.txt`, `FEATURE_BLACK_PHASE.md`）の更新を必ず行うこと。
