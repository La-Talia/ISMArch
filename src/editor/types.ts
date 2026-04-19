// Coordinate system: feet. 1 ft = `PX_PER_FT` px on screen.
export const PX_PER_FT = 14;

export type Floor = string; // floor id

export interface Wall {
  id: string;
  // Endpoints in feet. Walls can be at any angle.
  x1: number; y1: number; x2: number; y2: number;
  thickness: number; // in feet (e.g., 0.75 for 9")
  // Optional quadratic-bezier control point for curved walls (in feet).
  cx?: number;
  cy?: number;
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

export interface PlotShape {
  // Closed boundary points in feet (polygon). For freehand mode this can be a dense polyline.
  points: { x: number; y: number }[];
  // 'polygon' = straight segments; 'freehand' = treated as a smoothed path.
  kind: "polygon" | "freehand";
}

export interface FloorData {
  // Footprint bounds (used for dimension chains and as the outer canvas extents)
  bounds: { x: number; y: number; w: number; h: number };
  // Optional custom plot boundary (overrides the default rect for the working area)
  plot?: PlotShape;
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
