// ChainAlgorithm.js
// パズル盤面の接続判定および連鎖グループ探索（BFS）を担当する純粋な計算モジュール。
// GameState や描画・エフェクト（effects.js）への依存を一切持たない。
// 必要なパラメータ（接続閾値、デバッグ倍率）はすべて引数として外部から注入する。

/**
 * 2つの宝石が接触・近接しているかを判定する。
 * @param {import('matter-js').Body} g1 - 宝石1（Matter.js Body）
 * @param {import('matter-js').Body} g2 - 宝石2（Matter.js Body）
 * @param {number} connectionThreshold - 接続判定の閾値（config.js の CONNECTION_THRESHOLD）
 * @param {number} bfsMultiplier - デバッグ用BFS判定倍率（GameState.debug.bfsMultiplier）
 * @returns {boolean} 接触・近接していれば true
 */
export function areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier) {
    const dx = g1.position.x - g2.position.x;
    const dy = g1.position.y - g2.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (g1.customRadius + g2.customRadius + (connectionThreshold * bfsMultiplier));
}

/**
 * 画面上の全宝石の隣接リスト（無向グラフ）を構築する。
 * @param {import('matter-js').Body[]} activeGems - 削除対象を除外した宝石の配列
 * @param {number} connectionThreshold - 接続判定の閾値
 * @param {number} bfsMultiplier - デバッグ用BFS判定倍率
 * @returns {Map<number, import('matter-js').Body[]>} 宝石IDをキーとした隣接リストのMap
 */
export function getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier) {
    const adjList = new Map();
    activeGems.forEach(g => adjList.set(g.id, []));

    for (let i = 0; i < activeGems.length; i++) {
        for (let j = i + 1; j < activeGems.length; j++) {
            const g1 = activeGems[i];
            const g2 = activeGems[j];
            if (areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier)) {
                adjList.get(g1.id).push(g2);
                adjList.get(g2.id).push(g1);
            }
        }
    }
    return adjList;
}

/**
 * BFS（幅優先探索）により、起点宝石から同色で繋がっている連鎖グループを抽出する。
 * 戻り値の levels はレーザーアニメーション（animateLaserLevels）の深度進行に必要な
 * BFS階層ごとの接続ペア情報を含む。
 * @param {import('matter-js').Body} startGem - 起点の宝石（タップされた宝石）
 * @param {import('matter-js').Body[]} activeGems - 削除対象を除外した宝石の配列
 * @param {number} connectionThreshold - 接続判定の閾値
 * @param {number} bfsMultiplier - デバッグ用BFS判定倍率
 * @returns {{ chainGems: import('matter-js').Body[], levels: Array<Array<{from: import('matter-js').Body, to: import('matter-js').Body}>> }}
 *   - chainGems: 連鎖グループに含まれる全宝石の配列（起点を含む）
 *   - levels:    BFS各階層の接続ペア配列（レーザーアニメーション用）
 */
export function findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier) {
    const adjList = getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier);

    const visited = new Set();
    visited.add(startGem.id);

    const targetColorId = startGem.colorId;

    const levels = [];
    const chainGems = [startGem];
    let currentLevelNodes = [startGem];

    // BFS: 同色で近接している宝石を階層ごとに展開する
    while (currentLevelNodes.length > 0) {
        const nextLevelNodes = [];
        const currentLevelConnections = [];

        for (const current of currentLevelNodes) {
            const neighbors = adjList.get(current.id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && neighbor.colorId === targetColorId) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({
                        from: current,
                        to: neighbor
                    });
                }
            }
        }

        if (currentLevelConnections.length > 0) {
            levels.push(currentLevelConnections);
        }
        currentLevelNodes = nextLevelNodes;
    }

    return { chainGems, levels };
}
