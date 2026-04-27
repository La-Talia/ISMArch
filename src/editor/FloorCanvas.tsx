import React from "react";
import { PROP_CATALOG } from "./propCatalog";
import { PX_PER_FT } from "./types";
import type { CustomDimension, FloorData, Opening, PropItem, Wall } from "./types";
import { smartSnap, type SnapKind } from "./geom";

export type CanvasMode = "select" | "dimension";

interface Props {
  floor: FloorData;
  selection: { kind: string; id: string } | null;
  setSelection: (s: { kind: "prop" | "wall" | "opening" | "room" | "room_label" | "dimension"; id: string } | null) => void;
  updateProp: (id: string, patch: Partial<PropItem>) => void;
  updateWall: (id: string, patch: Partial<Wall>) => void;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  updateRoom: (id: string, patch: Partial<import("./types").Room>) => void;
  showDimensions: boolean;
  showGrid: boolean;
  zoom: number;
  onCursor?: (ft: { x: number; y: number } | null) => void;
  mode: CanvasMode;
  snap: boolean;
  addCustomDimension: (d: Omit<CustomDimension, "id">) => void;
  updateCustomDimension: (id: string, patch: Partial<CustomDimension>) => void;
  removeCustomDimension: (id: string) => void;
  selectedWallIds: string[];
  toggleWallInSelection: (id: string) => void;
  enclosedAreaPolygon: { x: number; y: number }[] | null;
}

type DragState =
  | { kind: "prop_move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: "prop_resize"; id: string; corner: "se" | "sw" | "ne" | "nw"; origW: number; origH: number; origX: number; origY: number; startX: number; startY: number }
  | { kind: "prop_rotate"; id: string; cx: number; cy: number; startAngle: number; origRotation: number; shift: boolean }
  | { kind: "wall_endpoint"; id: string; end: 1 | 2; }
  | { kind: "wall_curve"; id: string }
  | { kind: "wall_move"; id: string; horizontal: boolean; startX: number; startY: number; origX1: number; origY1: number; origX2: number; origY2: number }
  | { kind: "opening_slide"; id: string; wall: Wall }
  | { kind: "room_move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: "room_label_move"; id: string; startX: number; startY: number; origDx: number; origDy: number }
  | { kind: "dim_offset"; id: string; nx: number; ny: number; baseX: number; baseY: number; origOffset: number };

export const FloorCanvas: React.FC<Props> = ({
  floor, selection, setSelection, updateProp, updateWall, updateOpening, updateRoom, showDimensions, showGrid,
  zoom, onCursor, mode, snap, addCustomDimension, updateCustomDimension, removeCustomDimension,
  selectedWallIds, toggleWallInSelection, enclosedAreaPolygon,
}) => {
  const padding = 8;
  const widthFt = floor.bounds.w + padding * 2;
  const heightFt = floor.bounds.h + padding * 2;
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [dimStart, setDimStart] = React.useState<{ x: number; y: number } | null>(null);
  const [hoverPt, setHoverPt] = React.useState<{ x: number; y: number } | null>(null);
  const [snapHint, setSnapHint] = React.useState<{ x: number; y: number; kind: SnapKind } | null>(null);

  const toFt = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x / PX_PER_FT - padding, y: local.y / PX_PER_FT - padding };
  };

  // Snap a point using multi-priority snapper. Reports a visual hint for non-grid snaps.
  const snapPoint = (
    p: { x: number; y: number },
    opts: { ignoreWallId?: string; axisRef?: { x: number; y: number } | null; report?: boolean } = {},
  ) => {
    if (!snap) {
      if (opts.report) setSnapHint(null);
      return p;
    }
    const r = smartSnap(p, floor.walls, {
      ignoreWallId: opts.ignoreWallId,
      axisRef: opts.axisRef ?? null,
      radius: 0.6,
      gridStep: 0.25,
    });
    if (opts.report) {
      if (r.kind && r.kind !== "grid") setSnapHint({ x: r.x, y: r.y, kind: r.kind });
      else setSnapHint(null);
    }
    return { x: r.x, y: r.y };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const ft = toFt(e.clientX, e.clientY);
    onCursor?.(ft);
    if (mode === "dimension") {
      setHoverPt(snapPoint(ft, { report: true }));
    }
    const ds = dragRef.current;
    if (!ds) return;
    const { x, y } = ft;
    if (ds.kind === "prop_move") {
      const dx = x - ds.startX, dy = y - ds.startY;
      updateProp(ds.id, { x: Math.round((ds.origX + dx) * 4) / 4, y: Math.round((ds.origY + dy) * 4) / 4 });
    } else if (ds.kind === "prop_resize") {
      const dx = x - ds.startX, dy = y - ds.startY;
      let nw = ds.origW, nh = ds.origH, nx = ds.origX, ny = ds.origY;
      if (ds.corner === "se") { nw = Math.max(0.5, ds.origW + dx); nh = Math.max(0.5, ds.origH + dy); }
      if (ds.corner === "ne") { nw = Math.max(0.5, ds.origW + dx); nh = Math.max(0.5, ds.origH - dy); ny = ds.origY + (ds.origH - nh) / 2 + dy / 2; }
      if (ds.corner === "sw") { nw = Math.max(0.5, ds.origW - dx); nh = Math.max(0.5, ds.origH + dy); nx = ds.origX + (ds.origW - nw) / 2 + dx / 2; }
      if (ds.corner === "nw") { nw = Math.max(0.5, ds.origW - dx); nh = Math.max(0.5, ds.origH - dy); nx = ds.origX + (ds.origW - nw) / 2 + dx / 2; ny = ds.origY + (ds.origH - nh) / 2 + dy / 2; }
      updateProp(ds.id, { w: Math.round(nw * 4) / 4, h: Math.round(nh * 4) / 4, x: nx, y: ny });
    } else if (ds.kind === "prop_rotate") {
      const ang = Math.atan2(y - ds.cy, x - ds.cx) * 180 / Math.PI;
      let next = ds.origRotation + (ang - ds.startAngle);
      // Snap to 15° when Shift held
      if (e.shiftKey) next = Math.round(next / 15) * 15;
      // Normalize to [-180, 180]
      next = ((next + 180) % 360 + 360) % 360 - 180;
      updateProp(ds.id, { rotation: Math.round(next * 10) / 10 });
    } else if (ds.kind === "wall_endpoint") {
      const w = floor.walls.find((w) => w.id === ds.id);
      if (!w) return;
      const sn = (v: number) => Math.round(v * 4) / 4;
      const horizontal = w.y1 === w.y2;
      if (ds.end === 1) {
        if (horizontal) updateWall(w.id, { x1: sn(x) });
        else updateWall(w.id, { y1: sn(y) });
      } else {
        if (horizontal) updateWall(w.id, { x2: sn(x) });
        else updateWall(w.id, { y2: sn(y) });
      }
    } else if (ds.kind === "wall_move") {
      const sn = (v: number) => Math.round(v * 4) / 4;
      if (ds.horizontal) {
        const dy = y - ds.startY;
        const ny = sn(ds.origY1 + dy);
        updateWall(ds.id, { y1: ny, y2: ny });
      } else {
        const dx = x - ds.startX;
        const nx = sn(ds.origX1 + dx);
        updateWall(ds.id, { x1: nx, x2: nx });
      }
    } else if (ds.kind === "wall_curve") {
      updateWall(ds.id, { cx: Math.round(x * 4) / 4, cy: Math.round(y * 4) / 4 });
    } else if (ds.kind === "opening_slide") {
      const w = ds.wall;
      const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      const dx = x - w.x1, dy = y - w.y1;
      const proj = (dx * (w.x2 - w.x1) + dy * (w.y2 - w.y1)) / (len * len);
      updateOpening(ds.id, { t: Math.max(0.05, Math.min(0.95, proj)) });
    } else if (ds.kind === "room_move") {
      const dx = x - ds.startX, dy = y - ds.startY;
      updateRoom(ds.id, {
        x: Math.round((ds.origX + dx) * 4) / 4,
        y: Math.round((ds.origY + dy) * 4) / 4,
      });
    } else if (ds.kind === "room_label_move") {
      const dx = x - ds.startX, dy = y - ds.startY;
      updateRoom(ds.id, {
        labelDx: Math.round((ds.origDx + dx) * 4) / 4,
        labelDy: Math.round((ds.origDy + dy) * 4) / 4,
      });
    } else if (ds.kind === "dim_offset") {
      // project cursor displacement onto the dimension's normal
      const proj = (x - ds.baseX) * ds.nx + (y - ds.baseY) * ds.ny;
      updateCustomDimension(ds.id, { offset: Math.round((ds.origOffset + proj) * 100) / 100 });
    }
  };
  const onPointerUp = () => { dragRef.current = null; };
  const onPointerLeave = () => { onCursor?.(null); setHoverPt(null); };

  const startPropDrag = (p: PropItem, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "prop", id: p.id });
    const { x, y } = toFt(e.clientX, e.clientY);
    dragRef.current = { kind: "prop_move", id: p.id, startX: x, startY: y, origX: p.x, origY: p.y };
  };
  const startResize = (p: PropItem, corner: "se" | "sw" | "ne" | "nw", e: React.PointerEvent) => {
    e.stopPropagation();
    const { x, y } = toFt(e.clientX, e.clientY);
    dragRef.current = { kind: "prop_resize", id: p.id, corner, origW: p.w, origH: p.h, origX: p.x, origY: p.y, startX: x, startY: y };
  };
  const startRotate = (p: PropItem, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "prop", id: p.id });
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = toFt(e.clientX, e.clientY);
    const startAngle = Math.atan2(y - p.y, x - p.x) * 180 / Math.PI;
    dragRef.current = {
      kind: "prop_rotate", id: p.id, cx: p.x, cy: p.y,
      startAngle, origRotation: p.rotation || 0, shift: e.shiftKey,
    };
  };
  const startWallEndpointDrag = (w: Wall, end: 1 | 2, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "wall", id: w.id });
    dragRef.current = { kind: "wall_endpoint", id: w.id, end };
  };
  const startWallMove = (w: Wall, e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleWallInSelection(w.id);
      return;
    }
    setSelection({ kind: "wall", id: w.id });
    const { x, y } = toFt(e.clientX, e.clientY);
    dragRef.current = {
      kind: "wall_move", id: w.id, horizontal: w.y1 === w.y2,
      startX: x, startY: y, origX1: w.x1, origY1: w.y1, origX2: w.x2, origY2: w.y2,
    };
  };
  const startOpeningDrag = (o: Opening, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "opening", id: o.id });
    const w = floor.walls.find((w) => w.id === o.wallId);
    if (!w) return;
    dragRef.current = { kind: "opening_slide", id: o.id, wall: w };
  };
  const startRoomDrag = (r: import("./types").Room, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "room", id: r.id });
    const { x, y } = toFt(e.clientX, e.clientY);
    dragRef.current = { kind: "room_move", id: r.id, startX: x, startY: y, origX: r.x, origY: r.y };
  };
  const startRoomLabelDrag = (r: import("./types").Room, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "room_label", id: r.id });
    const { x, y } = toFt(e.clientX, e.clientY);
    dragRef.current = { kind: "room_label_move", id: r.id, startX: x, startY: y, origDx: r.labelDx || 0, origDy: r.labelDy || 0 };
  };

  const ftToPx = (v: number) => (v + padding) * PX_PER_FT;

  // Dimension tool: click to place start, click again to place end
  const handleSvgClick = (e: React.MouseEvent) => {
    if (mode === "dimension") {
      const raw = toFt(e.clientX, e.clientY);
      const p = snapPoint(raw);
      if (!dimStart) {
        setDimStart(p);
      } else {
        if (Math.hypot(p.x - dimStart.x, p.y - dimStart.y) > 0.1) {
          addCustomDimension({ x1: dimStart.x, y1: dimStart.y, x2: p.x, y2: p.y, offset: 1.5 });
        }
        setDimStart(null);
      }
      return;
    }
    if (e.target === svgRef.current) setSelection(null);
  };

  // Compute dynamic SVG sizing (zoom)
  const baseW = widthFt * PX_PER_FT;
  const baseH = heightFt * PX_PER_FT;
  const w = baseW * zoom;
  const h = baseH * zoom;

  return (
    <div className="relative h-full w-full overflow-auto bg-[hsl(var(--blueprint-bg))]"
         onPointerLeave={onPointerLeave}>
      <svg
        ref={svgRef}
        width={w}
        height={h}
        viewBox={`0 0 ${baseW} ${baseH}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={handleSvgClick}
        className={`block touch-none select-none ${mode === "dimension" ? "cursor-crosshair" : ""}`}
        id="floorplan-svg"
        style={{ background: "hsl(var(--blueprint-bg))" }}
      >
        {/* Grid */}
        {showGrid && (
          <g>
            {Array.from({ length: Math.ceil(widthFt) + 1 }).map((_, i) => (
              <line
                key={`vg${i}`}
                x1={i * PX_PER_FT} y1={0} x2={i * PX_PER_FT} y2={heightFt * PX_PER_FT}
                stroke={`hsl(var(--blueprint-grid${i % 5 === 0 ? "-strong" : ""}))`}
                strokeWidth={i % 5 === 0 ? 0.5 : 0.3}
              />
            ))}
            {Array.from({ length: Math.ceil(heightFt) + 1 }).map((_, i) => (
              <line
                key={`hg${i}`}
                x1={0} y1={i * PX_PER_FT} x2={widthFt * PX_PER_FT} y2={i * PX_PER_FT}
                stroke={`hsl(var(--blueprint-grid${i % 5 === 0 ? "-strong" : ""}))`}
                strokeWidth={i % 5 === 0 ? 0.5 : 0.3}
              />
            ))}
          </g>
        )}

        {/* Plot boundary */}
        {floor.plot && floor.plot.points.length >= 3 ? (
          <path
            d={floor.plot.points.map((p, i) => `${i === 0 ? "M" : "L"} ${ftToPx(p.x)} ${ftToPx(p.y)}`).join(" ") + " Z"}
            fill="hsl(var(--room-fill))"
            stroke="hsl(var(--wall))"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ) : (
          <rect
            x={ftToPx(floor.bounds.x)} y={ftToPx(floor.bounds.y)}
            width={floor.bounds.w * PX_PER_FT} height={floor.bounds.h * PX_PER_FT}
            fill="hsl(var(--room-fill))" stroke="hsl(var(--wall))" strokeWidth={3}
          />
        )}

        {/* Enclosed area highlight */}
        {enclosedAreaPolygon && enclosedAreaPolygon.length >= 3 && (
          <path
            d={enclosedAreaPolygon.map((p, i) => `${i === 0 ? "M" : "L"} ${ftToPx(p.x)} ${ftToPx(p.y)}`).join(" ") + " Z"}
            fill="hsl(var(--selection) / 0.18)"
            stroke="hsl(var(--selection))"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            pointerEvents="none"
          />
        )}

        {/* Rooms */}
        <g>
          {floor.rooms.map((r) => {
            const isSel = selection?.kind === "room" && selection.id === r.id;
            const isLabelSel = selection?.kind === "room_label" && selection.id === r.id;
            const lx = ftToPx(r.x + r.w / 2 + (r.labelDx || 0));
            const ly = ftToPx(r.y + r.h / 2 + (r.labelDy || 0));
            const fontSize = Math.min(14, Math.max(9, Math.min(r.w, r.h) * 1.4));
            return (
              <g key={r.id}>
                <rect
                  x={ftToPx(r.x)} y={ftToPx(r.y)}
                  width={r.w * PX_PER_FT} height={r.h * PX_PER_FT}
                  fill={r.fill === "alt" ? "hsl(var(--room-fill-alt))" : "hsl(var(--room-fill))"}
                  stroke={isSel ? "hsl(var(--selection))" : "transparent"}
                  strokeWidth={1.5}
                  className="cursor-move"
                  onPointerDown={(e) => startRoomDrag(r, e)}
                />
                <g
                  onPointerDown={(e) => startRoomLabelDrag(r, e)}
                  className="cursor-move"
                >
                  {isLabelSel && (
                    <rect
                      x={lx - 42} y={ly - fontSize - 2}
                      width={84} height={fontSize * 2 + 8}
                      fill="none" stroke="hsl(var(--selection))" strokeWidth={1} strokeDasharray="3 2"
                    />
                  )}
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fill="hsl(var(--foreground))" fontSize={fontSize}
                    fontFamily="ui-sans-serif, system-ui" className="font-medium select-none">
                    {r.name}
                  </text>
                  <text x={lx} y={ly + fontSize + 2} textAnchor="middle" dominantBaseline="middle"
                    fill="hsl(var(--muted-foreground))" fontSize={9} className="select-none">
                    {r.w.toFixed(1)}' × {r.h.toFixed(1)}'
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Walls */}
        <g>
          {floor.walls.map((w) => {
            const horizontal = w.y1 === w.y2;
            const vertical = w.x1 === w.x2;
            const axisAligned = (horizontal || vertical) && w.cx === undefined;
            const isSel = selection?.kind === "wall" && selection.id === w.id;
            const isMulti = selectedWallIds.includes(w.id);
            const t = w.thickness * PX_PER_FT;
            const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
            const midX = ftToPx((w.x1 + w.x2) / 2);
            const midY = ftToPx((w.y1 + w.y2) / 2);
            const hasCurve = w.cx !== undefined && w.cy !== undefined;
            const x1Px = ftToPx(w.x1), y1Px = ftToPx(w.y1);
            const x2Px = ftToPx(w.x2), y2Px = ftToPx(w.y2);
            const cxPx = hasCurve ? ftToPx(w.cx as number) : (x1Px + x2Px) / 2;
            const cyPx = hasCurve ? ftToPx(w.cy as number) : (y1Px + y2Px) / 2;
            const pathD = hasCurve
              ? `M ${x1Px} ${y1Px} Q ${cxPx} ${cyPx} ${x2Px} ${y2Px}`
              : `M ${x1Px} ${y1Px} L ${x2Px} ${y2Px}`;

            const stroke = isSel ? "hsl(var(--selection))" : isMulti ? "hsl(var(--primary))" : "none";

            return (
              <g key={w.id}>
                {axisAligned ? (
                  <rect
                    x={horizontal ? ftToPx(Math.min(w.x1, w.x2)) : ftToPx(w.x1) - t / 2}
                    y={horizontal ? ftToPx(w.y1) - t / 2 : ftToPx(Math.min(w.y1, w.y2))}
                    width={horizontal ? Math.abs(w.x2 - w.x1) * PX_PER_FT : t}
                    height={horizontal ? t : Math.abs(w.y2 - w.y1) * PX_PER_FT}
                    fill="hsl(var(--wall-fill))"
                    stroke={stroke}
                    strokeWidth={isMulti ? 2 : 1.5}
                    onClick={(e) => { e.stopPropagation(); if (e.shiftKey) toggleWallInSelection(w.id); else setSelection({ kind: "wall", id: w.id }); }}
                    onPointerDown={(e) => startWallMove(w, e)}
                    className={horizontal ? "cursor-ns-resize hover:opacity-80" : "cursor-ew-resize hover:opacity-80"}
                  />
                ) : (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="hsl(var(--wall-fill))"
                    strokeWidth={t}
                    strokeLinecap="butt"
                    onClick={(e) => { e.stopPropagation(); if (e.shiftKey) toggleWallInSelection(w.id); else setSelection({ kind: "wall", id: w.id }); }}
                    onPointerDown={(e) => startWallMove(w, e)}
                    className="cursor-move hover:opacity-80"
                  />
                )}
                {!axisAligned && isMulti && (
                  <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} pointerEvents="none" />
                )}
                {isSel && (
                  <>
                    <g style={{ pointerEvents: "none" }}>
                      <rect x={midX - 22} y={midY - 9} width={44} height={18} rx={3} fill="hsl(var(--selection))" />
                      <text x={midX} y={midY + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize={11} fontFamily="ui-sans-serif, system-ui"
                        fill="hsl(var(--background))" className="font-semibold">
                        {len.toFixed(2)}'
                      </text>
                    </g>
                    <circle cx={x1Px} cy={y1Px} r={6} fill="hsl(var(--selection))"
                      onPointerDown={(e) => startWallEndpointDrag(w, 1, e)} className="cursor-move" />
                    <circle cx={x2Px} cy={y2Px} r={6} fill="hsl(var(--selection))"
                      onPointerDown={(e) => startWallEndpointDrag(w, 2, e)} className="cursor-move" />
                    {hasCurve && (
                      <circle cx={cxPx} cy={cyPx} r={5} fill="hsl(var(--background))"
                        stroke="hsl(var(--selection))" strokeWidth={2}
                        onPointerDown={(e) => { e.stopPropagation(); dragRef.current = { kind: "wall_curve", id: w.id }; }}
                        className="cursor-move" />
                    )}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Openings */}
        <g>
          {floor.openings.map((o) => {
            const w = floor.walls.find((w) => w.id === o.wallId);
            if (!w) return null;
            const cx = w.x1 + (w.x2 - w.x1) * o.t;
            const cy = w.y1 + (w.y2 - w.y1) * o.t;
            const horizontal = w.y1 === w.y2;
            const isSel = selection?.kind === "opening" && selection.id === o.id;
            const wid = o.width * PX_PER_FT;
            const t = w.thickness * PX_PER_FT + 2;
            return (
              <g key={o.id}
                 onClick={(e) => { e.stopPropagation(); setSelection({ kind: "opening", id: o.id }); }}
                 onPointerDown={(e) => startOpeningDrag(o, e)}
                 className="cursor-move">
                <rect
                  x={ftToPx(cx) - (horizontal ? wid / 2 : t / 2)}
                  y={ftToPx(cy) - (horizontal ? t / 2 : wid / 2)}
                  width={horizontal ? wid : t}
                  height={horizontal ? t : wid}
                  fill="hsl(var(--blueprint-bg))"
                  stroke={isSel ? "hsl(var(--selection))" : "none"}
                />
                {o.kind === "door" ? (() => {
                  const hinge = (o.hinge ?? 0) as 0 | 1;
                  const swing = (o.swing ?? 1) as -1 | 1;
                  const cxPx = ftToPx(cx), cyPx = ftToPx(cy);
                  const hxPx = horizontal ? cxPx + (hinge === 0 ? -wid / 2 : wid / 2) : cxPx;
                  const hyPx = horizontal ? cyPx : cyPx + (hinge === 0 ? -wid / 2 : wid / 2);
                  const lxPx = horizontal ? cxPx + (hinge === 0 ? wid / 2 : -wid / 2) : cxPx;
                  const lyPx = horizontal ? cyPx : cyPx + (hinge === 0 ? wid / 2 : -wid / 2);
                  const oxPx = horizontal ? hxPx : hxPx + swing * wid;
                  const oyPx = horizontal ? hyPx + swing * wid : hyPx;
                  const sweep = horizontal
                    ? (hinge === 0 ? (swing === 1 ? 1 : 0) : (swing === 1 ? 0 : 1))
                    : (hinge === 0 ? (swing === 1 ? 0 : 1) : (swing === 1 ? 1 : 0));
                  return (
                    <>
                      <line x1={hxPx} y1={hyPx} x2={oxPx} y2={oyPx} stroke="hsl(var(--wall))" strokeWidth={1.5} />
                      <path d={`M ${lxPx} ${lyPx} A ${wid} ${wid} 0 0 ${sweep} ${oxPx} ${oyPx}`}
                        fill="none" stroke="hsl(var(--door-swing))" strokeWidth={1} strokeDasharray="3 2" />
                    </>
                  );
                })() : (
                  <>
                    {[-1, 0, 1].map((k) => (
                      <line
                        key={k}
                        x1={ftToPx(cx) - (horizontal ? wid / 2 : 0)}
                        y1={ftToPx(cy) - (horizontal ? 0 : wid / 2) + (horizontal ? k * 2 : 0)}
                        x2={ftToPx(cx) + (horizontal ? wid / 2 : 0) + (horizontal ? 0 : k * 2)}
                        y2={ftToPx(cy) + (horizontal ? 0 : wid / 2)}
                        stroke="hsl(var(--wall))" strokeWidth={k === 0 ? 1.5 : 0.8}
                      />
                    ))}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Props */}
        <g>
          {floor.props.map((p) => {
            const entry = PROP_CATALOG[p.type];
            if (!entry) return null;
            const isSel = selection?.kind === "prop" && selection.id === p.id;
            const cxPx = ftToPx(p.x);
            const cyPx = ftToPx(p.y);
            const wPx = p.w * PX_PER_FT;
            const hPx = p.h * PX_PER_FT;
            return (
              <g key={p.id}
                transform={`translate(${cxPx} ${cyPx}) rotate(${p.rotation || 0})`}
                onPointerDown={(e) => startPropDrag(p, e)}
                className="cursor-move"
                style={{ color: "hsl(var(--prop-stroke))" }}
              >
                <g transform={`translate(${-wPx / 2} ${-hPx / 2}) scale(${PX_PER_FT})`}>
                  {entry.render(p.w, p.h)}
                </g>
                {isSel && (
                  <>
                    <rect x={-wPx / 2 - 2} y={-hPx / 2 - 2} width={wPx + 4} height={hPx + 4}
                      fill="none" stroke="hsl(var(--selection))" strokeWidth={1.5} strokeDasharray="4 3" />
                    {(["nw", "ne", "sw", "se"] as const).map((c) => {
                      const cx = c.includes("e") ? wPx / 2 : -wPx / 2;
                      const cy = c.includes("s") ? hPx / 2 : -hPx / 2;
                      return (
                        <rect key={c} x={cx - 4} y={cy - 4} width={8} height={8}
                          fill="hsl(var(--selection))"
                          onPointerDown={(e) => startResize(p, c, e)}
                          className="cursor-nwse-resize" />
                      );
                    })}
                    {/* Rotation handle (PowerPoint-style) — sits above the box, hold Shift to snap to 15° */}
                    {(() => {
                      const handleY = -hPx / 2 - 22;
                      return (
                        <g style={{ pointerEvents: "auto" }}>
                          <line x1={0} y1={-hPx / 2 - 2} x2={0} y2={handleY + 6}
                            stroke="hsl(var(--selection))" strokeWidth={1} />
                          <circle cx={0} cy={handleY} r={7}
                            fill="hsl(var(--background))"
                            stroke="hsl(var(--selection))" strokeWidth={2}
                            onPointerDown={(e) => startRotate(p, e)}
                            style={{ cursor: "grab" }}>
                            <title>Drag to rotate (hold Shift to snap 15°)</title>
                          </circle>
                          {/* small curved arrow glyph inside the handle */}
                          <path d={`M ${-3.5} ${handleY - 0.5} A 3.5 3.5 0 1 1 ${3.5} ${handleY - 0.5}`}
                            fill="none" stroke="hsl(var(--selection))" strokeWidth={1.2} pointerEvents="none" />
                          <path d={`M ${3.5} ${handleY - 2.2} L ${3.5} ${handleY + 0.8} L ${0.8} ${handleY - 0.5} Z`}
                            fill="hsl(var(--selection))" pointerEvents="none" />
                        </g>
                      );
                    })()}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Custom dimensions */}
        <g>
          {(floor.customDimensions || []).map((d) => {
            const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const ax = d.x1 + nx * d.offset, ay = d.y1 + ny * d.offset;
            const bx = d.x2 + nx * d.offset, by = d.y2 + ny * d.offset;
            const isSel = selection?.kind === "dimension" && selection.id === d.id;
            const stroke = isSel ? "hsl(var(--selection))" : "hsl(var(--dimension))";
            const tx = ftToPx((ax + bx) / 2);
            const ty = ftToPx((ay + by) / 2);
            return (
              <g key={d.id}
                onClick={(e) => { e.stopPropagation(); setSelection({ kind: "dimension", id: d.id }); }}
                className="cursor-pointer">
                <line x1={ftToPx(d.x1)} y1={ftToPx(d.y1)} x2={ftToPx(ax)} y2={ftToPx(ay)} stroke={stroke} strokeWidth={0.8} strokeDasharray="2 2" />
                <line x1={ftToPx(d.x2)} y1={ftToPx(d.y2)} x2={ftToPx(bx)} y2={ftToPx(by)} stroke={stroke} strokeWidth={1.2}
                  markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
                {/* Invisible thicker hit area along the dimension line for dragging perpendicular */}
                <line x1={ftToPx(ax)} y1={ftToPx(ay)} x2={ftToPx(bx)} y2={ftToPx(by)}
                  stroke="transparent" strokeWidth={14} style={{ cursor: "move" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelection({ kind: "dimension", id: d.id });
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    const { x: cx, y: cy } = toFt(e.clientX, e.clientY);
                    dragRef.current = {
                      kind: "dim_offset", id: d.id, nx, ny,
                      baseX: cx, baseY: cy, origOffset: d.offset,
                    };
                  }} />
                <line x1={ftToPx(d.x2)} y1={ftToPx(d.y2)} x2={ftToPx(bx)} y2={ftToPx(by)} stroke={stroke} strokeWidth={0.8} strokeDasharray="2 2" />
                <rect x={tx - 22} y={ty - 8} width={44} height={14} rx={2}
                  fill="hsl(var(--background))" stroke={stroke} strokeWidth={0.6} opacity={0.95}
                  style={{ cursor: "move" }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelection({ kind: "dimension", id: d.id });
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    const { x: cx, y: cy } = toFt(e.clientX, e.clientY);
                    dragRef.current = {
                      kind: "dim_offset", id: d.id, nx, ny,
                      baseX: cx, baseY: cy, origOffset: d.offset,
                    };
                  }} />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fontFamily="ui-sans-serif, system-ui"
                  fill={stroke} className="font-medium" pointerEvents="none">
                  {len.toFixed(2)}'
                </text>
                {isSel && (
                  <circle cx={ftToPx(bx)} cy={ftToPx(by)} r={4} fill="hsl(var(--selection))"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); removeCustomDimension(d.id); }} />
                )}
              </g>
            );
          })}
          <defs>
            <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--dimension))" />
            </marker>
          </defs>
        </g>

        {/* Dimension tool preview */}
        {mode === "dimension" && (
          <g pointerEvents="none">
            {hoverPt && (
              <circle cx={ftToPx(hoverPt.x)} cy={ftToPx(hoverPt.y)} r={4}
                fill="hsl(var(--selection))" opacity={0.8} />
            )}
            {dimStart && (
              <>
                <circle cx={ftToPx(dimStart.x)} cy={ftToPx(dimStart.y)} r={4} fill="hsl(var(--selection))" />
                {hoverPt && (
                  <line x1={ftToPx(dimStart.x)} y1={ftToPx(dimStart.y)}
                    x2={ftToPx(hoverPt.x)} y2={ftToPx(hoverPt.y)}
                    stroke="hsl(var(--selection))" strokeWidth={1} strokeDasharray="3 2" />
                )}
              </>
            )}
          </g>
        )}

        {/* Built-in dimension chains */}
        {showDimensions && (
          <g>
            <DimChain
              orientation="horizontal"
              from={floor.bounds.x} to={floor.bounds.x + floor.bounds.w}
              along={floor.bounds.y - 3}
              ftToPx={ftToPx}
              ticks={Array.from(new Set(floor.walls.filter(w => w.y1 === w.y2 && w.x1 !== w.x2).flatMap(w => [w.x1, w.x2])
                .concat([floor.bounds.x, floor.bounds.x + floor.bounds.w]))).sort((a, b) => a - b)}
              onEditSegment={(a, b) => {
                const cur = Math.abs(b - a);
                const input = window.prompt(`Segment length (ft). Current: ${cur.toFixed(2)}'`, cur.toFixed(2));
                if (!input) return;
                const next = parseFloat(input);
                if (!isFinite(next) || next <= 0) return;
                const delta = next - cur;
                const threshold = Math.min(a, b) + 0.001;
                floor.walls.forEach((w) => {
                  const patch: Partial<Wall> = {};
                  if (w.x1 > threshold) patch.x1 = w.x1 + delta;
                  if (w.x2 > threshold) patch.x2 = w.x2 + delta;
                  if (Object.keys(patch).length) updateWall(w.id, patch);
                });
              }}
            />
            <DimChain
              orientation="vertical"
              from={floor.bounds.y} to={floor.bounds.y + floor.bounds.h}
              along={floor.bounds.x + floor.bounds.w + 3}
              ftToPx={ftToPx}
              ticks={Array.from(new Set(floor.walls.filter(w => w.x1 === w.x2 && w.y1 !== w.y2).flatMap(w => [w.y1, w.y2])
                .concat([floor.bounds.y, floor.bounds.y + floor.bounds.h]))).sort((a, b) => a - b)}
              onEditSegment={(a, b) => {
                const cur = Math.abs(b - a);
                const input = window.prompt(`Segment length (ft). Current: ${cur.toFixed(2)}'`, cur.toFixed(2));
                if (!input) return;
                const next = parseFloat(input);
                if (!isFinite(next) || next <= 0) return;
                const delta = next - cur;
                const threshold = Math.min(a, b) + 0.001;
                floor.walls.forEach((w) => {
                  const patch: Partial<Wall> = {};
                  if (w.y1 > threshold) patch.y1 = w.y1 + delta;
                  if (w.y2 > threshold) patch.y2 = w.y2 + delta;
                  if (Object.keys(patch).length) updateWall(w.id, patch);
                });
              }}
            />
          </g>
        )}
      </svg>
    </div>
  );
};

const DimChain: React.FC<{
  orientation: "horizontal" | "vertical";
  from: number; to: number; along: number;
  ftToPx: (n: number) => number;
  ticks: number[];
  onEditSegment?: (a: number, b: number) => void;
}> = ({ orientation, from, to, along, ftToPx, ticks, onEditSegment }) => {
  const horizontal = orientation === "horizontal";
  const segments = ticks.slice(0, -1).map((t, i) => ({ a: t, b: ticks[i + 1] }));
  return (
    <g stroke="hsl(var(--dimension))" fill="hsl(var(--dimension))" fontSize={10} fontFamily="ui-sans-serif, system-ui">
      {horizontal ? (
        <line x1={ftToPx(from)} y1={ftToPx(along)} x2={ftToPx(to)} y2={ftToPx(along)} strokeWidth={1} />
      ) : (
        <line x1={ftToPx(along)} y1={ftToPx(from)} x2={ftToPx(along)} y2={ftToPx(to)} strokeWidth={1} />
      )}
      {ticks.map((t) =>
        horizontal ? (
          <line key={t} x1={ftToPx(t)} y1={ftToPx(along) - 5} x2={ftToPx(t)} y2={ftToPx(along) + 5} strokeWidth={1} />
        ) : (
          <line key={t} x1={ftToPx(along) - 5} y1={ftToPx(t)} x2={ftToPx(along) + 5} y2={ftToPx(t)} strokeWidth={1} />
        ),
      )}
      {segments.map((s, i) => {
        const mid = (s.a + s.b) / 2;
        const len = Math.abs(s.b - s.a);
        if (len < 0.5) return null;
        const tx = horizontal ? ftToPx(mid) : ftToPx(along) + 10;
        const ty = horizontal ? ftToPx(along) - 8 : ftToPx(mid);
        return (
          <g key={i} onClick={() => onEditSegment?.(s.a, s.b)} className="cursor-pointer">
            <rect x={tx - 16} y={ty - 9} width={32} height={14} rx={2}
              fill="hsl(var(--background))" stroke="hsl(var(--dimension))" strokeWidth={0.5} opacity={0.9} />
            <text x={tx} y={ty - 1} textAnchor="middle" dominantBaseline="middle" stroke="none" className="font-medium">
              {len.toFixed(1)}'
            </text>
          </g>
        );
      })}
    </g>
  );
};
