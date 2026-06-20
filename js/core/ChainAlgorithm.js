// ChainAlgorithm.js
// パズル盤面の接続判定および連鎖グループ探索（BFS）を担当する純粋な計算モジュール。
// GameState や描画・エフェクト（effects.js）への依存を一切持たない。
// 必要なパラメータ（接続閾値、デバッグ倍率）はすべて引数として外部から注入する。

/**
 * 点 p から線分 ab への最短距離を計算するヘルパー関数
 * @param {number} px 
 * @param {number} py 
 * @param {number} ax 
 * @param {number} ay 
 * @param {number} bx 
 * @param {number} by 
 * @returns {number} 最短距離
 */
function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
    if (l2 === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
    
    // 線分上の投影点の割合tを計算し、0〜1にクランプ
    let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = ax + t * (bx - ax);
    const projY = ay + t * (by - ay);
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Bodyから基本となる判定半径を取得するヘルパー関数
 * @param {import('matter-js').Body} body 
 * @returns {number} 基本半径
 */
function getBaseRadius(body) {
    if (body.circleRadius) return body.circleRadius;
    
    // 多角形の場合はローカル座標系でのAABBから幅と高さを出し、短い方の半分を返す
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const cos = Math.cos(-body.angle);
    const sin = Math.sin(-body.angle);
    
    for (const v of body.vertices) {
        const dx = v.x - body.position.x;
        const dy = v.y - body.position.y;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        if (localX < minX) minX = localX;
        if (localX > maxX) maxX = localX;
        if (localY < minY) minY = localY;
        if (localY > maxY) maxY = localY;
    }
    const width = maxX - minX;
    const height = maxY - minY;
    return Math.min(width, height) / 2;
}

/**
 * 長方形の中心から長辺に沿った内部の線分（芯）を算出するヘルパー関数
 * @param {import('matter-js').Body} body 
 * @returns {{p1: {x: number, y: number}, p2: {x: number, y: number}}} 芯の線分
 */
function getCapsuleSegment(body) {
    const v0 = body.vertices[0];
    const v1 = body.vertices[1];
    const v2 = body.vertices[2];
    
    const dx1 = v1.x - v0.x;
    const dy1 = v1.y - v0.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    
    const dx2 = v2.x - v1.x;
    const dy2 = v2.y - v1.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
    let longerLen, shorterLen;
    let dirX, dirY; 
    
    if (len1 > len2) {
        longerLen = len1;
        shorterLen = len2;
        dirX = dx1 / len1;
        dirY = dy1 / len1;
    } else {
        longerLen = len2;
        shorterLen = len1;
        dirX = dx2 / len2;
        dirY = dy2 / len2;
    }
    
    const baseRadius = shorterLen / 2;
    const coreHalfLen = (longerLen / 2) - baseRadius;
    
    if (coreHalfLen <= 0) {
        return { p1: body.position, p2: body.position };
    }
    
    return {
        p1: { x: body.position.x + dirX * coreHalfLen, y: body.position.y + dirY * coreHalfLen },
        p2: { x: body.position.x - dirX * coreHalfLen, y: body.position.y - dirY * coreHalfLen }
    };
}

/**
 * 2つの宝石が接触・近接しているかを判定する。
 * 長方形の場合はカプセル判定（芯からの距離）を用いて繋がりやすさを向上させる。
 * @param {import('matter-js').Body} g1 - 宝石1（Matter.js Body）
 * @param {import('matter-js').Body} g2 - 宝石2（Matter.js Body）
 * @param {number} connectionThreshold - 接続判定の閾値（config.js の CONNECTION_THRESHOLD）
 * @param {number} bfsMultiplier - デバッグ用BFS判定倍率（GameState.debug.bfsMultiplier）
 * @returns {boolean} 接触・近接していれば true
 */
export function areGemsTouching(g1, g2, connectionThreshold, bfsMultiplier) {
    const r1 = getBaseRadius(g1);
    const r2 = getBaseRadius(g2);
    const threshold = connectionThreshold * bfsMultiplier;
    
    const isRect1 = g1.shapeKey === 'rectangle';
    const isRect2 = g2.shapeKey === 'rectangle';
    
    if (isRect1 || isRect2) {
        const seg1 = isRect1 ? getCapsuleSegment(g1) : { p1: g1.position, p2: g1.position };
        const seg2 = isRect2 ? getCapsuleSegment(g2) : { p1: g2.position, p2: g2.position };
        
        let dist;
        if (isRect1 && isRect2) {
            // 両方が長方形の場合: 計算コスト削減のため、片方の線分ともう片方の中心点の距離を双方向で取り短い方を採用
            const d1 = pointToSegmentDistance(g2.position.x, g2.position.y, seg1.p1.x, seg1.p1.y, seg1.p2.x, seg1.p2.y);
            const d2 = pointToSegmentDistance(g1.position.x, g1.position.y, seg2.p1.x, seg2.p1.y, seg2.p2.x, seg2.p2.y);
            dist = Math.min(d1, d2);
        } else if (isRect1) {
            dist = pointToSegmentDistance(g2.position.x, g2.position.y, seg1.p1.x, seg1.p1.y, seg1.p2.x, seg1.p2.y);
        } else {
            dist = pointToSegmentDistance(g1.position.x, g1.position.y, seg2.p1.x, seg2.p1.y, seg2.p2.x, seg2.p2.y);
        }
        return dist < (r1 + r2 + threshold);
    } else {
        // どちらも長方形以外の場合は従来通り中心点同士の距離
        const dx = g1.position.x - g2.position.x;
        const dy = g1.position.y - g2.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (r1 + r2 + threshold);
    }
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
 * 2つの宝石がプリズムリンクの条件を満たすかを判定する。
 * 通常時はスペクトル順（一方通行: 0->1->2->3->4->5->6->0）にリンクする。
 * ホワイトフェイズ時は逆順（6->5->4->3->2->1->0->6）にリンクする。
 * @param {number} colorId1 - リンク元の宝石のcolorId（0〜6）
 * @param {number} colorId2 - リンク先の宝石のcolorId（0〜6）
 * @param {boolean} isWhitePhase - ホワイトフェイズ中かどうか
 * @returns {boolean} 条件を満たしていればtrue
 */
export function isPrismLinked(colorId1, colorId2, isWhitePhase = false) {
    if (isWhitePhase) {
        return colorId2 === (colorId1 + 6) % 7;
    }
    return colorId2 === (colorId1 + 1) % 7;
}

/**
 * BFS（幅優先探索）により、起点宝石から同色またはプリズムリンク（隣接色）で
 * 繋がっている連鎖グループを抽出する（Depthベース優先順位付きBFS）。
 * 同色クラスタを優先スキャンし、その後で隣接色をスキャンする。
 * 戻り値の levels はレーザーアニメーション（animateLaserLevels）の深度進行に必要な
 * BFS階層ごとの接続ペア情報を含む。
 * @param {import('matter-js').Body} startGem - 起点の宝石（タップされた宝石）
 * @param {import('matter-js').Body[]} activeGems - 削除対象を除外した宝石の配列
 * @param {number} connectionThreshold - 接続判定の閾値
 * @param {number} bfsMultiplier - デバッグ用BFS判定倍率
 * @param {boolean} isWhitePhase - ホワイトフェイズ中かどうか
 * @returns {{ chainGems: import('matter-js').Body[], levels: Array<Array<{from: import('matter-js').Body, to: import('matter-js').Body}>> }}
 *   - chainGems: 連鎖グループに含まれる全宝石の配列（起点を含む）
 *   - levels:    BFS各階層の接続ペア配列（レーザーアニメーション用）
 */
export function findChainGroup(startGem, activeGems, connectionThreshold, bfsMultiplier, isWhitePhase = false) {
    const adjList = getAdjacencyList(activeGems, connectionThreshold, bfsMultiplier);
    const visited = new Set();
    visited.add(startGem.id);

    const levels = [];
    const chainGems = [startGem];
    let currentLevelNodes = [startGem];

    // BFS: 階層ごとに同色優先スキャン -> プリズムリンク後回しスキャン
    while (currentLevelNodes.length > 0) {
        const nextLevelNodes = [];
        const currentLevelConnections = [];

        // ── Step 1: 現在の階層の全ノードに対して「同色」を優先スキャン ──
        for (const current of currentLevelNodes) {
            const neighbors = adjList.get(current.id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && neighbor.colorId === current.colorId) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({ from: current, to: neighbor });
                }
            }
        }

        // ── Step 2: 現在の階層の全ノードに対して「Pリンク（隣接色）」を後回しスキャン ──
        for (const current of currentLevelNodes) {
            const neighbors = adjList.get(current.id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id) && isPrismLinked(current.colorId, neighbor.colorId, isWhitePhase)) {
                    visited.add(neighbor.id);
                    nextLevelNodes.push(neighbor);
                    chainGems.push(neighbor);
                    currentLevelConnections.push({ from: current, to: neighbor });
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
