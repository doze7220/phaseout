// score.js
import { GameState } from './config.js';

const SCORE_UNITS = ['万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗', '正', '載', '極'];

export function formatScore(value) {
    if (value < 10000) {
        return Math.floor(value).toString();
    }
    
    let exp = Math.floor(Math.log10(value));
    let unitPower = Math.floor(exp / 4); 
    
    let index = unitPower - 1; 
    let loopCount = Math.floor(index / 12);
    let unitIndex = index % 12;

    let unitString = SCORE_UNITS[unitIndex];
    for (let i = 0; i < loopCount; i++) {
        unitString += '極';
    }
    
    let divisor = Math.pow(10, unitPower * 4);
    let num = value / divisor;
    
    // 小数点を含めずに最大4桁（整数部の桁数に応じて小数部の桁数を調整）
    let intLen = Math.floor(num).toString().length;
    let decimalLen = Math.max(0, 4 - intLen);
    
    let numStr;
    if (decimalLen === 0) {
        numStr = Math.floor(num).toString();
    } else {
        let factor = Math.pow(10, decimalLen);
        let val = Math.floor(num * factor + 1e-9) / factor;
        numStr = val.toString(); // 余分な0（末尾の0や完全に0の小数部）を自動で省略
    }
    
    return numStr + unitString;
}
