// Coordinate system: feet. 1 ft = `PX_PER_FT` px on screen.
export const PX_PER_FT = 14;

export type Floor = string; // floor id

export interface Wall {
  id: string;
  // Axis-aligned for simplicity (the most common case for these plans).
  x1: number; y1: number; x2: number; y2: number; // in feet
  thickness: number; // in feet (e.g., 0.75 for 9")
}

export type OpeningKind = "door" | "window";
export interface Opening {
  id: string;
  wallId: string;
  // Position along the wall, 0..1
  t: number;
  width: number; // ft
  kind: OpeningKind;
  // For doors: hinge side (0 or 1) and swing direction (-1/+1 perpendicular)
  hinge?: 0 | 1;
  swing?: -1 | 1;
  label?: string;
}

export interface Room {
  id: string;
  name: string;
  // Bounding rect in ft used for label placement and area calc
  x: number; y: number; w: number; h: number;
  fill?: "default" | "alt";
  // Optional offset (ft) of the label from room center
  labelDx?: number;
  labelDy?: number;
}

export interface PropItem {
  id: string;
  type: string; // key into PROP_CATALOG
  x: number; y: number; // center, in ft
  w: number; h: number; // ft
  rotation?: number; // degrees
  label?: string;
}

export interface FloorData {
  // Footprint bounds (used for dimension chains and exterior wall auto-render)
  bounds: { x: number; y: number; w: number; h: number };
  walls: Wall[];
  openings: Opening[];
  rooms: Room[];
  props: PropItem[];
}

export interface FloorMeta {
  id: string;
  name: string;
  data: FloorData;
}

export interface PlanData {
  version: 2;
  projectName: string;
  floors: FloorMeta[];
}
