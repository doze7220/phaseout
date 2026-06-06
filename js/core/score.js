// score.js
import { AppConfig } from './config.js';

const SCORE_UNITS = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極'];

export function formatScore(value) {
    let str = value.toString();

    // フル桁表示のみ使用
    // フル桁表示
    const MAX_DIGITS = AppConfig.SCORE_MAX_DISPLAY_DIGITS || 13;
    let length = str.length;
    let omitCount = length > MAX_DIGITS ? Math.ceil((length - MAX_DIGITS) / 4) : 0;
    let displayStr = str.slice(0, length - omitCount * 4);

    let baseUnitStr = '';
    let baseAsterisks = '';
    let baseTierClass = '';
    if (omitCount > 0) {
        let baseUnitIndex = omitCount - 1;
        let loopCount = Math.floor(baseUnitIndex / 12);
        let actualUnitIndex = baseUnitIndex % 12;
        baseUnitStr = SCORE_UNITS[actualUnitIndex];
        baseAsterisks = '*'.repeat(loopCount);
        baseTierClass = loopCount > 0 ? `tier-${Math.min(loopCount, 3)}` : '';
    }

    let result = '';
    for (let i = 0; i < displayStr.length; i++) {
        let k = displayStr.length - 1 - i; // 右からのインデックス (0始まり)
        let char = displayStr[i];

        let power = k + omitCount * 4;
        // 省略時のベース単位（右端）は小さく（ruby）せず、通常サイズで末尾に付与するため除外
        if (power > 0 && power % 4 === 0 && power > omitCount * 4) {
            let unitIndex = (power / 4) - 1;
            let loopCount = Math.floor(unitIndex / 12);
            let actualUnitIndex = unitIndex % 12;
            let unitString = SCORE_UNITS[actualUnitIndex];
            let asterisks = '*'.repeat(loopCount);
            let tierClass = loopCount > 0 ? `tier-${Math.min(loopCount, 3)}` : '';

            char = `<span class="digit-with-unit"><span class="digit">${char}</span><span class="unit-ruby ${tierClass}" data-asterisks="${asterisks}">${unitString}</span></span>`;
        }

        result += char;
    }

    if (baseUnitStr) {
        result += `<span class="unit-base-slot">`;
        result += `<span class="unit-base ${baseTierClass}" data-asterisks="${baseAsterisks}">${baseUnitStr}</span>`;
        result += `</span>`;
    }

    return result;
}

export function formatResultScore(value) {
    let str = value.toString();
    let length = str.length;

    let result = '';
    for (let i = 0; i < length; i++) {
        let k = length - 1 - i;
        let char = str[i];

        if (i > 0 && (k + 1) % 20 === 0) {
            result += `<br>`;
        }

        if (k % 4 === 0) {
            if (k > 0) {
                let unitIndex = (k / 4) - 1;
                let loopCount = Math.floor(unitIndex / 12);
                let actualUnitIndex = unitIndex % 12;
                let unitString = SCORE_UNITS[actualUnitIndex];
                let asterisks = '*'.repeat(loopCount);
                let tierClass = loopCount > 0 ? `tier-${Math.min(loopCount, 3)}` : '';

                char = `<span class="digit-with-unit"><span class="digit">${char}</span><span class="unit-ruby ${tierClass}" data-asterisks="${asterisks}">${unitString}</span></span>`;
            } else {
                char = `<span class="digit-with-unit"><span class="digit">${char}</span><span class="unit-ruby" style="visibility: hidden;">万</span></span>`;
            }
        }

        result += char;
    }

    return result;
}

export function parseScoreData(value, ignoreMaxDigits = false) {
    let str = value.toString();
    let data = [];

    // フル桁表示のみ使用
    const MAX_DIGITS = AppConfig.SCORE_MAX_DISPLAY_DIGITS || 13;
    let length = str.length;
    let omitCount = (!ignoreMaxDigits && length > MAX_DIGITS) ? Math.ceil((length - MAX_DIGITS) / 4) : 0;
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
