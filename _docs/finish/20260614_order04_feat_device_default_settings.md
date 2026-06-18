# PC/モバイルの初回起動時デフォルト設定の定数化

現在、初回起動時における端末（PC/モバイル）ごとの設定振り分けがコード内にハードコードされています。これを解消し、後から簡単にデフォルト値を変更できるよう `config.js` へ定数として切り出してください。

## 1. config.js の改修
`config.js` 内（`AppConfig` の上部など見やすい位置）に、初回起動時のデフォルト設定を定義する以下のオブジェクトを新設してください。

```javascript
// 初回起動時の端末別デフォルト設定
AppConfig.DEFAULT_SETTINGS = {
    PC: {
        EFFECT_LEVEL: 'FULL',
        VISUALIZER_MODE: 'WAVE'
    },
    MOBILE: {
        EFFECT_LEVEL: 'LITE',
        VISUALIZER_MODE: 'GLITCH'
    }
};
```

## 2. 初期化ロジックの改修
- config.js または設定を初期化している箇所（localStorageから読み込む部分など）において、既存のモバイル判定ロジックを改修してください。
- 保存された設定がない（初回起動である）場合、端末判定を行い、上記の AppConfig.DEFAULT_SETTINGS.PC または AppConfig.DEFAULT_SETTINGS.MOBILE を参照して EFFECT_LEVEL と VISUALIZER_MODE に割り当てるようにしてください。

## 3. ドキュメントの更新
- 実装完了後、グローバルルールに従い changelog.js へ今回の改修（v0.18.1）を追記し、関連ドキュメントのバージョン表記を同期してください。

