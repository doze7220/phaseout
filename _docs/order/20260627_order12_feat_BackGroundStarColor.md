# 実装指示書：背景の星空（STARRYSKY_CONFIG）のカラーパレット刷新

パズルの視認性を維持しつつ、世界観（セブンスパレット）を背景に溶け込ませるため、星空の色彩設定をアップデートする。

## 1. effectConfig.js の COLORS 配列の書き換え
`STARRYSKY_CONFIG` 内で定義されている `COLORS` 配列（現在3色の白系カラー）を破棄し、ゲーム内の7つの陣営色に「純白（#ffffff）との差分50%（中間色）」を加算した、以下の8色のパステル調パレットに完全に差し替えること。

[新しい COLORS 配列]
COLORS: [
    '#ffffff', // White（Astraea）
    '#d38d89', // Red (IGNIS)
    '#ffbd7f', // Orange (HELIOS)
    '#ffe57f', // Yellow (GAIA)
    '#99e3ac', // Green (VERITY)
    '#ace3fc', // Cyan (AETHER)
    '#7fbcff', // Blue (CELESS)
    '#d7a8ee'  // Purple (GNOSIS)
],