import type { Wall } from "./types";

const EPS = 0.15; // ft tolerance to consider two endpoints "the same"

interface Pt { x: number; y: number }

function near(a: Pt, b: Pt, eps = EPS) {
  return Math.hypot(a.x - b.x, a.y - b.y) < eps;
}

/**
 * Try to chain a set of walls into a closed polygon by matching endpoints.
 * Returns the ordered vertex list (without repeating the first), or null
 * if the walls don't form a single closed loop.
 *
 * Curved walls are treated as straight segments between their endpoints
 * for area purposes (good-enough approximation for most floor plans).
 */
export function chainWallsToPolygon(walls: Wall[]): Pt[] | null {
  if (walls.length < 3) return null;

  // Convert each wall to {a, b}
  const segs = walls.map((w) => ({
    a: { x: w.x1, y: w.y1 },
    b: { x: w.x2, y: w.y2 },
    used: false,
  }));

  const poly: Pt[] = [];
  // Start from first wall's a -> b
  segs[0].used = true;
  poly.push(segs[0].a, segs[0].b);
  let current = segs[0].b;

  for (let step = 0; step < segs.length; step++) {
    let foundIdx = -1;
    let foundPt: Pt | null = null;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].used) continue;
      if (near(segs[i].a, current)) { foundIdx = i; foundPt = segs[i].b; break; }
      if (near(segs[i].b, current)) { foundIdx = i; foundPt = segs[i].a; break; }
    }
    if (foundIdx === -1) break;
    segs[foundIdx].used = true;
    if (!foundPt) break;
    if (near(foundPt, poly[0])) {
      current = foundPt;
      break;
    }
    poly.push(foundPt);
    current = foundPt;
  }

  if (segs.some((s) => !s.used)) return null;
  if (!near(current, poly[0])) return null;
  return poly;
}

/** Shoelace area, returns absolute value in ft². */
export function polygonArea(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

// =====================================================================
// Snapping helpers
// =====================================================================

export type SnapKind = "endpoint" | "edge" | "axis" | "grid";
export interface SnapResult { x: number; y: number; kind: SnapKind | null; }

/**
 * Project point onto segment, returning closest point and squared distance.
 */
function projectOnSegment(p: Pt, a: Pt, b: Pt): { pt: Pt; d: number } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const pt = { x: a.x + t * dx, y: a.y + t * dy };
  return { pt, d: Math.hypot(pt.x - p.x, pt.y - p.y) };
}

/**
 * Multi-priority snap: endpoint > edge > axis(from ref) > grid.
 * `ignoreWallId` excludes the currently dragged wall from candidate set.
 * `axisRef` enables horizontal/vertical alignment to that point.
 */
export function smartSnap(
  p: Pt,
  walls: Wall[],
  opts: {
    radius?: number;
    ignoreWallId?: string;
    axisRef?: Pt | null;
    gridStep?: number;
  } = {},
): SnapResult {
  const radius = opts.radius ?? 0.6;
  const gridStep = opts.gridStep ?? 0.5;

  // 1) endpoints (highest priority)
  let best: SnapResult = { x: p.x, y: p.y, kind: null };
  let bestD = radius;
  for (const w of walls) {
    if (w.id === opts.ignoreWallId) continue;
    for (const c of [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }]) {
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) { bestD = d; best = { x: c.x, y: c.y, kind: "endpoint" }; }
    }
  }
  if (best.kind === "endpoint") return best;

  // 2) edges (project onto wall line)
  bestD = radius;
  for (const w of walls) {
    if (w.id === opts.ignoreWallId) continue;
    const r = projectOnSegment(p, { x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 });
    if (r.d < bestD) { bestD = r.d; best = { x: r.pt.x, y: r.pt.y, kind: "edge" }; }
  }
  if (best.kind === "edge") return best;

  // 3) axis alignment with reference point
  if (opts.axisRef) {
    const ax = Math.abs(p.x - opts.axisRef.x);
    const ay = Math.abs(p.y - opts.axisRef.y);
    if (ax < radius && ax <= ay) return { x: opts.axisRef.x, y: p.y, kind: "axis" };
    if (ay < radius) return { x: p.x, y: opts.axisRef.y, kind: "axis" };
  }

  // 4) grid
  return {
    x: Math.round(p.x / gridStep) * gridStep,
    y: Math.round(p.y / gridStep) * gridStep,
    kind: "grid",
  };
}

// =====================================================================
// Auto room detection — find all minimal cycles in the wall graph.
// =====================================================================

export interface DetectedRoom {
  polygon: Pt[];
  area: number;
}

interface Node { id: number; x: number; y: number; }
interface Edge { a: number; b: number; }

/**
 * Build a planar graph from walls (snapping nearby endpoints together),
 * then find all minimal interior faces using a left-turn traversal.
 * Skips the unbounded outer face.
 */
export function detectAllRooms(walls: Wall[]): DetectedRoom[] {
  if (walls.length < 3) return [];

  const nodes: Node[] = [];
  const findOrAdd = (p: Pt): number => {
    for (const n of nodes) if (near(n, p, 0.25)) return n.id;
    const id = nodes.length;
    nodes.push({ id, x: p.x, y: p.y });
    return id;
  };

  const edgeSet = new Set<string>();
  const edges: Edge[] = [];
  for (const w of walls) {
    const a = findOrAdd({ x: w.x1, y: w.y1 });
    const b = findOrAdd({ x: w.x2, y: w.y2 });
    if (a === b) continue;
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    edges.push({ a, b });
  }

  // adjacency: for each node, list of {to, angle}
  const adj: { to: number; angle: number }[][] = nodes.map(() => []);
  for (const e of edges) {
    const ang1 = Math.atan2(nodes[e.b].y - nodes[e.a].y, nodes[e.b].x - nodes[e.a].x);
    const ang2 = Math.atan2(nodes[e.a].y - nodes[e.b].y, nodes[e.a].x - nodes[e.b].x);
    adj[e.a].push({ to: e.b, angle: ang1 });
    adj[e.b].push({ to: e.a, angle: ang2 });
  }
  for (const list of adj) list.sort((p, q) => p.angle - q.angle);

  // Traverse each directed half-edge once. From each, take the "next clockwise" edge at the destination.
  const visited = new Set<string>();
  const faces: number[][] = [];
  for (const e of edges) {
    for (const [from, to] of [[e.a, e.b], [e.b, e.a]] as const) {
      const startKey = `${from}>${to}`;
      if (visited.has(startKey)) continue;
      const face: number[] = [from];
      let cur = from, nxt = to;
      let safety = 0;
      while (safety++ < 500) {
        visited.add(`${cur}>${nxt}`);
        face.push(nxt);
        // At nxt, find edge coming back from cur, then take the previous one in CCW order (= next CW).
        const list = adj[nxt];
        const incomingAngle = Math.atan2(nodes[cur].y - nodes[nxt].y, nodes[cur].x - nodes[nxt].x);
        // Find index of incoming
        let idx = list.findIndex((x) => x.to === cur && Math.abs(x.angle - incomingAngle) < 1e-6);
        if (idx === -1) idx = list.findIndex((x) => x.to === cur);
        if (idx === -1) break;
        const nextIdx = (idx - 1 + list.length) % list.length;
        const next = list[nextIdx];
        if (next.to === face[0] && nxt === face[face.length - 1]) {
          // closed
          if (visited.has(`${nxt}>${next.to}`)) break;
          visited.add(`${nxt}>${next.to}`);
          break;
        }
        cur = nxt;
        nxt = next.to;
        if (face.length > 100) break;
      }
      if (face.length >= 4 && face[0] === face[face.length - 1]) {
        faces.push(face.slice(0, -1));
      } else if (face.length >= 3) {
        // Ensure last connects back
        const last = face[face.length - 1];
        if (last === face[0]) faces.push(face.slice(0, -1));
      }
    }
  }

  // Convert to polygons; reject the outer (CCW signed area negative) face — keep only positive (CW in screen coords = interior).
  // Actually since y grows downward in screen space, the *outer* face has the largest absolute area & opposite sign. Keep faces with positive signed shoelace and drop the largest one (the outer hull).
  const polys: { polygon: Pt[]; area: number; signed: number }[] = faces.map((face) => {
    const pts = face.map((id) => ({ x: nodes[id].x, y: nodes[id].y }));
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      s += a.x * b.y - b.x * a.y;
    }
    return { polygon: pts, area: Math.abs(s) / 2, signed: s };
  }).filter((p) => p.area > 1);

  if (polys.length === 0) return [];
  // Drop the outer face: largest area face.
  const maxArea = Math.max(...polys.map((p) => p.area));
  return polys
    .filter((p) => p.area < maxArea - 0.001)
    .map((p) => ({ polygon: p.polygon, area: p.area }));
}

/** Bounding rect of a polygon. */
export function polygonBounds(poly: Pt[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
