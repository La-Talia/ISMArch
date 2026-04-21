import type { PlanData, Wall, Opening, Room, PropItem, FloorData } from "./types";

// Minimal DXF (R12 ASCII) writer. Units = feet. Y is flipped so the drawing
// reads the same orientation as on screen (DXF Y is "up").
//
// Layers:
//   WALLS, OPENINGS, ROOMS, ROOM_LABELS, DIMENSIONS, PROPS, PLOT
//
// Furniture (PROPS layer) can be excluded via options.

interface ExportOptions {
  includeFurniture: boolean;
  // Whether to flatten all floors into one drawing or just the active floor
  floorIndex?: number; // if undefined -> all floors stacked horizontally
  floorGapFt?: number;
}

const HEADER = (minX: number, minY: number, maxX: number, maxY: number) => `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$INSUNITS
70
2
9
$EXTMIN
10
${minX}
20
${minY}
9
$EXTMAX
10
${maxX}
20
${maxY}
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
8
${["WALLS", "OPENINGS", "ROOMS", "ROOM_LABELS", "DIMENSIONS", "PROPS", "PLOT", "CUSTOM_DIM"]
  .map((n, i) => `0
LAYER
2
${n}
70
0
62
${[7, 5, 3, 8, 6, 4, 1, 2][i]}
6
CONTINUOUS`)
  .join("\n")}
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

const FOOTER = `0
ENDSEC
0
EOF
`;

function line(layer: string, x1: number, y1: number, x2: number, y2: number) {
  return `0
LINE
8
${layer}
10
${x1}
20
${y1}
11
${x2}
21
${y2}
`;
}

function text(layer: string, x: number, y: number, height: number, value: string) {
  return `0
TEXT
8
${layer}
10
${x}
20
${y}
40
${height}
1
${value.replace(/\n/g, " ")}
`;
}

function polyline(layer: string, pts: { x: number; y: number }[], closed = false) {
  let out = `0
POLYLINE
8
${layer}
66
1
70
${closed ? 1 : 0}
`;
  for (const p of pts) {
    out += `0
VERTEX
8
${layer}
10
${p.x}
20
${p.y}
`;
  }
  out += `0
SEQEND
`;
  return out;
}

function circle(layer: string, x: number, y: number, r: number) {
  return `0
CIRCLE
8
${layer}
10
${x}
20
${y}
40
${r}
`;
}

function arc(layer: string, x: number, y: number, r: number, start: number, end: number) {
  return `0
ARC
8
${layer}
10
${x}
20
${y}
40
${r}
50
${start}
51
${end}
`;
}

// Sample a quadratic bezier into N segments
function sampleQuad(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, n = 24) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push({
      x: u * u * x1 + 2 * u * t * cx + t * t * x2,
      y: u * u * y1 + 2 * u * t * cy + t * t * y2,
    });
  }
  return pts;
}

function emitFloor(f: FloorData, offsetX: number, opts: ExportOptions, flipY: number): string {
  // flipY: subtract Y from this so coords go up in DXF
  const fx = (x: number) => x + offsetX;
  const fy = (y: number) => flipY - y;

  let out = "";

  // Plot boundary
  if (f.plot && f.plot.points.length >= 3) {
    out += polyline("PLOT", f.plot.points.map((p) => ({ x: fx(p.x), y: fy(p.y) })), true);
  } else {
    const b = f.bounds;
    out += polyline(
      "PLOT",
      [
        { x: fx(b.x), y: fy(b.y) },
        { x: fx(b.x + b.w), y: fy(b.y) },
        { x: fx(b.x + b.w), y: fy(b.y + b.h) },
        { x: fx(b.x), y: fy(b.y + b.h) },
      ],
      true,
    );
  }

  // Rooms
  for (const r of f.rooms) {
    out += polyline(
      "ROOMS",
      [
        { x: fx(r.x), y: fy(r.y) },
        { x: fx(r.x + r.w), y: fy(r.y) },
        { x: fx(r.x + r.w), y: fy(r.y + r.h) },
        { x: fx(r.x), y: fy(r.y + r.h) },
      ],
      true,
    );
    out += text("ROOM_LABELS", fx(r.x + r.w / 2 + (r.labelDx || 0)) - 1.5, fy(r.y + r.h / 2 + (r.labelDy || 0)), 0.7, r.name);
  }

  // Walls (2 parallel lines for thickness, plus end caps)
  for (const w of f.walls) {
    const half = w.thickness / 2;
    if (w.cx !== undefined && w.cy !== undefined) {
      const pts = sampleQuad(w.x1, w.y1, w.cx, w.cy, w.x2, w.y2);
      out += polyline("WALLS", pts.map((p) => ({ x: fx(p.x), y: fy(p.y) })));
    } else {
      const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len; // perpendicular
      out += line("WALLS", fx(w.x1 + nx * half), fy(w.y1 + ny * half), fx(w.x2 + nx * half), fy(w.y2 + ny * half));
      out += line("WALLS", fx(w.x1 - nx * half), fy(w.y1 - ny * half), fx(w.x2 - nx * half), fy(w.y2 - ny * half));
      out += line("WALLS", fx(w.x1 + nx * half), fy(w.y1 + ny * half), fx(w.x1 - nx * half), fy(w.y1 - ny * half));
      out += line("WALLS", fx(w.x2 + nx * half), fy(w.y2 + ny * half), fx(w.x2 - nx * half), fy(w.y2 - ny * half));
    }
  }

  // Openings
  for (const o of f.openings) {
    const w = f.walls.find((ww) => ww.id === o.wallId);
    if (!w) continue;
    const cx = w.x1 + (w.x2 - w.x1) * o.t;
    const cy = w.y1 + (w.y2 - w.y1) * o.t;
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const ax = cx - (ux * o.width) / 2, ay = cy - (uy * o.width) / 2;
    const bx = cx + (ux * o.width) / 2, by = cy + (uy * o.width) / 2;
    out += line("OPENINGS", fx(ax), fy(ay), fx(bx), fy(by));
    if (o.kind === "door") {
      const swing = o.swing ?? 1;
      out += arc("OPENINGS", fx(ax), fy(ay), o.width, 0, 90 * swing);
    }
  }

  // Custom dimensions
  for (const d of f.customDimensions || []) {
    const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const off = d.offset || 1.5;
    const ax = d.x1 + nx * off, ay = d.y1 + ny * off;
    const bx = d.x2 + nx * off, by = d.y2 + ny * off;
    out += line("CUSTOM_DIM", fx(ax), fy(ay), fx(bx), fy(by));
    out += line("CUSTOM_DIM", fx(d.x1), fy(d.y1), fx(ax), fy(ay));
    out += line("CUSTOM_DIM", fx(d.x2), fy(d.y2), fx(bx), fy(by));
    out += text("CUSTOM_DIM", fx((ax + bx) / 2), fy((ay + by) / 2), 0.6, `${len.toFixed(2)}'`);
  }

  // Furniture
  if (opts.includeFurniture) {
    for (const p of f.props) {
      const halfW = p.w / 2, halfH = p.h / 2;
      const rot = ((p.rotation || 0) * Math.PI) / 180;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const corners = [
        [-halfW, -halfH],
        [halfW, -halfH],
        [halfW, halfH],
        [-halfW, halfH],
      ].map(([x, y]) => ({
        x: fx(p.x + x * cs - y * sn),
        y: fy(p.y + x * sn + y * cs),
      }));
      out += polyline("PROPS", corners, true);
      out += text("PROPS", fx(p.x) - 1, fy(p.y), 0.5, p.label || p.type);
    }
  }

  return out;
}

export function exportDXF(plan: PlanData, opts: ExportOptions) {
  const floors = opts.floorIndex !== undefined ? [plan.floors[opts.floorIndex]] : plan.floors;
  const gap = opts.floorGapFt ?? 10;

  // bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cursor = 0;
  const offsets: number[] = [];
  let maxH = 0;
  for (const fm of floors) {
    offsets.push(cursor);
    const b = fm.data.bounds;
    cursor += b.w + gap;
    if (b.h > maxH) maxH = b.h;
  }
  const flipY = maxH; // flip baseline

  let body = "";
  floors.forEach((fm, i) => {
    body += `0
TEXT
8
0
10
${offsets[i]}
20
${flipY + 2}
40
1.2
1
${fm.name}
`;
    body += emitFloor(fm.data, offsets[i], opts, flipY);
  });

  floors.forEach((fm, i) => {
    const b = fm.data.bounds;
    minX = Math.min(minX, offsets[i] + b.x);
    maxX = Math.max(maxX, offsets[i] + b.x + b.w);
    minY = Math.min(minY, flipY - (b.y + b.h));
    maxY = Math.max(maxY, flipY - b.y);
  });

  const dxf = HEADER(minX, minY, maxX, maxY) + body + FOOTER;

  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe = (plan.projectName || "project").replace(/[^a-z0-9-_]+/gi, "_");
  const suffix = opts.includeFurniture ? "with-furniture" : "no-furniture";
  a.download = `${safe}-${suffix}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
