import React from "react";
import { PROP_CATALOG } from "./propCatalog";
import { PX_PER_FT } from "./types";
import type { FloorData, Opening, PropItem, Wall } from "./types";

interface Props {
  floor: FloorData;
  selection: { kind: string; id: string } | null;
  setSelection: (s: { kind: "prop" | "wall" | "opening" | "room" | "room_label"; id: string } | null) => void;
  updateProp: (id: string, patch: Partial<PropItem>) => void;
  updateWall: (id: string, patch: Partial<Wall>) => void;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  updateRoom: (id: string, patch: Partial<import("./types").Room>) => void;
  showDimensions: boolean;
  showGrid: boolean;
}

type DragState =
  | { kind: "prop_move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: "prop_resize"; id: string; corner: "se" | "sw" | "ne" | "nw"; origW: number; origH: number; origX: number; origY: number; startX: number; startY: number }
  | { kind: "wall_endpoint"; id: string; end: 1 | 2; }
  | { kind: "opening_slide"; id: string; wall: Wall }
  | { kind: "room_move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: "room_label_move"; id: string; startX: number; startY: number; origDx: number; origDy: number };

export const FloorCanvas: React.FC<Props> = ({
  floor, selection, setSelection, updateProp, updateWall, updateOpening, updateRoom, showDimensions, showGrid,
}) => {
  const padding = 8; // ft of margin around plot for dimensions
  const widthFt = floor.bounds.w + padding * 2;
  const heightFt = floor.bounds.h + padding * 2;
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragRef = React.useRef<DragState | null>(null);

  const toFt = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x / PX_PER_FT - padding, y: local.y / PX_PER_FT - padding };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;
    const { x, y } = toFt(e.clientX, e.clientY);
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
    } else if (ds.kind === "wall_endpoint") {
      const w = floor.walls.find((w) => w.id === ds.id);
      if (!w) return;
      const snap = (v: number) => Math.round(v * 4) / 4;
      const horizontal = w.y1 === w.y2;
      if (ds.end === 1) {
        if (horizontal) updateWall(w.id, { x1: snap(x) });
        else updateWall(w.id, { y1: snap(y) });
      } else {
        if (horizontal) updateWall(w.id, { x2: snap(x) });
        else updateWall(w.id, { y2: snap(y) });
      }
    } else if (ds.kind === "opening_slide") {
      const w = ds.wall;
      const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      const dx = x - w.x1, dy = y - w.y1;
      const proj = (dx * (w.x2 - w.x1) + dy * (w.y2 - w.y1)) / (len * len);
      updateOpening(ds.id, { t: Math.max(0.05, Math.min(0.95, proj)) });
    }
  };
  const onPointerUp = () => { dragRef.current = null; };

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
  const startWallEndpointDrag = (w: Wall, end: 1 | 2, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "wall", id: w.id });
    dragRef.current = { kind: "wall_endpoint", id: w.id, end };
  };
  const startOpeningDrag = (o: Opening, e: React.PointerEvent) => {
    e.stopPropagation();
    setSelection({ kind: "opening", id: o.id });
    const w = floor.walls.find((w) => w.id === o.wallId);
    if (!w) return;
    dragRef.current = { kind: "opening_slide", id: o.id, wall: w };
  };

  const ftToPx = (v: number) => (v + padding) * PX_PER_FT;

  return (
    <div className="relative h-full w-full overflow-auto bg-[hsl(var(--blueprint-bg))]">
      <svg
        ref={svgRef}
        width={widthFt * PX_PER_FT}
        height={heightFt * PX_PER_FT}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => { if (e.target === svgRef.current) setSelection(null); }}
        className="block touch-none select-none"
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

        {/* Plot bounds */}
        <rect
          x={ftToPx(floor.bounds.x)} y={ftToPx(floor.bounds.y)}
          width={floor.bounds.w * PX_PER_FT} height={floor.bounds.h * PX_PER_FT}
          fill="hsl(var(--room-fill))" stroke="hsl(var(--wall))" strokeWidth={3}
        />

        {/* Rooms */}
        <g>
          {floor.rooms.map((r) => (
            <g key={r.id} onClick={(e) => { e.stopPropagation(); setSelection({ kind: "room", id: r.id }); }}>
              <rect
                x={ftToPx(r.x)} y={ftToPx(r.y)}
                width={r.w * PX_PER_FT} height={r.h * PX_PER_FT}
                fill={r.fill === "alt" ? "hsl(var(--room-fill-alt))" : "hsl(var(--room-fill))"}
                stroke={selection?.kind === "room" && selection.id === r.id ? "hsl(var(--selection))" : "transparent"}
                strokeWidth={1.5}
                className="cursor-pointer"
              />
              <text
                x={ftToPx(r.x + r.w / 2)} y={ftToPx(r.y + r.h / 2)}
                textAnchor="middle" dominantBaseline="middle"
                fill="hsl(var(--foreground))"
                fontSize={Math.min(14, Math.max(9, Math.min(r.w, r.h) * 1.4))}
                fontFamily="ui-sans-serif, system-ui"
                className="pointer-events-none font-medium"
              >
                {r.name}
              </text>
              <text
                x={ftToPx(r.x + r.w / 2)} y={ftToPx(r.y + r.h / 2) + 14}
                textAnchor="middle" dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={9}
                className="pointer-events-none"
              >
                {r.w.toFixed(1)}' × {r.h.toFixed(1)}'
              </text>
            </g>
          ))}
        </g>

        {/* Walls */}
        <g>
          {floor.walls.map((w) => {
            const horizontal = w.y1 === w.y2;
            const isSel = selection?.kind === "wall" && selection.id === w.id;
            const t = w.thickness * PX_PER_FT;
            const x = horizontal ? ftToPx(Math.min(w.x1, w.x2)) : ftToPx(w.x1) - t / 2;
            const y = horizontal ? ftToPx(w.y1) - t / 2 : ftToPx(Math.min(w.y1, w.y2));
            const ww = horizontal ? Math.abs(w.x2 - w.x1) * PX_PER_FT : t;
            const hh = horizontal ? t : Math.abs(w.y2 - w.y1) * PX_PER_FT;
            return (
              <g key={w.id}>
                <rect
                  x={x} y={y} width={ww} height={hh}
                  fill="hsl(var(--wall-fill))"
                  stroke={isSel ? "hsl(var(--selection))" : "none"}
                  strokeWidth={1.5}
                  onClick={(e) => { e.stopPropagation(); setSelection({ kind: "wall", id: w.id }); }}
                  className="cursor-pointer"
                />
                {isSel && (
                  <>
                    <circle cx={ftToPx(w.x1)} cy={ftToPx(w.y1)} r={6}
                      fill="hsl(var(--selection))"
                      onPointerDown={(e) => startWallEndpointDrag(w, 1, e)}
                      className="cursor-move" />
                    <circle cx={ftToPx(w.x2)} cy={ftToPx(w.y2)} r={6}
                      fill="hsl(var(--selection))"
                      onPointerDown={(e) => startWallEndpointDrag(w, 2, e)}
                      className="cursor-move" />
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Openings (doors / windows) */}
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
                {/* break in wall */}
                <rect
                  x={ftToPx(cx) - (horizontal ? wid / 2 : t / 2)}
                  y={ftToPx(cy) - (horizontal ? t / 2 : wid / 2)}
                  width={horizontal ? wid : t}
                  height={horizontal ? t : wid}
                  fill="hsl(var(--blueprint-bg))"
                  stroke={isSel ? "hsl(var(--selection))" : "none"}
                />
                {o.kind === "door" ? (
                  <>
                    <line
                      x1={ftToPx(cx) - (horizontal ? wid / 2 : 0)}
                      y1={ftToPx(cy) - (horizontal ? 0 : wid / 2)}
                      x2={ftToPx(cx) + (horizontal ? wid / 2 : 0)}
                      y2={ftToPx(cy) + (horizontal ? 0 : wid / 2)}
                      stroke="hsl(var(--wall))" strokeWidth={1.5}
                    />
                    <path
                      d={
                        horizontal
                          ? `M ${ftToPx(cx) - wid / 2} ${ftToPx(cy)} A ${wid} ${wid} 0 0 1 ${ftToPx(cx) - wid / 2 + wid} ${ftToPx(cy) - wid}`
                          : `M ${ftToPx(cx)} ${ftToPx(cy) - wid / 2} A ${wid} ${wid} 0 0 1 ${ftToPx(cx) + wid} ${ftToPx(cy) - wid / 2 + wid}`
                      }
                      fill="none" stroke="hsl(var(--door-swing))" strokeWidth={1} strokeDasharray="3 2"
                    />
                  </>
                ) : (
                  <>
                    {/* window: 3 parallel lines */}
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
              <g
                key={p.id}
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
                    <rect
                      x={-wPx / 2 - 2} y={-hPx / 2 - 2}
                      width={wPx + 4} height={hPx + 4}
                      fill="none" stroke="hsl(var(--selection))" strokeWidth={1.5} strokeDasharray="4 3"
                    />
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
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Dimensions */}
        {showDimensions && (
          <g>
            {/* Top horizontal dimension */}
            <DimChain
              orientation="horizontal"
              from={floor.bounds.x} to={floor.bounds.x + floor.bounds.w}
              along={floor.bounds.y - 3}
              ftToPx={ftToPx}
              ticks={Array.from(new Set(floor.walls.filter(w => w.y1 === w.y2 && w.x1 !== w.x2).flatMap(w => [w.x1, w.x2])
                .concat([floor.bounds.x, floor.bounds.x + floor.bounds.w]))).sort((a, b) => a - b)}
            />
            {/* Right vertical dimension */}
            <DimChain
              orientation="vertical"
              from={floor.bounds.y} to={floor.bounds.y + floor.bounds.h}
              along={floor.bounds.x + floor.bounds.w + 3}
              ftToPx={ftToPx}
              ticks={Array.from(new Set(floor.walls.filter(w => w.x1 === w.x2 && w.y1 !== w.y2).flatMap(w => [w.y1, w.y2])
                .concat([floor.bounds.y, floor.bounds.y + floor.bounds.h]))).sort((a, b) => a - b)}
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
}> = ({ orientation, from, to, along, ftToPx, ticks }) => {
  const horizontal = orientation === "horizontal";
  const segments = ticks.slice(0, -1).map((t, i) => ({ a: t, b: ticks[i + 1] }));
  return (
    <g stroke="hsl(var(--dimension))" fill="hsl(var(--dimension))" fontSize={10} fontFamily="ui-sans-serif, system-ui">
      {/* main line */}
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
        return horizontal ? (
          <text key={i} x={ftToPx(mid)} y={ftToPx(along) - 8} textAnchor="middle" stroke="none">{len.toFixed(1)}'</text>
        ) : (
          <text key={i} x={ftToPx(along) + 10} y={ftToPx(mid)} dominantBaseline="middle" stroke="none">{len.toFixed(1)}'</text>
        );
      })}
    </g>
  );
};
