import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { PlanData, FloorData, PlotShape } from "./types";
import { makeInitialPlan } from "./initialPlan";

// ---- Per-device project list (localStorage only — different per device by design) ----

const INDEX_KEY = "archrax_projects_v1";
const ACTIVE_KEY = "archrax_active_project_v1";
const FIRST_VISIT_KEY = "archrax_first_visit_done_v1";
const PROJECT_KEY = (id: string) => `archrax_project_${id}`;

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
}

function readIndex(): ProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch { return []; }
}
function writeIndex(list: ProjectMeta[]) {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(list)); } catch {}
}
function readPlan(id: string): PlanData | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version === 2 && Array.isArray(parsed.floors)) return parsed;
    return null;
  } catch { return null; }
}
export function writePlan(id: string, plan: PlanData) {
  try { localStorage.setItem(PROJECT_KEY(id), JSON.stringify(plan)); } catch {}
}
function deletePlan(id: string) {
  try { localStorage.removeItem(PROJECT_KEY(id)); } catch {}
}

export function loadProject(id: string): PlanData | null {
  return readPlan(id);
}

export function useProjectsStore() {
  const [projects, setProjects] = useState<ProjectMeta[]>(() => readIndex());
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
  });
  const [firstVisit, setFirstVisit] = useState<boolean>(() => {
    try { return !localStorage.getItem(FIRST_VISIT_KEY); } catch { return true; }
  });

  const markFirstVisitDone = useCallback(() => {
    try { localStorage.setItem(FIRST_VISIT_KEY, "1"); } catch {}
    setFirstVisit(false);
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, []);

  const refreshIndex = useCallback(() => setProjects(readIndex()), []);

  const createProject = useCallback((name: string, plan: PlanData): string => {
    const id = `proj_${nanoid(8)}`;
    const meta: ProjectMeta = { id, name, createdAt: Date.now(), updatedAt: Date.now() };
    const next = [meta, ...readIndex()];
    writeIndex(next);
    writePlan(id, { ...plan, projectName: name });
    setProjects(next);
    setActiveId(id);
    markFirstVisitDone();
    return id;
  }, [markFirstVisitDone, setActiveId]);

  const renameProject = useCallback((id: string, name: string) => {
    const list = readIndex().map((p) => p.id === id ? { ...p, name, updatedAt: Date.now() } : p);
    writeIndex(list);
    setProjects(list);
    const plan = readPlan(id);
    if (plan) writePlan(id, { ...plan, projectName: name });
  }, []);

  const deleteProject = useCallback((id: string) => {
    const list = readIndex().filter((p) => p.id !== id);
    writeIndex(list);
    deletePlan(id);
    setProjects(list);
    if (activeId === id) setActiveId(list[0]?.id || null);
  }, [activeId, setActiveId]);

  const touchProject = useCallback((id: string) => {
    const list = readIndex().map((p) => p.id === id ? { ...p, updatedAt: Date.now() } : p);
    writeIndex(list);
    setProjects(list);
  }, []);

  // If active project disappears, fall back
  useEffect(() => {
    if (activeId && !projects.find((p) => p.id === activeId)) {
      setActiveId(projects[0]?.id || null);
    }
  }, [projects, activeId, setActiveId]);

  return {
    projects,
    activeId,
    setActiveId,
    firstVisit,
    markFirstVisitDone,
    createProject,
    renameProject,
    deleteProject,
    touchProject,
    refreshIndex,
  };
}

// ---- Helpers for plot-based plans ----

export function bboxOfPoints(pts: { x: number; y: number }[]) {
  if (!pts.length) return { x: 0, y: 0, w: 25, h: 25 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

export function planFromPlot(name: string, plot: PlotShape): PlanData {
  const bounds = bboxOfPoints(plot.points);
  const floor: FloorData = {
    bounds,
    plot,
    walls: [],
    openings: [],
    rooms: [],
    props: [],
  };
  return {
    version: 2,
    projectName: name,
    floors: [{ id: "ground", name: "Ground Floor", data: floor }],
  };
}

export function makeDemoPlan(name = "Demo 25 × 70 Plan"): PlanData {
  const p = makeInitialPlan();
  return { ...p, projectName: name };
}
