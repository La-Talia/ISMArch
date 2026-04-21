import type { Wall } from "./types";

const EPS = 0.15; // ft tolerance to consider two endpoints "the same"

interface Pt { x: number; y: number }

function near(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y) < EPS;
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
    // Don't push if it closes the loop — we'll detect closure below
    if (near(foundPt, poly[0])) {
      current = foundPt;
      break;
    }
    poly.push(foundPt);
    current = foundPt;
  }

  // Check all walls were used and we're closed
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
