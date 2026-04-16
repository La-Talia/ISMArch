import React from "react";
import { PROP_CATALOG, PROP_CATEGORIES } from "./propCatalog";
import { PX_PER_FT } from "./types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  onAdd: (type: string, defaults: { w: number; h: number }) => void;
}

export const PropLibrary: React.FC<Props> = ({ onAdd }) => {
  const [q, setQ] = React.useState("");
  const filtered = Object.entries(PROP_CATALOG).filter(([, e]) =>
    e.label.toLowerCase().includes(q.toLowerCase()) || e.category.toLowerCase().includes(q.toLowerCase()),
  );
  const grouped = PROP_CATEGORIES.map((cat) => ({
    cat,
    items: filtered.filter(([, e]) => e.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <Input placeholder="Search furniture…" value={q} onChange={(e) => setQ(e.target.value)} />
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</div>
              <div className="grid grid-cols-2 gap-2">
                {items.map(([key, e]) => {
                  const previewSize = 60;
                  const scale = Math.min(previewSize / (e.defaultW * PX_PER_FT), previewSize / (e.defaultH * PX_PER_FT)) * PX_PER_FT;
                  return (
                    <button
                      key={key}
                      onClick={() => onAdd(key, { w: e.defaultW, h: e.defaultH })}
                      className="flex flex-col items-center gap-1 rounded-md border bg-card p-2 text-xs transition-colors hover:border-primary hover:bg-accent"
                      title={`${e.label} — drag onto canvas`}
                    >
                      <svg width={previewSize} height={previewSize} viewBox={`0 0 ${previewSize} ${previewSize}`} style={{ color: "hsl(var(--prop-stroke))" }}>
                        <g transform={`translate(${(previewSize - e.defaultW * scale) / 2} ${(previewSize - e.defaultH * scale) / 2}) scale(${scale})`}>
                          {e.render(e.defaultW, e.defaultH)}
                        </g>
                      </svg>
                      <span className="line-clamp-1 text-center">{e.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
