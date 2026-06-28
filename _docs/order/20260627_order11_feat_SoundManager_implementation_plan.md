# BGM管理アーキテクチャの刷新と最適化計画

現在のBGM管理方式（全曲同時再生によるVertical Remixing）を廃止し、フェイズ状態の複雑化に伴う再生位置のズレや状態遷移バグを解決するための2レイヤー制トラック（メイン・ピンチ）構造への移行、およびピンチBGM音量制御の最適化を行います。

## User Review Required

> [!WARNING]
> 旧方式の `playStageBgmSet` で行われていた「全トラック（通常・フィーバー・ピンチ・ホワイト・ブラック）の同時再生」を完全に廃止し、メモリ削減と再生タイミング制御のために動的な生成・クロスフェード再生へと移行します。これに伴い、`SoundManager.js` のメソッドシグネチャや内部プロパティ構成が大きく変更されます。

## Open Questions

特になし（指示書に沿って進めます）。

## Proposed Changes

### [SoundManager 層]

#### [MODIFY] js/render/SoundManager.js
- `bgmSources` と `bgmGainNodes` を `main` と `pinch` の2系統のみを管理・制御する構造に変更。
- クロスフェードしつつ「曲の頭（0秒）から再生」する機能として、新たに `switchMainBgmState(targetState)` メソッドを実装。古い `main` トラックをフェードアウト＆破棄し、新しい `targetState` トラックを `start(0)` してフェードインする処理に改修。
- `updatePinchVolume(lifeRatio, isMuted)` メソッドを追加し、ノーマルフェイズ時のLIFE連動音量制御と、ホワイト・ブラックフェイズでのピンチBGM完全ミュート処理を実現。
- `startPhaseShiftBgmFromZero` や `startPhaseBreakBgmFromZero` などの古い専用メソッドを削除し、新しい `switchMainBgmState` に統合・クリーンアップ。
- `stopBGM` / `instantStopBGM` / `fadeOutAllBGM` などの管理メソッドを新アーキテクチャに合わせて修正。
- `updateMuteState()` 等、コンフィグ（BGM停止・再生）への対応を確認・調整。

### [Logic 層]

#### [MODIFY] js/core/logic.js
- `determineCurrentBgmState` を `determineCurrentMainBgmState` に改称し、ピンチ判定を分離（`fever` または `normal` のみを返すようにする）。
- `updateBgmState` のロジックを改修：
  - 新しい `determineCurrentMainBgmState` で得たステートと現在のステートを比較し、変更があれば `SoundManager.switchMainBgmState` を呼び出す。
  - 現在のフェイズがノーマルか否かを判定し、LIFEに基づく `lifeRatio` を算出して `SoundManager.updatePinchVolume(lifeRatio, isMute)` を呼び出し、メインBGMとピンチBGMの音量を動的に制御する（ホワイト・ブラックフェイズ中は完全ミュート指定）。
- ピンチのSE（PINCH_WARNING）の再生条件を、LIFE閾値を下回った瞬間のみ1回再生されるようフラグ管理化して調整（既存の挙動の整理）。

### [PhaseManager 層]

#### [MODIFY] js/core/PhaseManager.js
- ホワイトフェイズ（`PHASE_WHITE_ENTER`, `PHASE_WHITE_EXIT`）でのBGM切り替え処理を、新しい `SoundManager.switchMainBgmState('phase_shift')` および元の状態（normal/fever）への復帰呼び出しに変更。
- ブラックフェイズ（`PHASE_BLACK_ENTER`, `PHASE_BLACK_EXIT`）でのBGM切り替え処理も同様に `SoundManager.switchMainBgmState('phase_break')` および元の状態への復帰呼び出しに変更。
- フェイズ突入・退出時のBGMフェードアウトやステイシス処理と競合しないよう、`SoundManager` の呼び出しを整理。

### [ResultScene 層]

#### [MODIFY] js/scene/ResultScene.js
- リザルト画面移行時、`SoundManager.instantStopBGM()` で全BGMを停止。
- ジングル（GAMEOVER等）を再生し、リザルトBGM（`SCENE_RESULT` など）を流す処理が正しく動作するよう確認・調整。

## Verification Plan

### Manual Verification
1. ゲームを開始し、通常パズル（ノーマルフェイズ）でBGMが1曲だけ（メイン）流れることを確認する。
2. 色を解放していき、盤面が全色（fever状態）になった際に、クロスフェードしてフィーバーBGMが「頭から」再生されることを確認する。
3. わざとLIFEを減らし、LIFE規定値（15%など）以下になった際、メインBGMの音量が下がり、裏で流れていたピンチBGMの音量が上がる（クロスフェードする）ことを確認する。
4. シフトゲージをMAXにしてホワイトフェイズに突入した際、専用BGM（phase_shift）に切り替わり「頭から」再生されること、かつピンチBGMが完全にミュートされることを確認する。
5. ホワイトフェイズ終了後、元のBGM（normalまたはfever）に復帰し、「頭から」再生されることを確認する。
6. ブラックフェイズ（ブレイクゲージMAX）でも同様に専用BGM（phase_break）への切り替えと復帰が行われるか確認する。
7. LIFEが0になりリザルト画面に遷移した際、音楽が停止しジングルが鳴り、リザルトBGMに切り替わることを確認する。
8. コンフィグ画面でBGMのミュート・再生切り替えが即座に反映されることを確認する。
