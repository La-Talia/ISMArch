import type { PlanData } from "./types";

export const ARCHRAX_EXT = ".archrax";

export interface ArchraxFile {
  format: "archrax";
  version: 1;
  exportedAt: string;
  plan: PlanData;
}

export function exportProject(plan: PlanData) {
  const file: ArchraxFile = {
    format: "archrax",
    version: 1,
    exportedAt: new Date().toISOString(),
    plan,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (plan.projectName || "project").replace(/[^a-z0-9-_]+/gi, "_");
  a.download = `${safeName}${ARCHRAX_EXT}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickArchraxFile(): Promise<PlanData | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `${ARCHRAX_EXT},application/json`;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      try {
        const text = await f.text();
        const parsed = JSON.parse(text);
        // Accept either wrapped ArchraxFile or a raw PlanData
        const plan: PlanData | undefined = parsed?.format === "archrax" ? parsed.plan : parsed;
        if (plan && plan.version === 2 && Array.isArray(plan.floors)) {
          resolve(plan);
        } else {
          alert("This file isn't a valid .archrax project.");
          resolve(null);
        }
      } catch {
        alert("Could not read this file.");
        resolve(null);
      }
    };
    input.click();
  });
}
