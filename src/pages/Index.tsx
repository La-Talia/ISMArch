import React from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Undo2, Redo2, RotateCcw, Download, Ruler, Grid3x3, DoorOpen, AppWindow } from "lucide-react";
import { usePlanStore } from "@/editor/usePlanStore";
import { FloorCanvas } from "@/editor/FloorCanvas";
import { PropLibrary } from "@/editor/PropLibrary";
import { PropertiesPanel } from "@/editor/PropertiesPanel";
import { toast } from "sonner";

const Index = () => {
  const store = usePlanStore();
  const [showDim, setShowDim] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(true);
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
      a.href = dataUrl; a.download = `floorplan-${store.activeFloor}.png`; a.click();
      toast.success("PNG exported");
    } catch (e) { toast.error("Export failed"); }
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
      pdf.save(`floorplan-${store.activeFloor}.pdf`);
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
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <h1 className="text-base font-semibold">Floor Plan Editor — 25 × 70 ft (East-Facing)</h1>
          <p className="text-xs text-muted-foreground">Drag props, edit walls, doors & windows. Auto-saved locally.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={store.activeFloor} onValueChange={(v) => store.setActiveFloor(v as "ground" | "first")}>
            <TabsList>
              <TabsTrigger value="ground">Ground Floor</TabsTrigger>
              <TabsTrigger value="first">First Floor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={store.undo} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={store.redo} title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Reset to default plan? This will erase your edits.")) store.reset(); }} title="Reset"><RotateCcw className="h-4 w-4" /></Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <Toggle pressed={showDim} onPressedChange={setShowDim} size="sm" title="Toggle dimensions"><Ruler className="h-4 w-4" /></Toggle>
          <Toggle pressed={showGrid} onPressedChange={setShowGrid} size="sm" title="Toggle grid"><Grid3x3 className="h-4 w-4" /></Toggle>
          <div className="mx-2 h-6 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={exportPNG}><Download className="mr-1 h-4 w-4" />PNG</Button>
          <Button variant="outline" size="sm" onClick={exportPDF}><Download className="mr-1 h-4 w-4" />PDF</Button>
        </div>
      </header>

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
        <aside className="w-64 shrink-0 border-r bg-card">
          <PropLibrary onAdd={store.addProp} />
        </aside>

        <main ref={canvasWrap} className="flex-1 overflow-hidden">
          <FloorCanvas
            floor={store.floor}
            selection={store.selection}
            setSelection={store.setSelection}
            updateProp={store.updateProp}
            updateWall={store.updateWall}
            updateOpening={store.updateOpening}
            showDimensions={showDim}
            showGrid={showGrid}
          />
        </main>

        <aside className="w-72 shrink-0 border-l bg-card">
          <PropertiesPanel
            floor={store.floor}
            selection={store.selection}
            updateProp={store.updateProp}
            updateWall={store.updateWall}
            updateOpening={store.updateOpening}
            updateRoom={store.updateRoom}
            onDelete={store.deleteSelection}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
