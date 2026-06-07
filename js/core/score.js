// score.js

const SCORE_UNITS = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極'];

/**
 * コアロジック: スコアをトークン配列にパースする
 * @param {BigInt|Number|String} value スコア
 * @param {Number} maxDigits 最大表示桁数（0 の場合は無制限でスライスなし）
 * @returns {Array} トークン配列
 */
export function generateScoreData(value, maxDigits = 0) {
    let str = value.toString();
    let data = [];

    let length = str.length;
    let omitCount = (maxDigits > 0 && length > maxDigits) ? Math.ceil((length - maxDigits) / 4) : 0;
    let displayStr = str.slice(0, length - omitCount * 4);

    let baseUnitStr = '';
    let baseTier = 0;
    if (omitCount > 0) {
        let baseUnitIndex = omitCount - 1;
        let loopCount = Math.floor(baseUnitIndex / 12);
        let actualUnitIndex = baseUnitIndex % 12;
        baseUnitStr = SCORE_UNITS[actualUnitIndex];
        baseTier = loopCount;
    }

    for (let i = 0; i < displayStr.length; i++) {
        let k = displayStr.length - 1 - i;
        let char = displayStr[i];

        data.push({ type: 'char', value: char });

        let power = k + omitCount * 4;
        if (power > 0 && power % 4 === 0 && power > omitCount * 4) {
            let unitIndex = (power / 4) - 1;
            let loopCount = Math.floor(unitIndex / 12);
            let actualUnitIndex = unitIndex % 12;
            let unitString = SCORE_UNITS[actualUnitIndex];
            data.push({ type: 'unit-ruby', value: unitString, tier: loopCount });
        }
    }

    if (baseUnitStr) {
        data.push({ type: 'unit-base', value: baseUnitStr, tier: baseTier });
    }

    return data;
}

/**
 * トークン配列を DOM 用の HTML 文字列に変換する
 * @param {Array} scoreData トークン配列
 * @returns {String} HTML文字列
 */
export function renderScoreToHtml(scoreData) {
    let result = '';
    for (let i = 0; i < scoreData.length; i++) {
        const item = scoreData[i];
        
        if (item.type === 'char') {
            const nextItem = i + 1 < scoreData.length ? scoreData[i + 1] : null;
            if (nextItem && nextItem.type === 'unit-ruby') {
                const asterisks = '*'.repeat(nextItem.tier);
                const tierClass = nextItem.tier > 0 ? `tier-${Math.min(nextItem.tier, 3)}` : '';
                result += `<span class="digit-with-unit"><span class="digit">${item.value}</span><span class="unit-ruby ${tierClass}" data-asterisks="${asterisks}">${nextItem.value}</span></span>`;
                i++; // unit-ruby をスキップ
            } else {
                result += item.value;
            }
        } else if (item.type === 'unit-base') {
            const asterisks = '*'.repeat(item.tier);
            const tierClass = item.tier > 0 ? `tier-${Math.min(item.tier, 3)}` : '';
            result += `<span class="unit-base-slot"><span class="unit-base ${tierClass}" data-asterisks="${asterisks}">${item.value}</span></span>`;
        }
    }
    return result;
}

/**
 * トークン配列を純粋なテキスト文字列に変換する
 * @param {Array} scoreData トークン配列
 * @returns {String} テキスト文字列
 */
export function renderScoreToText(scoreData) {
    return scoreData.map(item => item.value).join('');
}
