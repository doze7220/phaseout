// CharacterData.js
// キャラクターの不変のマスターデータを定義する

/**
 * キャラクターマスターデータ
 * パズル中に参照される各エージェントの静的パラメータ
 */
export const CharacterData = {
    "char_ruvie": {
        id: "char_ruvie",
        name: "ルビィ",
        imagePath: "assets/img/char/GC_001_01_01_01.png",
        skillId: "skill_ruby_bullet",
        maxCharge: 100,
        colorId: "Red"
    },
    "char_cyan": {
        id: "char_cyan",
        name: "シアン",
        imagePath: "assets/img/char/GC_001_01_01_01.png",
        skillName: "タイム・フリーズ",
        maxCharge: 100,
        colorId: "CYAN"
    },
    "char_elie": {
        id: "char_elie",
        name: "エリー",
        imagePath: "assets/img/char/GC_001_01_01_01.png",
        skillName: "エメラルド・ヒール",
        maxCharge: 100,
        colorId: "GREEN"
    }
};
