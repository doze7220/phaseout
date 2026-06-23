// effectConfig.js

export const GRAPHICS_CONFIG = {
    GEM_STYLE: 'overlay', // 'h-light', 'overlay', 'flat' のいずれか
    SHOW_SYMBOL: true, // トライバル刻印の表示ON/OFF
    GEM_OUTLINE: 'FULL' // 'FULL', 'LINE', 'NONE' のいずれか
};

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
    DECAY_RAND: 0.03         // パーティクルおよび火花の寿命減衰（消失）速度のランダム加算値
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
    BURST_SPARK_COUNT_MULTI: 10      // レーザー到達時等に発生する大火花（バーストスパーク）の生成数倍率
};

export const POPUP_EFFECT_CONFIG = {
    FLOAT_TEXT_DURATION_MS: 2400, // ポップアップ・フローティングテキストの持続時間
    FLOAT_TEXT_OFFSET: {          // ポップアップ・フローティングテキストの各属性向けY軸オフセット
        DAMAGE: -20,
        HEAL: 20,
        EXP: 40
    }
};

export const EFFECT_MATH_CONFIG = {
    WHITE_PHASE_GLITCH_THRESHOLD: 0.9, // シフトゲージおよび宝石がグリッチを起こし始める残量閾値(0.0〜1.0)
    WHITE_PHASE_GLOW: { SCALE: 0.85, ALPHA: 0.5 }, // ホワイトフェイズ中の宝石スプライト白化オーバードライブのスケールと透明度
    WHITE_PHASE_FLICKER_SPEED_BASE: 0.00001, // ホワイトフェイズ中のシフトゲージ明滅の基本速度（残量60%時、約2秒周期）
    WHITE_PHASE_FLICKER_SPEED_MAX: 0.006, // ホワイトフェイズ中のシフトゲージ明滅の最大速度（残量0%時、約0.2秒周期）
    WHITE_SCORE_GLOW: { BLUR: 15, HUE_SPEED: 0.5, POWER_TEXT_COLOR: '#FF0000' }, // ホワイトフェイズ中のスコアポップアップ虹色オーバードライブ用設定
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
    SHAKE_DURATION_MS: 500,
    RIPPLE_DURATION_MS: 350,
    FLOAT_TEXT_DURATION_MS: undefined,
    FLOAT_TEXT_OFFSET: undefined,
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
        MERGE_DURATION_MS: 400,
        STAY_DURATION_MS: 1000,
        EXPAND_DURATION_MS: 300,
        SUBLIMATION_TRIBAL_OUTER_R: 60,            // アステライア紋章のUI用外側半径
        SUBLIMATION_TRIBAL_INNER_R: 8,            // アステライア紋章のUI用内側半径
        SUBLIMATION_TRIBAL_LINE_WIDTH: 8,          // 紋章のライン太さ
        SUBLIMATION_LOG_POS_Y: -10,                // ログ表示位置のYオフセット（中央基準）
        SUBLIMATION_LOG_TIMINGS: [                 // 昇華時のシステムログ
            { weight: 0.1, offsetY: 0, text: "PHASE SHIFT PREDICTION..." },
            { weight: 0.3, offsetY: 24, text: "ASTRAEA SUBLIMATION" }
        ]
    },
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
    },
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
    PRISM_FLUCTUATION: {
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
    }
};
