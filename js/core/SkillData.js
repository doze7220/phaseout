// SkillData.js
// スキルのマスターデータを定義する

/**
 * スキルマスターデータ
 * 各スキルの静的パラメータや発動タイプを管理する
 */
export const SkillData = {
    "skill_ruby_bullet": {
        id: "skill_ruby_bullet",
        name: "RUBY BULLET",
        activationType: "AUTO",
        type: "DESTROY_EXCLUDE_COLOR",
        excludeColorId: "RED",
        effectValue: 10,
        intervalFrames: 10,
        markerImagePath: "assets/img/skilleffect/bulletholes.png"
    }
};
