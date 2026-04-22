import React from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import {
  Plus, Undo2, Redo2, Download, Ruler, Grid3x3, DoorOpen, AppWindow,
  FilePlus, Layers, X, FileDown, FileUp, PanelLeftClose, PanelLeft,
  PanelRightClose, PanelRight, ZoomIn, ZoomOut, Maximize2, MousePointer2,
  Magnet, Square, FileCode2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlanStore } from "@/editor/usePlanStore";
import { useProjectsStore, planFromPlot, makeDemoPlan } from "@/editor/projectsStore";
import { FloorCanvas } from "@/editor/FloorCanvas";
import { PropLibrary } from "@/editor/PropLibrary";
import { PropertiesPanel } from "@/editor/PropertiesPanel";
import { ProjectSidebar } from "@/editor/ProjectSidebar";
import { PlotSketcher } from "@/editor/PlotSketcher";
import { exportProject, pickArchraxFile } from "@/editor/importExport";
import { exportDXF } from "@/editor/dxfExport";
import { chainWallsToPolygon, polygonArea } from "@/editor/geom";
import { AdSlot } from "@/components/AdSlot";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const projects = useProjectsStore();
  const store = usePlanStore(projects.activeId, projects.touchProject);
  const [showDim, setShowDim] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(true);
  const [editingName, setEditingName] = React.useState(false);
  const [editingFloor, setEditingFloor] = React.useState<string | null>(null);
  const [sketchOpen, setSketchOpen] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const [showPropLibrary, setShowPropLibrary] = React.useState(true);
  const [showPropsPanel, setShowPropsPanel] = React.useState(true);
  const [zoom, setZoom] = React.useState(1);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const [mode, setMode] = React.useState<"select" | "dimension">("select");
  const [snap, setSnap] = React.useState(true);
  const [selectedWallIds, setSelectedWallIds] = React.useState<string[]>([]);
  const [areaPolygon, setAreaPolygon] = React.useState<{ x: number; y: number }[] | null>(null);
  const [areaValue, setAreaValue] = React.useState<number | null>(null);
  const canvasWrap = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { setSelectedWallIds([]); setAreaPolygon(null); setAreaValue(null); }, [projects.activeId, store.activeFloor]);

  const toggleWallInSelection = React.useCallback((id: string) => {
    setSelectedWallIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const computeArea = () => {
    if (selectedWallIds.length < 3) {
      toast.error("Shift+click at least 3 walls to compute an enclosed area");
      return;
    }
    const walls = store.floor.walls.filter((w) => selectedWallIds.includes(w.id));
    const poly = chainWallsToPolygon(walls);
    if (!poly) {
      toast.error("Selected walls don't form a closed loop");
      setAreaPolygon(null); setAreaValue(null);
      return;
    }
    const area = polygonArea(poly);
    setAreaPolygon(poly); setAreaValue(area);
    toast.success(`Enclosed area: ${area.toFixed(2)} ft²`);
  };

  const clearAreaSelection = () => {
    setSelectedWallIds([]); setAreaPolygon(null); setAreaValue(null);
  };

  const handleExportDXF = (includeFurniture: boolean) => {
    if (!projects.activeId) return;
    try {
      exportDXF(store.plan, { includeFurniture });
      toast.success(`DXF exported${includeFurniture ? " with furniture" : ""}`);
    } catch (err) {
      console.error(err);
      toast.error("DXF export failed");
    }
  };

  // First-visit: open a fresh empty Sketch dialog; do NOT auto-create demo data.
  React.useEffect(() => {
    if (projects.firstVisit && projects.projects.length === 0) {
      setSketchOpen(true);
    }
  }, [projects.firstVisit, projects.projects.length]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") { store.deleteSelection(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { e.preventDefault(); store.redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  const exportPNG = async () => {
    const node = document.getElementById("floorplan-svg");
    if (!node) return;
    try {
      const dataUrl = await toPng(node as unknown as HTMLElement, { pixelRatio: 2, backgroundColor: "#fafafa" });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = `${store.plan.projectName}-${store.floorMeta.name}.png`; a.click();
      toast.success("PNG exported");
    } catch { toast.error("Export failed"); }
  };
  const exportPDF = async () => {
    const node = document.getElementById("floorplan-svg");
    if (!node) return;
    try {
      const dataUrl = await toPng(node as unknown as HTMLElement, { pixelRatio: 2, backgroundColor: "#fafafa" });
      const img = new Image(); img.src = dataUrl;
      await new Promise((r) => (img.onload = r));
      const pdf = new jsPDF({ orientation: img.width > img.height ? "landscape" : "portrait", unit: "px", format: [img.width, img.height] });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`${store.plan.projectName}-${store.floorMeta.name}.pdf`);
      toast.success("PDF exported");
    } catch { toast.error("Export failed"); }
  };

  const addWall = () => {
    const cx = store.floor.bounds.x + store.floor.bounds.w / 2;
    const cy = store.floor.bounds.y + store.floor.bounds.h / 2;
    store.addWall({ x1: cx - 5, y1: cy, x2: cx + 5, y2: cy, thickness: 0.5 });
    toast("Wall added — drag endpoints to position");
  };
  const addOpening = (kind: "door" | "window") => {
    if (store.selection?.kind !== "wall") {
      toast.error("Select a wall first to add a " + kind);
      return;
    }
    store.addOpening({ wallId: store.selection.id, t: 0.5, width: kind === "door" ? 3 : 4, kind });
  };
  const addRoom = () => {
    const cx = store.floor.bounds.x + store.floor.bounds.w / 2;
    const cy = store.floor.bounds.y + store.floor.bounds.h / 2;
    store.addRoom({ name: "New Room", x: cx - 5, y: cy - 4, w: 10, h: 8 });
  };

  const handleNewProject = () => setSketchOpen(true);

  const handleSketchConfirm = (name: string, plot: { kind: "polygon" | "freehand"; points: { x: number; y: number }[] }) => {
    const plan = planFromPlot(name, plot);
    projects.createProject(name, plan);
    setSketchOpen(false);
    toast.success(`Project "${name}" created`);
  };

  const handleImport = async () => {
    const plan = await pickArchraxFile();
    if (!plan) return;
    projects.createProject(plan.projectName || "Imported Plan", plan);
    toast.success("Project imported");
  };

  const handleExport = (id: string) => {
    if (id === projects.activeId) {
      exportProject(store.plan);
    } else {
      // load from storage and export
      import("@/editor/projectsStore").then(({ loadProject }) => {
        const p = loadProject(id);
        if (p) exportProject(p);
      });
    }
  };

  const noProjects = projects.projects.length === 0;
  const showEmptyState = noProjects && !sketchOpen;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2 gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(s => !s)} title="Toggle projects sidebar">
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <div className="min-w-0 flex-1">
            {editingName && projects.activeId ? (
              <Input
                autoFocus
                defaultValue={store.plan.projectName}
                onBlur={(e) => {
                  const n = e.target.value || "Untitled Plan";
                  store.setProjectName(n);
                  projects.renameProject(projects.activeId!, n);
                  setEditingName(false);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="h-7 text-base font-semibold"
              />
            ) : (
              <h1
                className="text-base font-semibold cursor-pointer hover:underline truncate"
                onClick={() => projects.activeId && setEditingName(true)}
                title="Click to rename"
              >
                {projects.activeId ? store.plan.projectName : "ArchRax — Floor Plan Editor"}
              </h1>
            )}
            <p className="text-xs text-muted-foreground truncate">
              Drag walls/rooms/props. Click a dimension to type exact length. Auto-saved on this device.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={handleNewProject} title="New project">
            <FilePlus className="mr-1 h-4 w-4" />New
          </Button>
          <Button variant="ghost" size="sm" onClick={store.undo} title="Undo (Ctrl+Z)" disabled={!projects.activeId}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={store.redo} title="Redo (Ctrl+Shift+Z)" disabled={!projects.activeId}><Redo2 className="h-4 w-4" /></Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <Toggle pressed={showDim} onPressedChange={setShowDim} size="sm" title="Toggle dimensions"><Ruler className="h-4 w-4" /></Toggle>
          <Toggle pressed={showGrid} onPressedChange={setShowGrid} size="sm" title="Toggle grid"><Grid3x3 className="h-4 w-4" /></Toggle>
          <Toggle pressed={showPropLibrary} onPressedChange={setShowPropLibrary} size="sm" title="Toggle furniture panel" disabled={!projects.activeId}>
            {showPropLibrary ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Toggle>
          <Toggle pressed={showPropsPanel} onPressedChange={setShowPropsPanel} size="sm" title="Toggle properties panel" disabled={!projects.activeId}>
            {showPropsPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Toggle>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => projects.activeId && exportProject(store.plan)} disabled={!projects.activeId} title="Export .archrax">
            <FileDown className="mr-1 h-4 w-4" />.archrax
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} title="Import .archrax">
            <FileUp className="mr-1 h-4 w-4" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={exportPNG} disabled={!projects.activeId}><Download className="mr-1 h-4 w-4" />PNG</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={!projects.activeId}><Download className="mr-1 h-4 w-4" />PDF</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!projects.activeId} title="Export DXF (CAD)">
                <FileCode2 className="mr-1 h-4 w-4" />DXF
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportDXF(true)}>With furniture</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportDXF(false)}>Without furniture</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Floor tabs */}
      {projects.activeId && (
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-1.5">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Tabs value={store.activeFloor} onValueChange={(v) => store.setActiveFloor(v)}>
            <TabsList>
              {store.plan.floors.map((f) => (
                <TabsTrigger key={f.id} value={f.id} className="group relative pr-7">
                  {editingFloor === f.id ? (
                    <Input
                      autoFocus
                      defaultValue={f.name}
                      onBlur={(e) => { store.renameFloor(f.id, e.target.value || f.name); setEditingFloor(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="h-6 w-32 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span onDoubleClick={(e) => { e.stopPropagation(); setEditingFloor(f.id); }}>{f.name}</span>
                  )}
                  {store.plan.floors.length > 1 && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${f.name}?`)) store.removeFloor(f.id); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button size="sm" variant="ghost" onClick={store.addFloor} title="Add floor (keeps exterior walls + stairs)">
            <Plus className="mr-1 h-3 w-3" />Add Floor
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">Double-click a tab to rename</span>
        </div>
      )}

      {/* Tool bar */}
      {projects.activeId && (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5 text-xs">
          <Toggle pressed={mode === "select"} onPressedChange={() => setMode("select")} size="sm" title="Select / move tool"><MousePointer2 className="h-3 w-3" /></Toggle>
          <Toggle pressed={mode === "dimension"} onPressedChange={() => setMode(mode === "dimension" ? "select" : "dimension")} size="sm" title="Dimension tool — click two points">
            <Ruler className="h-3 w-3" />
          </Toggle>
          <Toggle pressed={snap} onPressedChange={setSnap} size="sm" title="Snap to walls/corners (Shift toggles while drawing)">
            <Magnet className="h-3 w-3" />
          </Toggle>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={addWall}><Plus className="mr-1 h-3 w-3" />Wall</Button>
          <Button size="sm" variant="ghost" onClick={() => addOpening("door")}><DoorOpen className="mr-1 h-3 w-3" />Door</Button>
          <Button size="sm" variant="ghost" onClick={() => addOpening("window")}><AppWindow className="mr-1 h-3 w-3" />Window</Button>
          <Button size="sm" variant="ghost" onClick={addRoom}><Plus className="mr-1 h-3 w-3" />Room</Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={computeArea} title="Shift+click walls then compute the area they enclose">
            <Square className="mr-1 h-3 w-3" />Area
            {selectedWallIds.length > 0 && <span className="ml-1 rounded bg-primary/20 px-1 text-[10px]">{selectedWallIds.length}</span>}
          </Button>
          {(selectedWallIds.length > 0 || areaPolygon) && (
            <Button size="sm" variant="ghost" onClick={clearAreaSelection} className="h-6 px-2 text-[10px]">Clear</Button>
          )}
          {areaValue !== null && (
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {areaValue.toFixed(2)} ft²
            </span>
          )}
          <div className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.max(0.25, z / 1.25))} title="Zoom out"><ZoomOut className="h-3 w-3" /></Button>
          <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => Math.min(4, z * 1.25))} title="Zoom in"><ZoomIn className="h-3 w-3" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setZoom(1)} title="Reset zoom"><Maximize2 className="h-3 w-3" /></Button>
          <span className="ml-auto text-muted-foreground">
            {store.floor.props.length} props · {store.floor.walls.length} walls · {store.floor.rooms.length} rooms
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Projects sidebar */}
        {showSidebar && (
          <aside className="w-56 shrink-0 border-r">
            <ProjectSidebar
              projects={projects.projects}
              activeId={projects.activeId}
              onSelect={projects.setActiveId}
              onNew={handleNewProject}
              onDelete={projects.deleteProject}
              onRename={projects.renameProject}
              onExport={handleExport}
              onImport={handleImport}
            />
          </aside>
        )}

        {projects.activeId ? (
          <>
            {showPropLibrary && (
              <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <PropLibrary onAdd={store.addProp} />
                </div>
                <div className="border-t p-3">
                  <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_LEFT} minHeight={90} />
                </div>
              </aside>
            )}

            <main ref={canvasWrap} className="relative flex-1 overflow-hidden">
              <FloorCanvas
                floor={store.floor}
                selection={store.selection}
                setSelection={store.setSelection}
                updateProp={store.updateProp}
                updateWall={store.updateWall}
                updateOpening={store.updateOpening}
                updateRoom={store.updateRoom}
                showDimensions={showDim}
                showGrid={showGrid}
                zoom={zoom}
                onCursor={setCursor}
                mode={mode}
                snap={snap}
                addCustomDimension={store.addCustomDimension}
                updateCustomDimension={store.updateCustomDimension}
                removeCustomDimension={store.removeCustomDimension}
                selectedWallIds={selectedWallIds}
                toggleWallInSelection={toggleWallInSelection}
                enclosedAreaPolygon={areaPolygon}
              />
              {/* Cursor coords (bottom-right overlay) */}
              <div className="pointer-events-none absolute bottom-1 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-sm">
                {cursor ? `${cursor.x.toFixed(2)} ft, ${cursor.y.toFixed(2)} ft` : "—"}
              </div>
            </main>

            {showPropsPanel && (
              <aside className="w-72 shrink-0 border-l bg-card flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <PropertiesPanel
                    floor={store.floor}
                    selection={store.selection}
                    updateProp={store.updateProp}
                    updateWall={store.updateWall}
                    updateOpening={store.updateOpening}
                    updateRoom={store.updateRoom}
                    onDelete={store.deleteSelection}
                  />
                </div>
                <div className="border-t p-3">
                  <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_RIGHT} minHeight={120} />
                </div>
              </aside>
            )}
          </>
        ) : (
          <main className="flex flex-1 items-center justify-center bg-muted/20">
            <div className="max-w-md text-center p-8">
              <h2 className="text-2xl font-semibold mb-2">Welcome to ArchRax</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sketch your plot boundary and design floor plans for it. All projects are saved on this device.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleNewProject}><FilePlus className="mr-1 h-4 w-4" />New project</Button>
                <Button variant="outline" onClick={handleImport}><FileUp className="mr-1 h-4 w-4" />Import .archrax</Button>
                {showEmptyState && (
                  <Button variant="ghost" onClick={() => projects.createProject("Demo 25 × 70 Plan", makeDemoPlan())}>
                    Try the demo
                  </Button>
                )}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Slim footer with crawlable links to legal/info pages — required for AdSense */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t bg-muted/30 px-4 py-1.5 text-[11px] text-muted-foreground">
        <span>© {new Date().getFullYear()} ArchRax</span>
        <Link to="/about" className="hover:text-foreground hover:underline">About</Link>
        <Link to="/help" className="hover:text-foreground hover:underline">Help</Link>
        <Link to="/contact" className="hover:text-foreground hover:underline">Contact</Link>
        <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground hover:underline">Terms</Link>
        <Link to="/cookies" className="hover:text-foreground hover:underline">Cookies</Link>
      </div>

      <PlotSketcher
        open={sketchOpen}
        onClose={() => { setSketchOpen(false); projects.markFirstVisitDone(); }}
        onConfirm={handleSketchConfirm}
        defaultName={`Project ${projects.projects.length + 1}`}
      />
    </div>
  );
};

export default Index;
