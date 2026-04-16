import { nanoid } from "nanoid";
import type { PlanData, Wall, Opening, Room, PropItem } from "./types";

// Plot footprint: 25 ft (W, road side East) x 70 ft (depth N-S).
// Coordinate system: x = East-West (0..25), y = North-South (0..70).
// y=0 is NORTH, y=70 is SOUTH. x=0 is WEST (back), x=25 is EAST (road).
const W = 25;
const D = 70;
const T = 0.75; // wall thickness in ft

let _i = 0;
const id = (p: string) => `${p}_${++_i}_${nanoid(4)}`;

function exteriorWalls(): Wall[] {
  return [
    { id: id("w"), x1: 0, y1: 0, x2: W, y2: 0, thickness: T },
    { id: id("w"), x1: W, y1: 0, x2: W, y2: D, thickness: T },
    { id: id("w"), x1: 0, y1: D, x2: W, y2: D, thickness: T },
    { id: id("w"), x1: 0, y1: 0, x2: 0, y2: D, thickness: T },
  ];
}

// ---------- GROUND FLOOR ----------
function groundFloor() {
  const walls: Wall[] = [...exteriorWalls()];
  const openings: Opening[] = [];
  const rooms: Room[] = [];
  const props: PropItem[] = [];

  // Front gardening (East-front): y 0..6 across full width is open garden + parking driveway
  rooms.push({ id: id("r"), name: "Front Garden", x: 0, y: 0, w: W, h: 6, fill: "alt" });
  walls.push({ id: id("w"), x1: 0, y1: 6, x2: W, y2: 6, thickness: T });
  // Gate opening on east at front
  openings.push({ id: id("o"), wallId: walls[0].id, t: 0.5, width: 12, kind: "door", label: "MAIN GATE" });

  // Parking zone: y 6..22, x 0..16 (covered) ; office entry corridor x 16..25
  rooms.push({ id: id("r"), name: "Car Parking", x: 0, y: 6, w: 16, h: 16 });
  rooms.push({ id: id("r"), name: "Office Entry", x: 16, y: 6, w: 9, h: 16, fill: "alt" });
  walls.push({ id: id("w"), x1: 16, y1: 6, x2: 16, y2: 22, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 22, x2: W, y2: 22, thickness: T });

  props.push({ id: id("p"), type: "car", x: 4, y: 14, w: 6.5, h: 13, rotation: 0 });
  props.push({ id: id("p"), type: "car", x: 11, y: 14, w: 6.5, h: 13, rotation: 0 });
  props.push({ id: id("p"), type: "bike", x: 18, y: 9, w: 2, h: 5, rotation: 0 });
  props.push({ id: id("p"), type: "scooter", x: 21, y: 9, w: 2, h: 5, rotation: 0 });
  props.push({ id: id("p"), type: "plant_lg", x: 23, y: 17, w: 2, h: 2 });
  props.push({ id: id("p"), type: "plant_lg", x: 23, y: 20, w: 2, h: 2, rotation: 0 });

  // Office (y 22..44)
  rooms.push({ id: id("r"), name: "Office Workspace", x: 0, y: 22, w: 16, h: 22 });
  rooms.push({ id: id("r"), name: "Cabin", x: 16, y: 22, w: 9, h: 10, fill: "alt" });
  rooms.push({ id: id("r"), name: "Pantry", x: 16, y: 32, w: 4.5, h: 6, fill: "alt" });
  rooms.push({ id: id("r"), name: "Office WC", x: 20.5, y: 32, w: 4.5, h: 6, fill: "alt" });
  rooms.push({ id: id("r"), name: "Servant", x: 16, y: 38, w: 9, h: 6, fill: "alt" });
  walls.push({ id: id("w"), x1: 16, y1: 22, x2: 16, y2: 44, thickness: T });
  walls.push({ id: id("w"), x1: 16, y1: 32, x2: W, y2: 32, thickness: T });
  walls.push({ id: id("w"), x1: 20.5, y1: 32, x2: 20.5, y2: 38, thickness: T });
  walls.push({ id: id("w"), x1: 16, y1: 38, x2: W, y2: 38, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 44, x2: W, y2: 44, thickness: T });

  props.push({ id: id("p"), type: "reception_desk", x: 8, y: 24.5, w: 6, h: 2.5 });
  props.push({ id: id("p"), type: "desk", x: 3, y: 30, w: 4.5, h: 2 });
  props.push({ id: id("p"), type: "desk", x: 3, y: 35, w: 4.5, h: 2 });
  props.push({ id: id("p"), type: "desk", x: 3, y: 40, w: 4.5, h: 2 });
  props.push({ id: id("p"), type: "office_chair", x: 3, y: 32.2, w: 1.8, h: 1.8 });
  props.push({ id: id("p"), type: "office_chair", x: 3, y: 37.2, w: 1.8, h: 1.8 });
  props.push({ id: id("p"), type: "office_chair", x: 3, y: 42.2, w: 1.8, h: 1.8 });
  props.push({ id: id("p"), type: "desk_l", x: 11, y: 28, w: 4, h: 4, rotation: 0 });
  props.push({ id: id("p"), type: "office_chair", x: 13, y: 30.5, w: 1.8, h: 1.8 });
  props.push({ id: id("p"), type: "filing_cabinet", x: 14, y: 41, w: 1.5, h: 2 });

  // pantry
  props.push({ id: id("p"), type: "kitchen_counter", x: 18.5, y: 33, w: 4, h: 1.6, rotation: 0 });
  props.push({ id: id("p"), type: "sink", x: 17.5, y: 33, w: 2, h: 1.6 });
  // office wc
  props.push({ id: id("p"), type: "toilet", x: 21.5, y: 34, w: 1.6, h: 2.4 });
  props.push({ id: id("p"), type: "basin", x: 23.5, y: 33, w: 1.5, h: 1.2 });
  // servant
  props.push({ id: id("p"), type: "bed_single", x: 18, y: 41, w: 3.5, h: 6, rotation: 90 });

  // 1BHK Residence (y 44..64)
  rooms.push({ id: id("r"), name: "Living / Dining", x: 0, y: 44, w: W, h: 10 });
  rooms.push({ id: id("r"), name: "Master Bedroom", x: 0, y: 54, w: 14, h: 10, fill: "alt" });
  rooms.push({ id: id("r"), name: "Kitchen", x: 14, y: 54, w: 6, h: 10, fill: "alt" });
  rooms.push({ id: id("r"), name: "Bathroom", x: 20, y: 54, w: 5, h: 5, fill: "alt" });
  rooms.push({ id: id("r"), name: "Stairs", x: 20, y: 59, w: 5, h: 5, fill: "alt" });
  walls.push({ id: id("w"), x1: 0, y1: 54, x2: W, y2: 54, thickness: T });
  walls.push({ id: id("w"), x1: 14, y1: 54, x2: 14, y2: 64, thickness: T });
  walls.push({ id: id("w"), x1: 20, y1: 54, x2: 20, y2: 64, thickness: T });
  walls.push({ id: id("w"), x1: 20, y1: 59, x2: W, y2: 59, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 64, x2: W, y2: 64, thickness: T });

  props.push({ id: id("p"), type: "sofa_3", x: 4, y: 46, w: 7, h: 3 });
  props.push({ id: id("p"), type: "armchair", x: 13, y: 46, w: 2.8, h: 2.8 });
  props.push({ id: id("p"), type: "coffee_table", x: 5, y: 50, w: 4, h: 2 });
  props.push({ id: id("p"), type: "tv_unit", x: 18, y: 45, w: 5, h: 1.4 });
  props.push({ id: id("p"), type: "dining_4", x: 18, y: 50, w: 4, h: 3 });

  props.push({ id: id("p"), type: "bed_queen", x: 4, y: 57, w: 5.5, h: 6.7 });
  props.push({ id: id("p"), type: "nightstand", x: 0.9, y: 55, w: 1.8, h: 1.5 });
  props.push({ id: id("p"), type: "wardrobe", x: 10, y: 55.5, w: 6, h: 2, rotation: 90 });

  props.push({ id: id("p"), type: "kitchen_counter", x: 14.5, y: 55, w: 5, h: 2 });
  props.push({ id: id("p"), type: "stove", x: 15, y: 56, w: 2.5, h: 2 });
  props.push({ id: id("p"), type: "fridge", x: 17.5, y: 61, w: 2.5, h: 2.5 });
  props.push({ id: id("p"), type: "sink", x: 18, y: 55.2, w: 2, h: 1.6 });

  props.push({ id: id("p"), type: "toilet", x: 21, y: 55, w: 1.6, h: 2.4 });
  props.push({ id: id("p"), type: "shower", x: 22, y: 56, w: 2.5, h: 2.5 });
  props.push({ id: id("p"), type: "basin", x: 21, y: 57.5, w: 1.5, h: 1.2 });

  props.push({ id: id("p"), type: "stairs", x: 20.5, y: 59.5, w: 4, h: 4.5, rotation: 0 });

  // Back garden
  walls.push({ id: id("w"), x1: 0, y1: 64, x2: W, y2: 64, thickness: T });
  rooms.push({ id: id("r"), name: "Back Garden", x: 0, y: 64, w: W, h: 6, fill: "alt" });
  props.push({ id: id("p"), type: "tree", x: 4, y: 67, w: 4, h: 4 });
  props.push({ id: id("p"), type: "garden_bed", x: 16, y: 66, w: 8, h: 4 });

  // doors/windows on a few key walls
  // Front door for residence on north-west? Use an interior door from living to entry.
  // Office entry from Office Entry into Office Workspace
  openings.push({ id: id("o"), wallId: walls[2].id /* y=22 sep, but easier: pick by index later */, t: 0.5, width: 3, kind: "door" });

  return { bounds: { x: 0, y: 0, w: W, h: D }, walls, openings, rooms, props };
}

// ---------- FIRST FLOOR ----------
function firstFloor() {
  const walls: Wall[] = [...exteriorWalls()];
  const openings: Opening[] = [];
  const rooms: Room[] = [];
  const props: PropItem[] = [];

  // Front terrace area above parking (open to sky / pergola)
  rooms.push({ id: id("r"), name: "Open Terrace", x: 0, y: 0, w: W, h: 22, fill: "alt" });
  walls.push({ id: id("w"), x1: 0, y1: 22, x2: W, y2: 22, thickness: T });
  props.push({ id: id("p"), type: "pergola", x: 1, y: 2, w: 14, h: 18 });
  props.push({ id: id("p"), type: "dining_4", x: 17, y: 6, w: 4, h: 3 });
  props.push({ id: id("p"), type: "bench", x: 17, y: 12, w: 5, h: 1.5 });
  props.push({ id: id("p"), type: "planter_box", x: 17, y: 17, w: 4, h: 1.2 });
  props.push({ id: id("p"), type: "plant_lg", x: 23, y: 4, w: 2, h: 2 });
  props.push({ id: id("p"), type: "plant_lg", x: 23, y: 18, w: 2, h: 2 });

  // Foyer / passage + Puja
  rooms.push({ id: id("r"), name: "Passage", x: 0, y: 22, w: 14, h: 6 });
  rooms.push({ id: id("r"), name: "Puja Room", x: 14, y: 22, w: 5, h: 6, fill: "alt" });
  rooms.push({ id: id("r"), name: "Stairs", x: 19, y: 22, w: 6, h: 6, fill: "alt" });
  walls.push({ id: id("w"), x1: 14, y1: 22, x2: 14, y2: 28, thickness: T });
  walls.push({ id: id("w"), x1: 19, y1: 22, x2: 19, y2: 28, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 28, x2: W, y2: 28, thickness: T });
  props.push({ id: id("p"), type: "pooja_unit", x: 15, y: 23, w: 3, h: 1.8 });
  props.push({ id: id("p"), type: "stairs_down", x: 19.5, y: 22.5, w: 4, h: 5 });

  // Bedroom 2 (NW) + Toilet
  rooms.push({ id: id("r"), name: "Bedroom 2", x: 0, y: 28, w: 14, h: 12 });
  rooms.push({ id: id("r"), name: "Common Toilet", x: 14, y: 28, w: 5, h: 6, fill: "alt" });
  rooms.push({ id: id("r"), name: "Utility", x: 19, y: 28, w: 6, h: 6, fill: "alt" });
  walls.push({ id: id("w"), x1: 14, y1: 28, x2: 14, y2: 40, thickness: T });
  walls.push({ id: id("w"), x1: 14, y1: 34, x2: W, y2: 34, thickness: T });
  walls.push({ id: id("w"), x1: 19, y1: 28, x2: 19, y2: 34, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 40, x2: 14, y2: 40, thickness: T });
  props.push({ id: id("p"), type: "bed_queen", x: 4, y: 30, w: 5.5, h: 6.7 });
  props.push({ id: id("p"), type: "nightstand", x: 0.9, y: 28.5, w: 1.8, h: 1.5 });
  props.push({ id: id("p"), type: "wardrobe", x: 10, y: 29, w: 6, h: 2, rotation: 90 });
  props.push({ id: id("p"), type: "study_table", x: 9, y: 38, w: 4, h: 2 });
  props.push({ id: id("p"), type: "toilet", x: 15, y: 29, w: 1.6, h: 2.4 });
  props.push({ id: id("p"), type: "shower", x: 16, y: 31, w: 2.5, h: 2.5 });
  props.push({ id: id("p"), type: "washing_machine", x: 20, y: 29, w: 2.2, h: 2.2 });
  props.push({ id: id("p"), type: "basin", x: 23, y: 29.5, w: 1.5, h: 1.2 });

  // Kitchen + Living
  rooms.push({ id: id("r"), name: "Kitchen", x: 14, y: 34, w: W - 14, h: 14, fill: "alt" });
  rooms.push({ id: id("r"), name: "Living / Dining", x: 0, y: 40, w: 14, h: 14 });
  walls.push({ id: id("w"), x1: 14, y1: 48, x2: W, y2: 48, thickness: T });
  walls.push({ id: id("w"), x1: 0, y1: 54, x2: W, y2: 54, thickness: T });
  props.push({ id: id("p"), type: "sofa_3", x: 4, y: 41, w: 7, h: 3 });
  props.push({ id: id("p"), type: "coffee_table", x: 5, y: 45, w: 4, h: 2 });
  props.push({ id: id("p"), type: "tv_unit", x: 8, y: 52, w: 5, h: 1.4 });
  props.push({ id: id("p"), type: "dining_6", x: 4, y: 48, w: 6, h: 3.2 });
  props.push({ id: id("p"), type: "kitchen_counter", x: 14.5, y: 35, w: 6, h: 2, rotation: 90 });
  props.push({ id: id("p"), type: "stove", x: 15, y: 36, w: 2.5, h: 2 });
  props.push({ id: id("p"), type: "sink_double", x: 14.8, y: 41, w: 3, h: 1.6 });
  props.push({ id: id("p"), type: "fridge", x: 22, y: 35, w: 2.5, h: 2.5 });
  props.push({ id: id("p"), type: "kitchen_island", x: 19, y: 42, w: 5, h: 2.5 });

  // Master Bedroom (SW) + Master Bath + Walk-in closet
  rooms.push({ id: id("r"), name: "Master Bedroom", x: 0, y: 54, w: 16, h: 16 });
  rooms.push({ id: id("r"), name: "Master Bath", x: 16, y: 54, w: 9, h: 8, fill: "alt" });
  rooms.push({ id: id("r"), name: "Walk-in Closet", x: 16, y: 62, w: 9, h: 8, fill: "alt" });
  walls.push({ id: id("w"), x1: 16, y1: 54, x2: 16, y2: 70, thickness: T });
  walls.push({ id: id("w"), x1: 16, y1: 62, x2: W, y2: 62, thickness: T });
  props.push({ id: id("p"), type: "bed_king", x: 5, y: 58, w: 6.5, h: 7 });
  props.push({ id: id("p"), type: "nightstand", x: 0.9, y: 56, w: 1.8, h: 1.5 });
  props.push({ id: id("p"), type: "nightstand", x: 12.3, y: 56, w: 1.8, h: 1.5 });
  props.push({ id: id("p"), type: "tv_unit", x: 5, y: 67.5, w: 5, h: 1.4 });
  props.push({ id: id("p"), type: "dressing_table", x: 11, y: 67, w: 4, h: 1.5 });
  props.push({ id: id("p"), type: "bathtub", x: 17, y: 55, w: 5, h: 2.5 });
  props.push({ id: id("p"), type: "shower", x: 17, y: 58, w: 3, h: 3 });
  props.push({ id: id("p"), type: "toilet", x: 22.5, y: 58.5, w: 1.6, h: 2.4 });
  props.push({ id: id("p"), type: "basin", x: 22.5, y: 55, w: 1.5, h: 1.2 });
  props.push({ id: id("p"), type: "wardrobe", x: 17, y: 63, w: 6, h: 2 });
  props.push({ id: id("p"), type: "wardrobe", x: 17, y: 67, w: 6, h: 2 });

  return { bounds: { x: 0, y: 0, w: W, h: D }, walls, openings, rooms, props };
}

export function makeInitialPlan(): PlanData {
  return { version: 1, ground: groundFloor(), first: firstFloor() };
}
