import React from "react";
import type { FloorData, Opening, PropItem, Room, Wall } from "./types";
import { PROP_CATALOG } from "./propCatalog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCw, RotateCcw } from "lucide-react";

interface Props {
  floor: FloorData;
  selection: { kind: string; id: string } | null;
  updateProp: (id: string, patch: Partial<PropItem>) => void;
  updateWall: (id: string, patch: Partial<Wall>) => void;
  updateOpening: (id: string, patch: Partial<Opening>) => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  onDelete: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  floor, selection, updateProp, updateWall, updateOpening, updateRoom, onDelete,
}) => {
  if (!selection) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a prop, wall, opening, or room to edit its properties.
        <div className="mt-4 space-y-1 text-xs">
          <div><kbd className="rounded bg-muted px-1">Click</kbd> to select</div>
          <div><kbd className="rounded bg-muted px-1">Drag</kbd> props to move</div>
          <div><kbd className="rounded bg-muted px-1">Corners</kbd> to resize</div>
          <div><kbd className="rounded bg-muted px-1">Del</kbd> to delete</div>
        </div>
      </div>
    );
  }

  const wrap = (children: React.ReactNode, title: string) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4">{children}</div>
    </div>
  );

  if (selection.kind === "prop") {
    const p = floor.props.find((p) => p.id === selection.id);
    if (!p) return null;
    const entry = PROP_CATALOG[p.type];
    return wrap(
      <>
        <div className="text-xs text-muted-foreground">{entry?.label || p.type}</div>
        <Field label="Label">
          <Input value={p.label || ""} onChange={(e) => updateProp(p.id, { label: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X (ft)"><NumIn v={p.x} onChange={(v) => updateProp(p.id, { x: v })} /></Field>
          <Field label="Y (ft)"><NumIn v={p.y} onChange={(v) => updateProp(p.id, { y: v })} /></Field>
          <Field label="Width (ft)"><NumIn v={p.w} onChange={(v) => updateProp(p.id, { w: v })} /></Field>
          <Field label="Height (ft)"><NumIn v={p.h} onChange={(v) => updateProp(p.id, { h: v })} /></Field>
        </div>
        <Field label={`Rotation: ${p.rotation || 0}°`}>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => updateProp(p.id, { rotation: ((p.rotation || 0) - 90 + 360) % 360 })}>
              <RotateCcw className="mr-1 h-3 w-3" /> 90°
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateProp(p.id, { rotation: ((p.rotation || 0) + 90) % 360 })}>
              <RotateCw className="mr-1 h-3 w-3" /> 90°
            </Button>
            <Input type="number" value={p.rotation || 0} onChange={(e) => updateProp(p.id, { rotation: Number(e.target.value) })} />
          </div>
        </Field>
      </>,
      "Prop",
    );
  }

  if (selection.kind === "wall") {
    const w = floor.walls.find((w) => w.id === selection.id);
    if (!w) return null;
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
    return wrap(
      <>
        <Field label={`Length: ${len.toFixed(2)} ft`}><div /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X1"><NumIn v={w.x1} onChange={(v) => updateWall(w.id, { x1: v })} /></Field>
          <Field label="Y1"><NumIn v={w.y1} onChange={(v) => updateWall(w.id, { y1: v })} /></Field>
          <Field label="X2"><NumIn v={w.x2} onChange={(v) => updateWall(w.id, { x2: v })} /></Field>
          <Field label="Y2"><NumIn v={w.y2} onChange={(v) => updateWall(w.id, { y2: v })} /></Field>
        </div>
        <Field label="Thickness (ft)">
          <NumIn v={w.thickness} onChange={(v) => updateWall(w.id, { thickness: Math.max(0.25, v) })} />
        </Field>
      </>,
      "Wall",
    );
  }

  if (selection.kind === "opening") {
    const o = floor.openings.find((o) => o.id === selection.id);
    if (!o) return null;
    return wrap(
      <>
        <Field label="Type">
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={o.kind}
            onChange={(e) => updateOpening(o.id, { kind: e.target.value as "door" | "window" })}>
            <option value="door">Door</option>
            <option value="window">Window</option>
          </select>
        </Field>
        <Field label="Width (ft)"><NumIn v={o.width} onChange={(v) => updateOpening(o.id, { width: v })} /></Field>
        <Field label="Position along wall (0-1)">
          <NumIn v={o.t} step={0.05} onChange={(v) => updateOpening(o.id, { t: Math.max(0, Math.min(1, v)) })} />
        </Field>
        {o.kind === "door" && (() => {
          const w = floor.walls.find((wl) => wl.id === o.wallId);
          const horizontal = w ? w.y1 === w.y2 : true;
          // Map (hinge, swing) -> direction label depending on wall orientation
          const hinge = (o.hinge ?? 0) as 0 | 1;
          const swing = (o.swing ?? 1) as -1 | 1;
          const value = `${hinge}_${swing}`;
          const opts = horizontal
            ? [
                { v: "0_-1", label: "Hinge Left, swing Up (Back)" },
                { v: "0_1",  label: "Hinge Left, swing Down (Front)" },
                { v: "1_-1", label: "Hinge Right, swing Up (Back)" },
                { v: "1_1",  label: "Hinge Right, swing Down (Front)" },
              ]
            : [
                { v: "0_-1", label: "Hinge Top, swing Left" },
                { v: "0_1",  label: "Hinge Top, swing Right" },
                { v: "1_-1", label: "Hinge Bottom, swing Left" },
                { v: "1_1",  label: "Hinge Bottom, swing Right" },
              ];
          return (
            <Field label="Door direction">
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={value}
                onChange={(e) => {
                  const [h, s] = e.target.value.split("_");
                  updateOpening(o.id, { hinge: Number(h) as 0 | 1, swing: Number(s) as -1 | 1 });
                }}>
                {opts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" onClick={() => updateOpening(o.id, { hinge: (hinge === 0 ? 1 : 0) as 0 | 1 })}>
                  Flip hinge ↔
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateOpening(o.id, { swing: (swing === 1 ? -1 : 1) as -1 | 1 })}>
                  Flip swing ↕
                </Button>
              </div>
            </Field>
          );
        })()}
        <Field label="Label">
          <Input value={o.label || ""} onChange={(e) => updateOpening(o.id, { label: e.target.value })} />
        </Field>
      </>,
      o.kind === "door" ? "Door" : "Window",
    );
  }

  if (selection.kind === "room" || selection.kind === "room_label") {
    const r = floor.rooms.find((r) => r.id === selection.id);
    if (!r) return null;
    return wrap(
      <>
        <Field label="Name">
          <Input value={r.name} onChange={(e) => updateRoom(r.id, { name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X (ft)"><NumIn v={r.x} onChange={(v) => updateRoom(r.id, { x: v })} /></Field>
          <Field label="Y (ft)"><NumIn v={r.y} onChange={(v) => updateRoom(r.id, { y: v })} /></Field>
          <Field label="Width (ft)"><NumIn v={r.w} onChange={(v) => updateRoom(r.id, { w: v })} /></Field>
          <Field label="Height (ft)"><NumIn v={r.h} onChange={(v) => updateRoom(r.id, { h: v })} /></Field>
        </div>
        <Field label="Area">
          <div className="text-sm">{(r.w * r.h).toFixed(1)} sq ft</div>
        </Field>
        <Field label="Fill">
          <select className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={r.fill || "default"}
            onChange={(e) => updateRoom(r.id, { fill: e.target.value as "default" | "alt" })}>
            <option value="default">Default</option>
            <option value="alt">Alt (warm)</option>
          </select>
        </Field>
      </>,
      "Room",
    );
  }
  return null;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

const NumIn: React.FC<{ v: number; onChange: (n: number) => void; step?: number }> = ({ v, onChange, step = 0.25 }) => (
  <Input type="number" step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
);
