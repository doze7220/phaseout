// score.js
import { getScoreRate, CORE_MATH_CONFIG } from './config.js';
import { PHASE_WHITE } from './PhaseManager.js';

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

/**
 * コアロジック: チェインごとのスコアを算出する
 * @param {Number} chainCount 連鎖数
 * @param {Number} depth 最大深度
 * @param {String} phaseName 現在のフェイズ名
 * @param {Number} currentLevel 現在のレベル
 * @returns {BigInt} 算出されたスコア
 */
export function calculateChainScore(chainCount, depth, phaseName, currentLevel) {
    if (chainCount < 3) return 0n;
    
    const bigChainCount = BigInt(Math.floor(chainCount));
    const depthDivisor = BigInt(CORE_MATH_CONFIG.DEPTH_BONUS_DIVISOR);
    const depthBonusMul = depthDivisor + BigInt(Math.floor(depth));
    const rateNumber = getScoreRate(currentLevel);
    
    let points = 0n;
    if (phaseName === PHASE_WHITE) {
        // ホワイトフェイズ中はスコアボーナスを3乗化: (chain - 2) ^ 3
        const chainBonusWhite = bigChainCount <= 2n ? 1n : (bigChainCount - 2n) ** 3n;
        points = (BigInt(Math.floor(rateNumber)) * chainBonusWhite * depthBonusMul) / depthDivisor;
    } else {
        // 通常: (chain - 2) ^ 2
        const chainBonus = bigChainCount <= 2n ? 1n : (bigChainCount - 2n) ** 2n;
        points = (BigInt(Math.floor(rateNumber)) * chainBonus * depthBonusMul) / depthDivisor;
    }
    
    return points;
}
