/**
 * 2D raycasting visibility polygon.
 * Returns a flat Konva points array [x0,y0,x1,y1,...] of the visibility polygon.
 *
 * @param {{ x: number, y: number }} origin  - observer position in stage coords
 * @param {number} radiusPx                  - vision radius in pixels
 * @param {{ id, x1, y1, x2, y2 }[]} walls  - wall segments
 * @returns {number[]} flat points array
 */
export function computeLoS(origin, radiusPx, walls) {
    const EPS = 1e-8;

    // A bounding box (slightly beyond radiusPx) guarantees every ray hits
    // something and the polygon always closes cleanly.
    const pad = radiusPx + 1;
    const bboxWalls = [
        { x1: origin.x - pad, y1: origin.y - pad, x2: origin.x + pad, y2: origin.y - pad },
        { x1: origin.x + pad, y1: origin.y - pad, x2: origin.x + pad, y2: origin.y + pad },
        { x1: origin.x + pad, y1: origin.y + pad, x2: origin.x - pad, y2: origin.y + pad },
        { x1: origin.x - pad, y1: origin.y + pad, x2: origin.x - pad, y2: origin.y - pad },
    ];
    const allWalls = walls.length > 0 ? [...walls, ...bboxWalls] : bboxWalls;

    // Collect candidate angles — one triple per wall endpoint plus a uniform
    // ring so open areas form a smooth circle (not a polygon following bbox).
    // The ±0.0001 offset ensures rays land on both sides of every vertex,
    // preventing gaps at wall endpoints (standard Red Blob Games technique).
    const angles = [];
    for (const w of allWalls) {
        for (const pt of [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }]) {
            const a = Math.atan2(pt.y - origin.y, pt.x - origin.x);
            angles.push(a - 0.0001, a, a + 0.0001);
        }
    }
    // Uniform ring of 64 rays — gives a smooth circular boundary in open space.
    const RING = 64;
    for (let i = 0; i < RING; i++) {
        angles.push(-Math.PI + (i / RING) * 2 * Math.PI);
    }
    angles.sort((a, b) => a - b);

    // Cast each ray, find the nearest wall intersection.
    // Result points are clamped to radiusPx so open areas form a circle boundary.
    const result = [];
    for (const angle of angles) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        let minT = Infinity;
        for (const w of allWalls) {
            // Parametric ray-segment intersection.
            // Ray:     R(t) = origin + t*(dx,dy)
            // Segment: S(u) = (w.x1,w.y1) + u*((w.x2-w.x1),(w.y2-w.y1))
            //
            // Using 2D cross product (a,b)×(c,d) = a*d - b*c:
            //   denom = d × seg
            //   t     = (P-O) × seg / denom
            //   u     = (P-O) × d   / denom
            const segX = w.x2 - w.x1;
            const segY = w.y2 - w.y1;
            const denom = dx * segY - dy * segX;
            if (Math.abs(denom) < EPS) continue; // parallel

            const vx = w.x1 - origin.x;
            const vy = w.y1 - origin.y;
            const t = (vx * segY - vy * segX) / denom;
            const u = (vx * dy  - vy * dx)  / denom;

            if (t >= 0 && u >= 0 && u <= 1) {
                if (t < minT) minT = t;
            }
        }

        // Clamp to radiusPx: bbox walls are at pad = radiusPx+1 so minT ≤ radiusPx+1;
        // clamping brings open-area points to exactly the vision circle boundary.
        const t = Math.min(minT === Infinity ? radiusPx : minT, radiusPx);
        result.push(origin.x + dx * t, origin.y + dy * t);
    }

    return result;
}
