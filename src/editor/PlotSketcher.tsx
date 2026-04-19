import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlotShape } from "./types";
import { Pencil, Square, Spline, Undo2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, plot: PlotShape) => void;
  defaultName?: string;
}

const CANVAS = 480; // px
const PADDING = 20; // px
const SCALE = 5; // 1 ft = 5 px in sketcher (so 80ft x 80ft fits)

function fitPoints(pts: { x: number; y: number }[]) {
  // points already in ft; nothing to do
  return pts;
}

export const PlotSketcher: React.FC<Props> = ({ open, onClose, onConfirm, defaultName = "Untitled Plan" }) => {
  const [tab, setTab] = React.useState<"polygon" | "freehand" | "preset">("polygon");
  const [name, setName] = React.useState(defaultName);
  const [polyPts, setPolyPts] = React.useState<{ x: number; y: number }[]>([]);
  const [freePts, setFreePts] = React.useState<{ x: number; y: number }[]>([]);
  const [drawing, setDrawing] = React.useState(false);
  const [preset, setPreset] = React.useState<"rect" | "L" | "T">("rect");
  const [pw, setPw] = React.useState(40);
  const [ph, setPh] = React.useState(60);
  const [notch, setNotch] = React.useState(15);

  React.useEffect(() => {
    if (open) {
      setName(defaultName);
      setPolyPts([]);
      setFreePts([]);
      setDrawing(false);
      setTab("polygon");
      setPreset("rect");
      setPw(40); setPh(60); setNotch(15);
    }
  }, [open, defaultName]);

  const svgRef = React.useRef<SVGSVGElement>(null);
  const toFt = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.round(((local.x - PADDING) / SCALE) * 4) / 4,
      y: Math.round(((local.y - PADDING) / SCALE) * 4) / 4,
    };
  };

  const presetPoints = (): { x: number; y: number }[] => {
    if (preset === "rect") return [{x:0,y:0},{x:pw,y:0},{x:pw,y:ph},{x:0,y:ph}];
    if (preset === "L") {
      const n = Math.min(notch, pw - 2, ph - 2);
      return [{x:0,y:0},{x:pw,y:0},{x:pw,y:ph - n},{x:pw - n,y:ph - n},{x:pw - n,y:ph},{x:0,y:ph}];
    }
    // T-shape (cap on top)
    const n = Math.min(notch, (pw - 4) / 2);
    return [
      {x:0,y:0},{x:pw,y:0},{x:pw,y:n},{x:pw - n,y:n},
      {x:pw - n,y:ph},{x:n,y:ph},{x:n,y:n},{x:0,y:n},
    ];
  };

  const handleConfirm = () => {
    let plot: PlotShape | null = null;
    if (tab === "polygon") {
      if (polyPts.length < 3) { alert("Add at least 3 points to close the polygon."); return; }
      plot = { kind: "polygon", points: fitPoints(polyPts) };
    } else if (tab === "freehand") {
      if (freePts.length < 8) { alert("Draw a larger boundary first."); return; }
      plot = { kind: "freehand", points: fitPoints(freePts) };
    } else {
      plot = { kind: "polygon", points: presetPoints() };
    }
    if (!plot) return;
    onConfirm(name.trim() || "Untitled Plan", plot);
  };

  const renderPath = (pts: { x: number; y: number }[], close = true) => {
    if (!pts.length) return "";
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * SCALE + PADDING} ${p.y * SCALE + PADDING}`).join(" ");
    return close ? d + " Z" : d;
  };

  const previewPts = tab === "polygon" ? polyPts : tab === "freehand" ? freePts : presetPoints();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Sketch your plot</DialogTitle>
          <DialogDescription>
            Draw the boundary of your land. Polygon, freehand or a preset.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
          <div>
            <Label htmlFor="plot-name" className="text-xs">Project name</Label>
            <Input id="plot-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="polygon"><Square className="mr-1 h-3 w-3" />Polygon</TabsTrigger>
              <TabsTrigger value="freehand"><Pencil className="mr-1 h-3 w-3" />Freehand</TabsTrigger>
              <TabsTrigger value="preset"><Spline className="mr-1 h-3 w-3" />Preset</TabsTrigger>
            </TabsList>

            <TabsContent value="polygon" className="space-y-2 mt-2">
              <div className="text-xs text-muted-foreground">
                Click to add corners. Snaps to ¼ ft.
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPolyPts((p) => p.slice(0, -1))} disabled={!polyPts.length}>
                  <Undo2 className="mr-1 h-3 w-3" />Undo
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPolyPts([])} disabled={!polyPts.length}>Clear</Button>
                <span className="ml-auto text-xs text-muted-foreground self-center">{polyPts.length} pts</span>
              </div>
            </TabsContent>

            <TabsContent value="freehand" className="space-y-2 mt-2">
              <div className="text-xs text-muted-foreground">
                Press and drag to draw the outline. Release to close.
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setFreePts([])} disabled={!freePts.length}>Clear</Button>
                <span className="ml-auto text-xs text-muted-foreground self-center">{freePts.length} pts</span>
              </div>
            </TabsContent>

            <TabsContent value="preset" className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-2">
                {(["rect","L","T"] as const).map((p) => (
                  <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => setPreset(p)}>
                    {p === "rect" ? "Rectangle" : p === "L" ? "L-shape" : "T-shape"}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Width (ft)</Label><Input type="number" value={pw} onChange={(e) => setPw(Math.max(5, Number(e.target.value) || 0))} className="h-9" /></div>
                <div><Label className="text-xs">Depth (ft)</Label><Input type="number" value={ph} onChange={(e) => setPh(Math.max(5, Number(e.target.value) || 0))} className="h-9" /></div>
                {preset !== "rect" && <div><Label className="text-xs">Notch (ft)</Label><Input type="number" value={notch} onChange={(e) => setNotch(Math.max(1, Number(e.target.value) || 0))} className="h-9" /></div>}
              </div>
            </TabsContent>
          </Tabs>

          <div className="rounded-md border bg-[hsl(var(--blueprint-bg))] w-full">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS} ${CANVAS}`}
              preserveAspectRatio="xMidYMid meet"
              className="block touch-none cursor-crosshair w-full h-auto max-h-[40vh] mx-auto"
              onPointerDown={(e) => {
                const p = toFt(e.clientX, e.clientY);
                if (tab === "polygon") {
                  setPolyPts((arr) => [...arr, p]);
                } else if (tab === "freehand") {
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  setDrawing(true);
                  setFreePts([p]);
                }
              }}
              onPointerMove={(e) => {
                if (tab === "freehand" && drawing) {
                  const p = toFt(e.clientX, e.clientY);
                  setFreePts((arr) => {
                    const last = arr[arr.length - 1];
                    if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.5) return arr;
                    return [...arr, p];
                  });
                }
              }}
              onPointerUp={() => { if (tab === "freehand") setDrawing(false); }}
            >
              <g stroke="hsl(var(--blueprint-grid))" strokeWidth={0.4}>
                {Array.from({ length: Math.floor(CANVAS / SCALE) + 1 }).map((_, i) => (
                  <React.Fragment key={i}>
                    <line x1={i * SCALE + PADDING} y1={0} x2={i * SCALE + PADDING} y2={CANVAS} />
                    <line x1={0} y1={i * SCALE + PADDING} x2={CANVAS} y2={i * SCALE + PADDING} />
                  </React.Fragment>
                ))}
              </g>
              {previewPts.length > 0 && (
                <path
                  d={renderPath(previewPts, tab !== "freehand" || !drawing)}
                  fill={tab === "freehand" && drawing ? "none" : "hsl(var(--room-fill))"}
                  stroke="hsl(var(--wall))"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {tab === "polygon" && polyPts.map((p, i) => (
                <circle key={i} cx={p.x * SCALE + PADDING} cy={p.y * SCALE + PADDING} r={3} fill="hsl(var(--selection))" />
              ))}
            </svg>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Create project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
