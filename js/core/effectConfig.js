// effectConfig.js

export const GRAPHICS_CONFIG = {
    GEM_STYLE: 'overlay', // 'h-light', 'overlay', 'flat' のいずれか
    SHOW_SYMBOL: true, // トライバル刻印の表示ON/OFF
    GEM_OUTLINE: 'FULL' // 'FULL', 'LINE', 'NONE' のいずれか
};

// モジュール内でのみ参照される共通定数（外部へはexportしない）
const WHITE_PHASE_GLOBAL_THRESHOLD = 0.9; // シフトゲージおよび宝石がグリッチを起こし始める残量閾値(0.0〜1.0)

// ========================================================
// 【1】パズル時間に属するエフェクト設定 (gameDelta依存)
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.1
export const PARTICLE_CONFIG = {
    BASE_COUNT: 5,           // パーティクル（破片）発生数の基本値
    RAND_COUNT: 5,           // パーティクル発生数のランダム加算値の最大
    BASE_SPEED: 2,           // パーティクル移動速度の基本値
    RAND_SPEED: 6,           // パーティクル移動速度のランダム加算値の最大
    BASE_SIZE: 12,           // 破片を大きくするため初期値4から8へ変更（パーティクル基本サイズ）
    RAND_SIZE: 12,           // 同上（パーティクルサイズのランダム加算値）
    ROTATION_SPEED_MAX: 0.4, // パーティクル回転速度の最大値
    DECAY_BASE: 0.02,        // パーティクルおよび火花の寿命減衰（消失）速度の基本値
    DECAY_RAND: 0.03,        // パーティクルおよび火花の寿命減衰（消失）速度のランダム加算値
    POLY_RANDOM_OFFSET: 0.2, // ポリゴン頂点のランダムな歪み係数
    REFLECTION_THRESHOLD: 0.95, // キラキラ反射を描画するサイン波の閾値
    SPARK_BASE_SPEED: 2,     // 火花の基本速度
    SPARK_BASE_SIZE: 3,      // 火花の基本サイズ
    SPARK_RAND_SIZE: 3,      // 火花のサイズのランダム加算値
    SPARK_DECAY_BASE: 0.05,  // 火花の寿命減衰の基本値
    SPARK_DECAY_RAND: 0.05,  // 火花の寿命減衰のランダム加算値
    SPARK_DRAW_SIZE_MULT: 2.5, // 火花スプライト描画時のサイズ倍率
    BURST_SPARK_SPEED: 4,    // バースト火花の基本速度（通常の倍）
    BURST_SPARK_BASE_SIZE: 5,// バースト火花の基本サイズ
    BURST_SPARK_RAND_SIZE: 5,// バースト火花のサイズのランダム加算値
    BURST_SPARK_DECAY_BASE: 0.05, // バースト火花の寿命減衰の基本値
    BURST_SPARK_DECAY_RAND: 0.05  // バースト火花の寿命減衰のランダム加算値
};

export const SCREEN_SHAKE_CONFIG = {
    SHAKE_DURATION_MS: 500,         // 画面揺れ演出の持続時間
    DEFAULT_MAGNITUDE: 5,           // 画面揺れの基本強度（デフォルト値）
    MAX_MULTIPLIER: 2,              // サイン波合成後の最終振幅倍率
    FREQ_X1: 0.05,                  // X軸の揺れ周波数1
    FREQ_X2: 0.03,                  // X軸の揺れ周波数2
    FREQ_Y1: 0.04,                  // Y軸の揺れ周波数1
    FREQ_Y2: 0.035                  // Y軸の揺れ周波数2
};

export const TRIBAL_EFFECT_CONFIG = {
    TRIBAL_UNLOCK: {
        FILL_MODE: 1,              // シンボルの色塗りモード (0: 元画像のまま, 1: 陣営色で塗りつぶし, 2: 下記の指定色で塗りつぶし)
        FILL_CUSTOM_COLOR: 'rgba(255, 255, 255, 1.0)', // FILL_MODE が 2 の場合に使われる塗りつぶし色
        DURATION_MS: 2500,         // 演出の合計時間（ミリ秒）
        SCALE_START: 0.3,          // 出現時の初期スケール（1.0で元画像サイズ(512px)。大きすぎる場合はここを0.3〜0.5にする）
        SCALE_ADD: 0.6,            // 演出完了までにどれだけスケールを加算するか
        SCALE_POWER: 0.5,          // スケール拡大のイージングカーブ（0.5だと最初は早く、後からゆっくり拡大）
        FADE_IN_END: 0.2,          // 演出時間の何割でフェードインを終えるか（0.0〜1.0）
        FADE_OUT_START: 0.6,       // 演出時間の何割からフェードアウトを始めるか（0.0〜1.0）
        MAX_ALPHA: 0.8,            // 最大不透明度（1.0だと眩しすぎる場合があるため調整）
        SHADOW_BLUR: 30,           // 光彩（発光）の強さ・ボカシ幅
        COMPOSITE_OP: 'source-over',    // 合成モード（'lighter'で加算発光、'source-over'で通常描画、他`screen``color-dodge``overlay`'hard-light''multiply''xor'等）
        FACTION_TEXT_Y_OFFSET: 10,          // 陣営ログテキストの表示位置（画面中央からのYオフセット）
        FACTION_TEXT_FONT: '16px monospace, "Courier New"', // 陣営ログテキストのフォント
        FACTION_GLITCH_IN_END: 0.15,        // 出現時のグリッチ終了タイミング（進行度 0.0〜1.0）
        FACTION_GLITCH_OUT_START: 0.75,     // 消去時のグリッチ開始タイミング（進行度 0.0〜1.0）
        FACTION_TEXT_HIDE_START: 0.8        // テキストが完全に非表示になるタイミング（進行度 0.0〜1.0）
    },
    PRISM_LINK: {
        DROP_DURATION_MS: 150,             // スタンプ落下の所要時間
        FLASH_DURATION_MS: 60,            // 落下後の白フラッシュの持続時間
        MAX_SCALE: 3.0,                    // 落下開始時の最大スケール
        LASER_WIDTH_MULT: 0.5,             // レーザー膨張時の太さの加算倍率
        GLITCH_DURATION_MS: 200,           // 消去時のグリッチ持続時間
        SHOW_UNLIT_BASE: false,            // 未到達（点灯前）のベースアイコンを表示するかどうか
        BASE_COMPOSITE_OP: 'source-over',  // プリズムゲージ・ベースアイコンの合成モード：'lighter''source-over' 'screen''color-dodge''overlay''hard-light''multiply''xor'等
        BASE_FILL_MODE: 1,                 // 0: 元画像, 1: 陣営色, 2: カスタム色
        BASE_FILL_CUSTOM_COLOR: 'rgba(0, 0, 0, 1.0)',
        BASE_OUTLINE_WIDTH: 1,             // ベースアイコンのアウトラインの太さ (0で無効)
        BASE_OUTLINE_FILL_MODE: 2,         // アウトラインの塗りつぶしモード (0: 元画像, 1: 陣営色, 2: カスタム色)
        BASE_OUTLINE_COMPOSITE_OP: 'lighter', // アウトラインの合成モード
        BASE_OUTLINE_CUSTOM_COLOR: 'rgba(0, 255, 255, 1.0)', // アウトラインのカスタム色
        STAMP_COMPOSITE_OP: 'source-over',     // 落下してくる半透明スタンプおよびフラッシュ時の合成モード
        STAMP_FILL_MODE: 1,                // 例: 陣営色で発光しながら落下
        STAMP_FILL_CUSTOM_COLOR: 'rgba(255, 255, 255, 1.0)',
        MERGE_DURATION_MS: 400,            // 7色のアイコンが中央に集約（マージ）されるまでの所要時間
        STAY_DURATION_MS: 1000,            // アステライア昇華紋章が完成して画面に留まる（待機する）時間
        EXPAND_DURATION_MS: 300,           // 待機後、紋章が拡大（膨張）しながら消去されるまでの時間
        SUBLIMATION_TRIBAL_OUTER_R: 60,            // アステライア紋章のUI用外側半径
        SUBLIMATION_TRIBAL_INNER_R: 8,            // アステライア紋章のUI用内側半径
        SUBLIMATION_TRIBAL_LINE_WIDTH: 8,          // 紋章のライン太さ
        SUBLIMATION_LOG_POS_Y: -10,                // ログ表示位置のYオフセット（中央基準）
        SUBLIMATION_LOG_TIMINGS: [                 // 昇華時のシステムログ
            { weight: 0.1, offsetY: 0, text: "PHASE SHIFT PREDICTION..." },
            { weight: 0.3, offsetY: 24, text: "ASTRAEA SUBLIMATION" }
        ]
    }
};

export const LASER_EFFECT_CONFIG = {
    LASER_SHRINK_TIMER: 10,          // レーザー到達先の宝石が沈み込む（縮小フラッシュする）演出の持続タイマー値
    SHRINK_BASE: 0.85,               // 沈み込み（縮小）時の基準スケール倍率
    SHRINK_MIN: 0.5,                 // 沈み込み（縮小）の最小スケール（下限値）
    SHRINK_LEVEL_MULTI: 0.05,        // レベル上昇に伴う沈み込みスケールの減少倍率
    FLASH_BASE: 0.6,                 // レーザー到達先のフラッシュ（白化）の基準アルファ値
    FLASH_MAX: 0.9,                  // フラッシュ（白化）アルファ値の上限
    FLASH_LEVEL_MULTI: 0.1,          // レベル上昇に伴うフラッシュアルファ値の加算倍率
    PULSE_SPEED: 100,                // タップ起点（原点）の宝石が鼓動（パルス）するアニメーションの周期速度
    PULSE_MULTI: 0.05,               // タップ起点（原点）の鼓動アニメーションにおけるスケール拡大倍率
    SPARK_COUNT_MULTI: 1,            // タップ起点から継続的に発生する火花（スパーク）の生成数倍率
    BURST_SPARK_COUNT_MULTI: 10,     // レーザー到達時等に発生する大火花（バーストスパーク）の生成数倍率
    COMPLETE_DELAY_MS: 150,          // 全階層のレーザー展開完了後、コールバックを呼ぶまでの遅延時間（余韻）
    DRAW_FULL_OUTER_WIDTH: 14,       // FULL設定時のレーザー外側（最も太く薄い）グローの太さ
    DRAW_FULL_OUTER_ALPHA: 0.2,      // FULL設定時のレーザー外側グローの不透明度
    DRAW_FULL_INNER_WIDTH: 6,        // FULL設定時のレーザー内側（中間）グローの太さ
    DRAW_FULL_INNER_ALPHA: 0.5,      // FULL設定時のレーザー内側グローの不透明度
    DRAW_FULL_CORE_WIDTH: 2,         // FULL設定時のレーザー中心コアの太さ
    DRAW_FULL_CORE_ALPHA: 1.0,       // FULL設定時のレーザー中心コアの不透明度
    DRAW_LITE_WIDTH: 4,              // LITE/NONE設定時のレーザーの太さ
    DRAW_LITE_ALPHA: 1.0             // LITE/NONE設定時のレーザーの不透明度
};

export const POPUP_EFFECT_CONFIG = {
    FLOAT_TEXT_DURATION_MS: 2400, // ポップアップ・フローティングテキストの持続時間
    FLOAT_TEXT_OFFSET: {          // ポップアップ・フローティングテキストの各属性向けY軸オフセット
        DAMAGE: -20,
        HEAL: 20,
        EXP: 40
    },
    FLOAT_TEXT_LAYOUT: {
        NUMBER_SCALE: 1.125,      // 数字スプライトのスケール
        LABEL_SCALE: 0.75,        // ラベル（Damage等）のスケール
        PADDING_NUM: 12,          // 数字の左右余白（スケール乗算前）
        PADDING_LBL: 12,          // ラベルの左右余白（スケール乗算前）
        GAP: 1,                   // ラベルと数字の間のY軸ギャップ
        LABEL_Y_BASE: 46,         // ラベルのY座標計算用基準値
        NUM_Y_BASE: 16,           // 数字のY座標計算用基準値
        NUM_HEIGHT: 54,           // 数字部分の高さ（スケール乗算前）
        RANDOM_X_RANGE: 40        // 表示位置Xのランダムなばらつき範囲
    },
    FLOAT_TEXT_ANIM: {
        PHASE1_END: 0.15,         // アニメーションフェーズ1（出現・拡大）の終了進行度
        PHASE2_END: 0.30,         // アニメーションフェーズ2（縮小安定）の終了進行度
        INITIAL_OFFSET_Y: 10,     // 出現時の初期Yオフセット
        INITIAL_SCALE: 0.8,       // 出現時の初期スケール
        PHASE1_TARGET_SCALE: 1.1, // フェーズ1終了時の到達スケール
        PHASE2_TARGET_SCALE: 1.0, // フェーズ2終了時の到達スケール（通常サイズ）
        PHASE3_FINAL_OFFSET_Y: -60 // フェーズ3終了時（消滅時）の最終Yオフセット移動量
    }
};

export const PRISM_FLUCTUATION_CONFIG = {
    MAX_ENERGY: 150,        // 1波あたりの最大エネルギー量（視覚的な最大強度の上限）
    MIN_THICKNESS: 5,      // 波紋線の最低太さ
    MAX_THICKNESS: 90,      // 波紋線の最大太さ（MAX_ENERGY到達時）
    MULTI_INTERVAL_MS: 350, // マルチ波紋が発生する際の時間差（ミリ秒）
    DECAY_RATE: 0.98,        // 分割された2波目以降の波紋に掛かるエネルギーの指数減衰率
    PROGRESS_SPEED: 0.002,  // 波紋が広がる基本速度（毎フレーム加算される進行度）
    MAX_RADIUS_MULTI: 1.0,  // 波紋の最大広がり半径（画面サイズの何倍まで広がるか）
    MIN_ENERGY_RATIO: 0.001, // 波紋が完全に消滅するエネルギー残量の閾値
    MID_ALPHA_MULTI: 0.85,   // 波紋のグラデーション中間点における不透明度の倍率
    COMPOSITE_OP: 'source-over' // 波紋の合成モード ('lighter'で加算発光、'source-over'等)
};

// ========================================================
// 【2】フェイズ時間に属するエフェクト設定
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.2
export const WHITE_PHASE_EFFECT_CONFIG = {
    WHITE_PHASE_GLOW: { SCALE: 0.85, ALPHA: 0.5 }, // ホワイトフェイズ中の宝石スプライト白化オーバードライブのスケールと透明度
    GEM_GLITCH: {
        THRESHOLD: WHITE_PHASE_GLOBAL_THRESHOLD, // 宝石グリッチ開始閾値（モジュール内共通定数を参照）
        OFFSET_PROB: 0.5, // 座標ズレが発生する確率乗数
        OFFSET_AMP: 10,   // 座標ズレの最大ピクセル幅
        SCALE_PROB: 0.2,  // スケール変動が発生する確率乗数
        SCALE_AMP: 0.4    // スケール変動の最大振幅幅
    },
    // ※ホワイトフェイズ中の「ゲージ自体の明滅速度」に関する設定は、
    // 依存関係分離のため GAUGE_ANIM_CONFIG.WHITE_PHASE (システム現実時間) 側に定義されています。
    WHITE_SCORE_GLOW: { BLUR: 15, HUE_SPEED: 0.5, POWER_TEXT_COLOR: '#FF0000' }, // ホワイトフェイズ中のスコアポップアップ虹色オーバードライブ用設定
    PHASE_WHITE: {
        // フェイズシフト全体時間は下記[1]~[4]の合計
        STASIS_DELAY_MS: 1500,   // [1] パズル停止・無音化のタメ時間 (ms)
        TRIBAL_TOTAL_MS: 5000,      // [2] トライバル展開の合計時間 (ms)
        TRANSITION_IN_EXPAND_MS: 2000,   // [3] 大膨張トランジション・イン時間 (ms)
        TRANSITION_OUT_WIPE_MS: 3000,    // [4] 透明ワイプ・波紋トランジション・アウト時間 (ms)

        STASIS_ENTER_FADE_MS: 500,  // ステイシス突入時（ゆっくり止まる）のフェード時間 (ms)
        STASIS_EXIT_FADE_MS: 500,   // ステイシス解除時（ゆっくり動き出す）のフェード時間 (ms)
        // トライバル展開時間内の時間配分ウェイト
        TRIBAL_WEIGHTS: {
            DRAW: 0.3,    // 円のラインを描画する時間
            THICKEN: 0.2, // ラインを太くしてドーナツ状にする時間
            WAIT: 0.2,    // 完成したまま待機する時間
            FADE: 0.3     // 白くフェード・発光する時間
        },
        TRIBAL_RADIUS_OUTER: 300, // トライバルの半径設定：最も外側の円の半径
        TRIBAL_RADIUS_INNER: 40,  // トライバルの半径設定：最も内側の円の半径
        LOG_POS_Y: 490,     // ログ表示のY座標基準位置
        LOG_TOTAL_MS: 7000, // [5] ログ全体の表示時間 (ms)
        // システムログの行ごとの表示タイミングウェイトとYオフセット
        LOG_TIMINGS: [
            { weight: 0.05, offsetY: 0, text: "SPATIAL POSSIBILITY FRAGMENTS : CRITICAL" },
            { weight: 0.15, offsetY: 24, text: "AVERAGING EXISTENCE PROBABILITIES..." },
            { weight: 0.25, offsetY: 48, text: "INITIATING PHASE TRANSITION..." },
            { weight: 0.40, offsetY: 96, text: "[ PHASE SHIFT ]" },
            { weight: 0.70, offsetY: 150, text: "\" WHITE STASIS \"" }
        ]
    },
    PHASE_WHITE_EXIT: {
        STASIS_DELAY_MS: 1500,         // [1] 初期タメ時間・ステイシス移行期間 (ms)
        TRIBAL_TOTAL_MS: 5000,        // [2] トライバル逆再生の全体時間 (ms)
        TRANSITION_OUT_WIPE_MS: 4000, // [3] トランジションアウト（ホワイトワイプアウト・波紋）の時間 (ms)

        STASIS_ENTER_FADE_MS: 500,    // 物理エンジンのタイムスケール停止フェード時間 (ms)
        STASIS_EXIT_FADE_MS: 500,     // ステイシス解除（物理エンジンのタイムスケール復帰）フェード時間 (ms)
        TRIBAL_WEIGHTS: {             // トライバル逆再生のアニメーション比率
            FADE: 0.3,
            WAIT_1: 0.2,
            THICKEN: 0.3,
            WAIT_2: 0.2,
            DRAW: 0.4,
            WAIT_3: 0.2
        },
        TRIBAL_RADIUS_OUTER: 300,     // トライバルの半径設定：最も外側の円の半径
        TRIBAL_RADIUS_INNER: 40,      // トライバルの半径設定：最も内側の円の半径
        LOG_POS_Y: 490,               // ログ表示のY座標基準位置
        LOG_TOTAL_MS: 7000,           // ログ全体の表示時間 (ms)
        // システムログの行ごとの表示タイミングウェイトとYオフセット
        LOG_TIMINGS: [
            { weight: 0.15, offsetY: 24, text: "PHASE STABILIZATION : FAILED" },
            { weight: 0.25, offsetY: 48, text: "REVERTING TO FRAGMENTED DIMENSION..." },
            { weight: 0.40, offsetY: 96, text: "[ PHASE ROLLBACK ]" },
            { weight: 0.70, offsetY: 150, text: "\" SEVENTH PALETTE \"" }
        ]
    }
};

// ========================================================
// 【3】システム現実時間に属するエフェクト設定 (realDelta依存)
// ========================================================
// リンク: PROJECT_EFFECT.md > 2.3
export const RIPPLE_CONFIG = {
    RIPPLE_DURATION_MS: 350,
    COMPOSITE_OP: 'lighter',         // 波紋の合成モード
    ANIM: {
        PHASE1_END: 0.55,            // アニメーション前半（フェーズ1）の終了進行度 (0.0〜1.0)
        PHASE1_TARGET_SCALE: 0.8,    // フェーズ1終了時の到達スケール
        PHASE1_TARGET_OPACITY: 0.8,  // フェーズ1終了時の到達不透明度
        PHASE2_TARGET_SCALE: 1.0,    // フェーズ2終了時の到達スケール
        PHASE2_TARGET_OPACITY: 0.0,  // フェーズ2終了時の到達不透明度
        MIN_SCALE: 0.01              // 描画エラー（scale(0)）を防ぐための最小スケール
    }
};

export const GAUGE_ANIM_CONFIG = {
    DAMAGE_PAUSE_MS: 500, // ダメージ時のライフ減少（decay）の一時停止時間
    DAMAGE_RED_MS: 500,   // ダメージ後の赤ゲージ（追従ゲージ）が残る時間
    DAMAGE_FLASH_MS: 150, // FULLエフェクト時のダメージフラッシュ（発光）時間
    HEAL_PAUSE_MS: 500,   // 回復時のライフ減少（decay）の一時停止時間
    HEAL_GREEN_MS: 500,   // 回復時の緑ゲージ（増加アニメーション）の時間
    HEAL_FLASH_MS: 150,   // FULLエフェクト時の回復フラッシュ（発光）時間
    EXP_FLASH_MS: 200,    // レベルアップ時のEXPフラッシュ（発光）時間
    EXP_ANIM: {
        SPEED_MULT: 0.15, // EXPバーアニメーション時の差分加算倍率
        MIN_STEP: 5       // EXPバーアニメーション時の最低加算値
    },
    WHITE_PHASE: {
        //ゲージ点滅時の色設定は Config.js > LIFE_CONFIG を参照
        GLITCH_THRESHOLD: WHITE_PHASE_GLOBAL_THRESHOLD, // ゲージ明滅（グリッチ）開始閾値（モジュール内共通定数を参照）
        FLICKER_SPEED_BASE: 0.001, // ホワイトフェイズ中のゲージ明滅の基本速度
        FLICKER_SPEED_MAX: 0.03     // ホワイトフェイズ中のゲージ明滅の最大速度
    }
};

export const VISUALIZER_CONFIG = {
    // 描画負荷（EFFECT_LEVEL）ごとのビジュアライザ解像度設定
    PRESETS: {
        FULL: { FFT_SIZE: 16384, TITLE_STEP_X: 3, PUZZLE_STEP_X: 4 }, // 高画質（細かい波形）
        LITE: { FFT_SIZE: 4096, TITLE_STEP_X: 6, PUZZLE_STEP_X: 8 },  // 中画質
        NONE: { FFT_SIZE: 2048, TITLE_STEP_X: 9, PUZZLE_STEP_X: 12 }  // 低画質・描画スキップ用
    },

    // 全体・共通挙動
    SPIKE_AMPLITUDE: 5.0,        // 宝石破壊時などに波形が跳ね上がる「スパイク」の初期強度（倍率）
    AMPLITUDE_DECAY: 0.1,        // 跳ね上がったスパイク強度が通常(1.0)に減衰していく速度（0.0〜1.0）
    TARGET_EASING: 0.05,         // 各色の波形が目標の高さ（EXP効率等）へ滑らかに変化するための追従係数
    WAVE_POWER: 1.2,             // (予備) 波形の全体的な出力調整用乗数

    // WAVEモード専用設定（オシロスコープ風の滑らかな波形）
    WAVE_AMP_BASE: 0.015,        // 波形の基本振幅（画面幅に対する割合）
    WAVE_AMP_AUDIO_MULTI: 0.02,  // オーディオ入力（BGM音量）に比例して波形が広がる幅の倍率
    WAVE_AMP_SPIKE_MULTI: 0.03,  // 宝石破壊等のスパイク時に波形が広がる幅の倍率

    // BLOCKモード専用設定（レベルメーター風のブロック波形）
    BLOCK_PULSE_SPEED_1: 2,      // 常時の脈動（ランダムな揺らぎ）の速度パラメータ1
    BLOCK_PULSE_SPEED_2: 3.5,    // 常時の脈動（ランダムな揺らぎ）の速度パラメータ2
    BLOCK_PULSE_AMP: 0.015,      // 常時の脈動の振幅（揺れ幅）
    BLOCK_AUDIO_PULSE_SPEED: 15, // オーディオ入力（BGM）に反応して揺れる速度
    BLOCK_AUDIO_PULSE_AMP: 0.08, // オーディオ入力（BGM）に反応して揺れる振幅
    BLOCK_SPIKE_BONUS_MULTI: 0.05, // 宝石破壊スパイク発生時、ブロックが右へ跳ね上がる距離の乗数

    // GLITCHモード専用設定（心電図風のノイズ波形）
    GLITCH_TIME_MULTI: 2.0,      // ランダムグリッチ（ノイズ）の発生判定に用いる時間乗数
    GLITCH_THRESHOLD: 0.99,      // この閾値を超えた場合にグリッチ波形が発生する
    GLITCH_SPIKE_AMP: 3.0        // グリッチ発生時のスパイク（波）の振幅(px)
};

// ========================================================
// 【4】その他・未分類
// ========================================================
export const EFFECT_MATH_CONFIG = {
    WHITE_PHASE_GLITCH_THRESHOLD: undefined,
    WHITE_PHASE_GLOW: undefined,
    WHITE_PHASE_FLICKER_SPEED_BASE: undefined,
    WHITE_PHASE_FLICKER_SPEED_MAX: undefined,
    WHITE_SCORE_GLOW: undefined,
    LASER_SHRINK_TIMER: undefined,
    SHRINK_BASE: undefined,
    SHRINK_MIN: undefined,
    SHRINK_LEVEL_MULTI: undefined,
    FLASH_BASE: undefined,
    FLASH_MAX: undefined,
    FLASH_LEVEL_MULTI: undefined,
    PULSE_SPEED: undefined,
    PULSE_MULTI: undefined,
    SPARK_COUNT_MULTI: undefined,
    BURST_SPARK_COUNT_MULTI: undefined,
    SHAKE_DURATION_MS: undefined,
    RIPPLE_DURATION_MS: undefined,
    FLOAT_TEXT_DURATION_MS: undefined,
    FLOAT_TEXT_OFFSET: undefined,
    TRIBAL_UNLOCK: undefined,
    PRISM_LINK: undefined,
    PHASE_WHITE: undefined,
    PHASE_WHITE_EXIT: undefined,
    PARTICLE: undefined,
    RESULT_GLITCH: {
        DURATION_MS: 250,
        SLICE_HEIGHT: 8,
        BASE_OFFSET_AMP: 8,
        NOISE_PROBABILITY: 0.1,
        NOISE_OFFSET_AMP: 40,
        COLOR_R: 'rgba(255, 0, 0, 0.8)',
        COLOR_C: 'rgba(0, 255, 255, 0.8)',
        COLOR_SHIFT_R: -5,
        COLOR_SHIFT_C: 5
    },
    // フルプリズムリンク（7色リンク）達成時の波紋（余波）演出
    PRISM_FLUCTUATION: undefined
};
