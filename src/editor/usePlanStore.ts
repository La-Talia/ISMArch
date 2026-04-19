import { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { Floor, FloorData, FloorMeta, Opening, PlanData, PropItem, Room, Wall } from "./types";
import { makeBlankFloorFrom, makeInitialPlan } from "./initialPlan";
import { writePlan, loadProject } from "./projectsStore";

export function usePlanStore(projectId: string | null, onPlanChange?: (id: string) => void) {
  const [plan, setPlan] = useState<PlanData>(() => {
    if (projectId) {
      const p = loadProject(projectId);
      if (p) return p;
    }
    return makeInitialPlan();
  });
  const [activeFloor, setActiveFloor] = useState<Floor>(() => plan.floors[0]?.id || "ground");
  const [selection, setSelection] = useState<{ kind: "prop" | "wall" | "opening" | "room" | "room_label"; id: string } | null>(null);
  const historyRef = useRef<PlanData[]>([]);
  const futureRef = useRef<PlanData[]>([]);
  const currentIdRef = useRef<string | null>(projectId);

  // Swap when active project changes
  useEffect(() => {
    if (!projectId) return;
    if (currentIdRef.current === projectId) return;
    const p = loadProject(projectId);
    if (p) {
      historyRef.current = [];
      futureRef.current = [];
      setPlan(p);
      setSelection(null);
      setActiveFloor(p.floors[0]?.id || "ground");
      currentIdRef.current = projectId;
    }
  }, [projectId]);

  // Persist
  useEffect(() => {
    if (!projectId) return;
    writePlan(projectId, plan);
    onPlanChange?.(projectId);
  }, [plan, projectId, onPlanChange]);

  // Ensure activeFloor is valid
  useEffect(() => {
    if (!plan.floors.find((f) => f.id === activeFloor)) {
      setActiveFloor(plan.floors[0]?.id || "ground");
    }
  }, [plan.floors, activeFloor]);

  // Replace entire plan (used by Import)
  const replacePlan = useCallback((next: PlanData) => {
    historyRef.current = [];
    futureRef.current = [];
    setPlan(next);
    setSelection(null);
    setActiveFloor(next.floors[0]?.id || "ground");
  }, []);

  const commit = useCallback((updater: (p: PlanData) => PlanData) => {
    setPlan((prev) => {
      historyRef.current.push(prev);
      if (historyRef.current.length > 50) historyRef.current.shift();
      futureRef.current = [];
      return updater(prev);
    });
  }, []);

  const undo = useCallback(() => {
    setPlan((prev) => {
      const h = historyRef.current.pop();
      if (!h) return prev;
      futureRef.current.push(prev);
      return h;
    });
  }, []);
  const redo = useCallback(() => {
    setPlan((prev) => {
      const f = futureRef.current.pop();
      if (!f) return prev;
      historyRef.current.push(prev);
      return f;
    });
  }, []);

  const updateFloor = useCallback((updater: (f: FloorData) => FloorData) => {
    commit((p) => ({
      ...p,
      floors: p.floors.map((fm) => fm.id === activeFloor ? { ...fm, data: updater(fm.data) } : fm),
    }));
  }, [activeFloor, commit]);

  const floorMeta: FloorMeta = plan.floors.find((f) => f.id === activeFloor) || plan.floors[0];
  const floor: FloorData = floorMeta.data;

  const addProp = (type: string, defaults: { w: number; h: number }) => {
    const newProp: PropItem = {
      id: `p_${nanoid(6)}`,
      type, x: floor.bounds.x + floor.bounds.w / 2, y: floor.bounds.y + floor.bounds.h / 2,
      w: defaults.w, h: defaults.h, rotation: 0,
    };
    updateFloor((f) => ({ ...f, props: [...f.props, newProp] }));
    setSelection({ kind: "prop", id: newProp.id });
  };

  const updateProp = (id: string, patch: Partial<PropItem>) =>
    updateFloor((f) => ({ ...f, props: f.props.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const deleteSelection = () => {
    if (!selection) return;
    updateFloor((f) => {
      switch (selection.kind) {
        case "prop": return { ...f, props: f.props.filter((p) => p.id !== selection.id) };
        case "wall": return { ...f, walls: f.walls.filter((w) => w.id !== selection.id), openings: f.openings.filter((o) => o.wallId !== selection.id) };
        case "opening": return { ...f, openings: f.openings.filter((o) => o.id !== selection.id) };
        case "room":
        case "room_label":
          return { ...f, rooms: f.rooms.filter((r) => r.id !== selection.id) };
      }
      return f;
    });
    setSelection(null);
  };

  const addWall = (w: Omit<Wall, "id">) => {
    const wall: Wall = { ...w, id: `w_${nanoid(6)}` };
    updateFloor((f) => ({ ...f, walls: [...f.walls, wall] }));
    setSelection({ kind: "wall", id: wall.id });
  };
  const updateWall = (id: string, patch: Partial<Wall>) =>
    updateFloor((f) => ({ ...f, walls: f.walls.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));

  const addOpening = (o: Omit<Opening, "id">) => {
    const op: Opening = { ...o, id: `o_${nanoid(6)}` };
    updateFloor((f) => ({ ...f, openings: [...f.openings, op] }));
    setSelection({ kind: "opening", id: op.id });
  };
  const updateOpening = (id: string, patch: Partial<Opening>) =>
    updateFloor((f) => ({ ...f, openings: f.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));

  const addRoom = (r: Omit<Room, "id">) => {
    const room: Room = { ...r, id: `r_${nanoid(6)}` };
    updateFloor((f) => ({ ...f, rooms: [...f.rooms, room] }));
    setSelection({ kind: "room", id: room.id });
  };
  const updateRoom = (id: string, patch: Partial<Room>) =>
    updateFloor((f) => ({ ...f, rooms: f.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const setProjectName = (name: string) =>
    commit((p) => ({ ...p, projectName: name }));

  const renameFloor = (id: string, name: string) =>
    commit((p) => ({ ...p, floors: p.floors.map((f) => f.id === id ? { ...f, name } : f) }));

  const addFloor = () => {
    commit((p) => {
      const last = p.floors[p.floors.length - 1];
      const newId = `floor_${nanoid(5)}`;
      const newName = `Floor ${p.floors.length + 1}`;
      const data = makeBlankFloorFrom(last.data);
      const next = { ...p, floors: [...p.floors, { id: newId, name: newName, data }] };
      // Switch to it
      setTimeout(() => setActiveFloor(newId), 0);
      return next;
    });
  };

  const removeFloor = (id: string) => {
    commit((p) => {
      if (p.floors.length <= 1) return p;
      return { ...p, floors: p.floors.filter((f) => f.id !== id) };
    });
  };

  const reset = () => {
    historyRef.current = [];
    futureRef.current = [];
    setPlan(makeInitialPlan());
    setSelection(null);
    setActiveFloor("ground");
  };

  const newProject = () => {
    historyRef.current = [];
    futureRef.current = [];
    const blank: PlanData = {
      version: 2,
      projectName: "Untitled Plan",
      floors: [{
        id: "ground",
        name: "Ground Floor",
        data: {
          bounds: { x: 0, y: 0, w: 25, h: 70 },
          walls: [
            { id: `w_${nanoid(5)}`, x1: 0, y1: 0, x2: 25, y2: 0, thickness: 0.75 },
            { id: `w_${nanoid(5)}`, x1: 25, y1: 0, x2: 25, y2: 70, thickness: 0.75 },
            { id: `w_${nanoid(5)}`, x1: 0, y1: 70, x2: 25, y2: 70, thickness: 0.75 },
            { id: `w_${nanoid(5)}`, x1: 0, y1: 0, x2: 0, y2: 70, thickness: 0.75 },
          ],
          openings: [], rooms: [], props: [],
        },
      }],
    };
    setPlan(blank);
    setSelection(null);
    setActiveFloor("ground");
  };

  return {
    plan, activeFloor, setActiveFloor, floor, floorMeta, selection, setSelection,
    addProp, updateProp, addWall, updateWall, addOpening, updateOpening, addRoom, updateRoom,
    deleteSelection, undo, redo, reset, newProject,
    setProjectName, renameFloor, addFloor, removeFloor,
  };
}
