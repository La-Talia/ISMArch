import React from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Plus, Undo2, Redo2, RotateCcw, Download, Ruler, Grid3x3, DoorOpen, AppWindow, FilePlus, Layers, X } from "lucide-react";
import { usePlanStore } from "@/editor/usePlanStore";
import { FloorCanvas } from "@/editor/FloorCanvas";
import { PropLibrary } from "@/editor/PropLibrary";
import { PropertiesPanel } from "@/editor/PropertiesPanel";
import { toast } from "sonner";

const Index = () => {
  const store = usePlanStore();
  const [showDim, setShowDim] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(true);
  const [editingName, setEditingName] = React.useState(false);
  const [editingFloor, setEditingFloor] = React.useState<string | null>(null);
  const canvasWrap = React.useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2 gap-4">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <Input
              autoFocus
              defaultValue={store.plan.projectName}
              onBlur={(e) => { store.setProjectName(e.target.value || "Untitled Plan"); setEditingName(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="h-7 text-base font-semibold"
            />
          ) : (
            <h1
              className="text-base font-semibold cursor-pointer hover:underline truncate"
              onClick={() => setEditingName(true)}
              title="Click to rename"
            >
              {store.plan.projectName}
            </h1>
          )}
          <p className="text-xs text-muted-foreground">Drag walls/rooms/props. Click a dimension to type exact length. Auto-saved locally.</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { if (confirm("Start a new empty project? Current edits will be cleared.")) store.newProject(); }} title="New Project">
            <FilePlus className="mr-1 h-4 w-4" />New
          </Button>
          <Button variant="ghost" size="sm" onClick={store.undo} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={store.redo} title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Reset to default 25×70 plan?")) store.reset(); }} title="Reset to default"><RotateCcw className="h-4 w-4" /></Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <Toggle pressed={showDim} onPressedChange={setShowDim} size="sm" title="Toggle dimensions"><Ruler className="h-4 w-4" /></Toggle>
          <Toggle pressed={showGrid} onPressedChange={setShowGrid} size="sm" title="Toggle grid"><Grid3x3 className="h-4 w-4" /></Toggle>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={exportPNG}><Download className="mr-1 h-4 w-4" />PNG</Button>
          <Button variant="outline" size="sm" onClick={exportPDF}><Download className="mr-1 h-4 w-4" />PDF</Button>
        </div>
      </header>

      {/* Floor tabs */}
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

      {/* Tool bar */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5 text-xs">
        <Button size="sm" variant="ghost" onClick={addWall}><Plus className="mr-1 h-3 w-3" />Wall</Button>
        <Button size="sm" variant="ghost" onClick={() => addOpening("door")}><DoorOpen className="mr-1 h-3 w-3" />Door</Button>
        <Button size="sm" variant="ghost" onClick={() => addOpening("window")}><AppWindow className="mr-1 h-3 w-3" />Window</Button>
        <Button size="sm" variant="ghost" onClick={addRoom}><Plus className="mr-1 h-3 w-3" />Room</Button>
        <span className="ml-auto text-muted-foreground">
          {store.floor.props.length} props · {store.floor.walls.length} walls · {store.floor.rooms.length} rooms
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r bg-card flex flex-col">
          <div className="flex-1 overflow-hidden">
            <PropLibrary onAdd={store.addProp} />
          </div>
          {/* Ad space */}
          <div className="border-t p-3">
            <div className="rounded-md border-2 border-dashed border-border bg-muted/40 p-3 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sponsored</div>
              <div className="text-xs font-medium">Your Ad Here</div>
              <div className="text-[10px] text-muted-foreground mt-1">160 × 90 ad slot</div>
            </div>
          </div>
        </aside>

        <main ref={canvasWrap} className="flex-1 overflow-hidden">
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
          />
        </main>

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
          {/* Ad space */}
          <div className="border-t p-3">
            <div className="rounded-md border-2 border-dashed border-border bg-muted/40 p-4 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sponsored</div>
              <div className="text-sm font-medium">Promote Your Service</div>
              <div className="text-[10px] text-muted-foreground mt-1">240 × 120 ad slot</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
