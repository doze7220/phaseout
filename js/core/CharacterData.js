// CharacterData.js
// キャラクターの不変のマスターデータを定義する

/**
 * キャラクターマスターデータ
 * パズル中に参照される各エージェントの静的パラメータ
 */
export const CharacterData = {
    "char_ruvie": {
        id: "char_ruvie",
        name: "ルヴィ",
        imagePath: "assets/img/char/GC_001_01_01_01.png", // UI用画像パス(仮)
        skillName: "RUBY BULLET",
        maxCharge: 100 // 最大チャージ量(仮)
    },
    "char_cyan": {
        id: "char_cyan",
        name: "シアン (青)",
        imagePath: "assets/img/char/GC_001_01_01_01.png",
        skillName: "タイム・フリーズ",
        maxCharge: 100
    },
    "char_elie": {
        id: "char_elie",
        name: "エリー (緑)",
        imagePath: "assets/img/char/GC_001_01_01_01.png",
        skillName: "エメラルド・ヒール",
        maxCharge: 100
    }
};
