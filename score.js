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
    
    // 小数点以下は4桁目以降を切り捨て（足切り）、常に第3位までゼロ埋め
    let numFloorStr = (Math.floor(num * 1000 + 1e-9) / 1000).toFixed(3);
    
    return numFloorStr + unitString;
}
