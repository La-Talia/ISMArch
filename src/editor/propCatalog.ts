import React from "react";

// Each prop renders inside a coordinate space of [0..w, 0..h] in feet.
// Strokes use currentColor (hsl(var(--prop-stroke))).
export interface CatalogEntry {
  label: string;
  category: string;
  defaultW: number;
  defaultH: number;
  render: (w: number, h: number) => React.ReactNode;
}

const stroke = "currentColor";
const sw = 0.06; // stroke width in feet

const rect = (x: number, y: number, w: number, h: number, opts: any = {}) =>
  React.createElement("rect", {
    x, y, width: w, height: h, fill: "hsl(var(--prop-fill))",
    stroke, strokeWidth: sw, ...opts,
  });
const line = (x1: number, y1: number, x2: number, y2: number) =>
  React.createElement("line", { x1, y1, x2, y2, stroke, strokeWidth: sw });
const circle = (cx: number, cy: number, r: number, opts: any = {}) =>
  React.createElement("circle", { cx, cy, r, fill: "hsl(var(--prop-fill))", stroke, strokeWidth: sw, ...opts });
const path = (d: string, opts: any = {}) =>
  React.createElement("path", { d, fill: "hsl(var(--prop-fill))", stroke, strokeWidth: sw, ...opts });
const text = (x: number, y: number, t: string, size = 0.6) =>
  React.createElement("text", {
    x, y, fontSize: size, textAnchor: "middle",
    fill: "currentColor", fontFamily: "ui-sans-serif, system-ui",
    dominantBaseline: "middle",
  }, t);

const g = (...children: React.ReactNode[]) =>
  React.createElement(React.Fragment, null, ...children);

export const PROP_CATALOG: Record<string, CatalogEntry> = {
  // ----- Beds -----
  bed_king: {
    label: "King Bed", category: "Bedroom", defaultW: 6.5, defaultH: 7,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(0.2, 0.2, w - 0.4, 1.4),
      rect(0.2, 1.8, (w - 0.6) / 2, h - 2),
      rect(0.4 + (w - 0.6) / 2, 1.8, (w - 0.6) / 2, h - 2),
    ),
  },
  bed_queen: {
    label: "Queen Bed", category: "Bedroom", defaultW: 5.5, defaultH: 6.7,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(0.2, 0.2, w - 0.4, 1.2),
      rect(0.5, 1.6, w - 1, h - 1.8),
    ),
  },
  bed_single: {
    label: "Single Bed", category: "Bedroom", defaultW: 3.5, defaultH: 6.5,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(0.2, 0.2, w - 0.4, 1),
      rect(0.4, 1.4, w - 0.8, h - 1.6),
    ),
  },
  nightstand: {
    label: "Nightstand", category: "Bedroom", defaultW: 1.8, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h), line(0.2, 0.2, w - 0.2, 0.2)),
  },
  wardrobe: {
    label: "Wardrobe", category: "Bedroom", defaultW: 6, defaultH: 2,
    render: (w, h) => g(
      rect(0, 0, w, h),
      line(w / 2, 0, w / 2, h),
      line(0, h * 0.8, w, h * 0.8),
    ),
  },
  dresser: {
    label: "Dresser", category: "Bedroom", defaultW: 4, defaultH: 1.6,
    render: (w, h) => g(
      rect(0, 0, w, h),
      line(w / 3, 0, w / 3, h),
      line((w / 3) * 2, 0, (w / 3) * 2, h),
    ),
  },

  // ----- Living -----
  sofa_3: {
    label: "Sofa (3-seat)", category: "Living", defaultW: 7, defaultH: 3,
    render: (w, h) => g(
      rect(0, 0, w, h, { rx: 0.3 }),
      rect(0.3, 0.3, w - 0.6, h - 0.9, { rx: 0.2 }),
      line(w / 3, 0.3, w / 3, h - 0.6),
      line((w / 3) * 2, 0.3, (w / 3) * 2, h - 0.6),
    ),
  },
  sofa_2: {
    label: "Loveseat", category: "Living", defaultW: 5, defaultH: 3,
    render: (w, h) => g(
      rect(0, 0, w, h, { rx: 0.3 }),
      rect(0.3, 0.3, w - 0.6, h - 0.9, { rx: 0.2 }),
      line(w / 2, 0.3, w / 2, h - 0.6),
    ),
  },
  armchair: {
    label: "Armchair", category: "Living", defaultW: 2.8, defaultH: 2.8,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.3 }), rect(0.3, 0.3, w - 0.6, h - 0.9, { rx: 0.2 })),
  },
  coffee_table: {
    label: "Coffee Table", category: "Living", defaultW: 4, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.2 })),
  },
  tv_unit: {
    label: "TV Unit", category: "Living", defaultW: 5, defaultH: 1.4,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(w / 2 - w * 0.35, h * 0.15, w * 0.7, h * 0.4, { fill: "hsl(var(--prop-stroke))" }),
    ),
  },
  tv: {
    label: "TV (wall)", category: "Living", defaultW: 4, defaultH: 0.4,
    render: (w, h) => g(rect(0, 0, w, h, { fill: "hsl(var(--prop-stroke))" })),
  },
  bookshelf: {
    label: "Bookshelf", category: "Living", defaultW: 4, defaultH: 1,
    render: (w, h) => g(rect(0, 0, w, h), line(w / 3, 0, w / 3, h), line((w / 3) * 2, 0, (w / 3) * 2, h)),
  },

  // ----- Dining -----
  dining_4: {
    label: "Dining (4)", category: "Dining", defaultW: 4, defaultH: 3,
    render: (w, h) => g(
      rect(0.6, 0.3, w - 1.2, h - 0.6, { rx: 0.2 }),
      rect(0, h / 2 - 0.6, 0.5, 1.2),
      rect(w - 0.5, h / 2 - 0.6, 0.5, 1.2),
      rect(w / 2 - 0.6, 0, 1.2, 0.3),
      rect(w / 2 - 0.6, h - 0.3, 1.2, 0.3),
    ),
  },
  dining_6: {
    label: "Dining (6)", category: "Dining", defaultW: 6, defaultH: 3.2,
    render: (w, h) => g(
      rect(0.6, 0.4, w - 1.2, h - 0.8, { rx: 0.2 }),
      ...[0.2, w / 2 - 0.6, w - 1.4].flatMap((x) => [rect(x, 0, 1.2, 0.4), rect(x, h - 0.4, 1.2, 0.4)]),
    ),
  },
  dining_8: {
    label: "Dining (8)", category: "Dining", defaultW: 8, defaultH: 3.5,
    render: (w, h) => g(
      rect(0.6, 0.4, w - 1.2, h - 0.8, { rx: 0.2 }),
      ...[0.4, 1.9, 4.7, 6.2].map((x) => rect(x, 0, 1.2, 0.4)),
      ...[0.4, 1.9, 4.7, 6.2].map((x) => rect(x, h - 0.4, 1.2, 0.4)),
    ),
  },
  chair: {
    label: "Chair", category: "Dining", defaultW: 1.5, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.15 })),
  },
  bar_stool: {
    label: "Bar Stool", category: "Dining", defaultW: 1.3, defaultH: 1.3,
    render: (w, h) => circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.05),
  },

  // ----- Kitchen -----
  kitchen_counter: {
    label: "Counter", category: "Kitchen", defaultW: 6, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), line(0, h - 0.05, w, h - 0.05)),
  },
  kitchen_island: {
    label: "Island", category: "Kitchen", defaultW: 5, defaultH: 2.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.1 }), line(0.2, 0.2, w - 0.2, 0.2)),
  },
  sink: {
    label: "Sink", category: "Kitchen", defaultW: 2, defaultH: 1.6,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(0.2, 0.2, w - 0.4, h - 0.4, { rx: 0.15 }),
      circle(w / 2, 0.15, 0.07, { fill: "hsl(var(--prop-stroke))" }),
    ),
  },
  sink_double: {
    label: "Double Sink", category: "Kitchen", defaultW: 3, defaultH: 1.6,
    render: (w, h) => g(
      rect(0, 0, w, h),
      rect(0.2, 0.2, (w - 0.6) / 2, h - 0.4, { rx: 0.15 }),
      rect(0.4 + (w - 0.6) / 2, 0.2, (w - 0.6) / 2, h - 0.4, { rx: 0.15 }),
    ),
  },
  stove: {
    label: "Stove", category: "Kitchen", defaultW: 2.5, defaultH: 2,
    render: (w, h) => g(
      rect(0, 0, w, h),
      ...[[0.25, 0.25], [w - 0.85, 0.25], [0.25, h - 0.85], [w - 0.85, h - 0.85]].map(([x, y]) =>
        circle(x + 0.3, y + 0.3, 0.3),
      ),
    ),
  },
  fridge: {
    label: "Fridge", category: "Kitchen", defaultW: 2.5, defaultH: 2.5,
    render: (w, h) => g(rect(0, 0, w, h), line(0, h * 0.4, w, h * 0.4), circle(w - 0.3, h * 0.2, 0.05, { fill: "hsl(var(--prop-stroke))" })),
  },
  microwave: {
    label: "Microwave", category: "Kitchen", defaultW: 2, defaultH: 1.4,
    render: (w, h) => g(rect(0, 0, w, h), rect(0.15, 0.15, w * 0.6, h - 0.3)),
  },
  dishwasher: {
    label: "Dishwasher", category: "Kitchen", defaultW: 2, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), line(0.2, h * 0.3, w - 0.2, h * 0.3)),
  },

  // ----- Bathroom -----
  toilet: {
    label: "Toilet", category: "Bathroom", defaultW: 1.6, defaultH: 2.4,
    render: (w, h) => g(
      rect(0, 0, w, h * 0.35, { rx: 0.1 }),
      path(`M ${w * 0.1} ${h * 0.4} Q ${w / 2} ${h * 1.05} ${w * 0.9} ${h * 0.4} Z`),
    ),
  },
  bathtub: {
    label: "Bathtub", category: "Bathroom", defaultW: 5, defaultH: 2.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.3 }), rect(0.3, 0.3, w - 0.6, h - 0.6, { rx: 0.2 })),
  },
  shower: {
    label: "Shower", category: "Bathroom", defaultW: 3, defaultH: 3,
    render: (w, h) => g(
      rect(0, 0, w, h),
      line(0, 0, w, h), line(w, 0, 0, h),
      circle(w / 2, h / 2, 0.18, { fill: "hsl(var(--prop-stroke))" }),
    ),
  },
  basin: {
    label: "Wash Basin", category: "Bathroom", defaultW: 2, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.15 }), circle(w / 2, h / 2, 0.1, { fill: "hsl(var(--prop-stroke))" })),
  },
  washing_machine: {
    label: "Washing Machine", category: "Utility", defaultW: 2.2, defaultH: 2.2,
    render: (w, h) => g(rect(0, 0, w, h), circle(w / 2, h / 2 + 0.1, Math.min(w, h) / 2 - 0.3)),
  },
  dryer: {
    label: "Dryer", category: "Utility", defaultW: 2.2, defaultH: 2.2,
    render: (w, h) => g(rect(0, 0, w, h), circle(w / 2, h / 2 + 0.1, Math.min(w, h) / 2 - 0.3), line(0.2, 0.3, w - 0.2, 0.3)),
  },

  // ----- Office -----
  desk: {
    label: "Desk", category: "Office", defaultW: 4.5, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), rect(w - 1.2, 0.2, 1, h - 0.4)),
  },
  desk_l: {
    label: "L-Desk", category: "Office", defaultW: 5, defaultH: 5,
    render: (w, h) => g(
      path(`M 0 0 H ${w} V ${h * 0.4} H ${w * 0.4} V ${h} H 0 Z`),
    ),
  },
  office_chair: {
    label: "Office Chair", category: "Office", defaultW: 1.8, defaultH: 1.8,
    render: (w, h) => g(circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.1), path(`M ${w * 0.1} ${h * 0.15} A ${w * 0.4} ${h * 0.4} 0 0 1 ${w * 0.9} ${h * 0.15}`, { fill: "none" })),
  },
  conference_table: {
    label: "Conference Table", category: "Office", defaultW: 8, defaultH: 3.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.4 })),
  },
  filing_cabinet: {
    label: "Filing Cabinet", category: "Office", defaultW: 1.5, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), line(0, h / 2, w, h / 2), line(0, h * 0.85, w, h * 0.85)),
  },
  reception_desk: {
    label: "Reception Desk", category: "Office", defaultW: 6, defaultH: 2.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.2 }), rect(0.3, 0.3, w - 0.6, h - 1)),
  },

  // ----- Stairs / Vertical -----
  stairs: {
    label: "Stairs (UP)", category: "Architecture", defaultW: 4, defaultH: 10,
    render: (w, h) => {
      const steps = 12;
      const elems: React.ReactNode[] = [rect(0, 0, w, h)];
      for (let i = 1; i < steps; i++) elems.push(line(0, (h * i) / steps, w, (h * i) / steps));
      elems.push(path(`M ${w / 2} ${h - 0.5} L ${w / 2} 0.5 M ${w / 2 - 0.5} 1 L ${w / 2} 0.5 L ${w / 2 + 0.5} 1`, { fill: "none" }));
      elems.push(text(w / 2, h * 0.05, "UP", 0.6));
      return g(...elems);
    },
  },
  stairs_down: {
    label: "Stairs (DN)", category: "Architecture", defaultW: 4, defaultH: 10,
    render: (w, h) => {
      const steps = 12;
      const elems: React.ReactNode[] = [rect(0, 0, w, h)];
      for (let i = 1; i < steps; i++) elems.push(line(0, (h * i) / steps, w, (h * i) / steps));
      elems.push(text(w / 2, h * 0.95, "DN", 0.6));
      return g(...elems);
    },
  },

  // ----- Outdoor / Vehicles -----
  car: {
    label: "Car", category: "Outdoor", defaultW: 6.5, defaultH: 15,
    render: (w, h) => g(
      rect(0, 0, w, h, { rx: 1 }),
      rect(w * 0.15, h * 0.25, w * 0.7, h * 0.35, { rx: 0.3 }),
      circle(w * 0.5, h * 0.12, 0.4, { fill: "hsl(var(--prop-stroke))" }),
    ),
  },
  bike: {
    label: "Bike", category: "Outdoor", defaultW: 2, defaultH: 5.5,
    render: (w, h) => g(circle(w / 2, h * 0.15, 0.6), circle(w / 2, h * 0.85, 0.6), line(w / 2, h * 0.15, w / 2, h * 0.85)),
  },
  scooter: {
    label: "Scooter", category: "Outdoor", defaultW: 2, defaultH: 5,
    render: (w, h) => g(circle(w / 2, h * 0.18, 0.5), circle(w / 2, h * 0.82, 0.5), rect(w / 2 - 0.4, h * 0.3, 0.8, h * 0.5, { rx: 0.2 })),
  },
  plant_lg: {
    label: "Plant (Large)", category: "Outdoor", defaultW: 2.5, defaultH: 2.5,
    render: (w, h) => g(circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.05), circle(w / 2, h / 2, Math.min(w, h) / 4)),
  },
  plant_sm: {
    label: "Plant (Small)", category: "Outdoor", defaultW: 1.4, defaultH: 1.4,
    render: (w, h) => g(circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.05)),
  },
  tree: {
    label: "Tree", category: "Outdoor", defaultW: 4, defaultH: 4,
    render: (w, h) => g(
      circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.05),
      ...Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const r = Math.min(w, h) / 2 - 0.1;
        return line(w / 2, h / 2, w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r);
      }),
    ),
  },
  bench: {
    label: "Bench", category: "Outdoor", defaultW: 5, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h, { rx: 0.1 })),
  },
  pergola: {
    label: "Pergola", category: "Outdoor", defaultW: 12, defaultH: 10,
    render: (w, h) => {
      const slats: React.ReactNode[] = [rect(0, 0, w, h, { fill: "none", strokeDasharray: "0.3 0.2" })];
      for (let x = 1; x < w; x += 1) slats.push(line(x, 0, x, h));
      return g(...slats);
    },
  },
  planter_box: {
    label: "Planter Box", category: "Outdoor", defaultW: 4, defaultH: 1.2,
    render: (w, h) => g(rect(0, 0, w, h), ...Array.from({ length: 4 }).map((_, i) => circle((i + 0.5) * (w / 4), h / 2, 0.25))),
  },
  garden_bed: {
    label: "Garden Bed", category: "Outdoor", defaultW: 8, defaultH: 4,
    render: (w, h) => g(
      rect(0, 0, w, h, { strokeDasharray: "0.3 0.2", fill: "hsl(var(--room-fill-alt))" }),
      ...Array.from({ length: 6 }).map(() => circle(Math.random() * w, Math.random() * h, 0.3)),
    ),
  },
  gate: {
    label: "Gate", category: "Architecture", defaultW: 12, defaultH: 0.4,
    render: (w, h) => g(rect(0, 0, w, h, { strokeDasharray: "0.4 0.2" })),
  },

  // ----- Misc -----
  pooja_unit: {
    label: "Pooja Unit", category: "Bedroom", defaultW: 3, defaultH: 1.8,
    render: (w, h) => g(
      rect(0, 0, w, h),
      path(`M ${w * 0.2} ${h * 0.1} L ${w / 2} ${-h * 0.4} L ${w * 0.8} ${h * 0.1} Z`, { fill: "none" }),
    ),
  },
  shoe_rack: {
    label: "Shoe Rack", category: "Bedroom", defaultW: 3, defaultH: 1,
    render: (w, h) => g(rect(0, 0, w, h), line(0, h / 2, w, h / 2)),
  },
  fan: {
    label: "Ceiling Fan", category: "Misc", defaultW: 4, defaultH: 4,
    render: (w, h) => g(
      circle(w / 2, h / 2, 0.3, { fill: "hsl(var(--prop-stroke))" }),
      ...[0, 1, 2].map((i) => {
        const a = (i * 2 * Math.PI) / 3;
        return path(
          `M ${w / 2} ${h / 2} L ${w / 2 + Math.cos(a) * (w / 2 - 0.2)} ${h / 2 + Math.sin(a) * (h / 2 - 0.2)}`,
          { fill: "none", strokeWidth: 0.2 },
        );
      }),
    ),
  },
  rug: {
    label: "Rug", category: "Misc", defaultW: 6, defaultH: 4,
    render: (w, h) => g(rect(0, 0, w, h, { strokeDasharray: "0.3 0.2", fill: "hsl(var(--room-fill-alt))" })),
  },
  swing: {
    label: "Swing", category: "Outdoor", defaultW: 5, defaultH: 2.5,
    render: (w, h) => g(rect(0, 0.3, w, 0.4), rect(w * 0.1, h - 0.5, w * 0.8, 0.4)),
  },
  jacuzzi: {
    label: "Jacuzzi", category: "Outdoor", defaultW: 5, defaultH: 5,
    render: (w, h) => g(
      circle(w / 2, h / 2, Math.min(w, h) / 2 - 0.1),
      ...[0.3, 0.5, 0.7].map((r) => circle(w / 2, h / 2, (Math.min(w, h) / 2) * r, { fill: "none" })),
    ),
  },
  fireplace: {
    label: "Fireplace", category: "Living", defaultW: 4, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h), rect(w * 0.15, h * 0.2, w * 0.7, h * 0.6, { fill: "hsl(var(--prop-stroke))" })),
  },
  piano: {
    label: "Piano", category: "Living", defaultW: 5, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), rect(0, h * 0.6, w, h * 0.4, { fill: "hsl(var(--prop-stroke))" })),
  },
  dressing_table: {
    label: "Dressing Table", category: "Bedroom", defaultW: 4, defaultH: 1.5,
    render: (w, h) => g(rect(0, 0, w, h), rect(w * 0.3, -1.8, w * 0.4, 1.8, { fill: "none", strokeDasharray: "0.2 0.15" })),
  },
  study_table: {
    label: "Study Table", category: "Office", defaultW: 4, defaultH: 2,
    render: (w, h) => g(rect(0, 0, w, h), line(0, h - 0.05, w, h - 0.05)),
  },
};

export const PROP_CATEGORIES = Array.from(
  new Set(Object.values(PROP_CATALOG).map((c) => c.category)),
);
