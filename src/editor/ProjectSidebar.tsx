import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, FileDown, FileUp, Pencil, Check, X } from "lucide-react";
import type { ProjectMeta } from "./projectsStore";

interface Props {
  projects: ProjectMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onExport: (id: string) => void;
  onImport: () => void;
}

export const ProjectSidebar: React.FC<Props> = ({
  projects, activeId, onSelect, onNew, onDelete, onRename, onExport, onImport,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  const startEdit = (p: ProjectMeta) => {
    setEditingId(p.id);
    setDraft(p.name);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b px-3 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          My Projects
        </div>
        <div className="mt-2 flex gap-1.5">
          <Button size="sm" className="flex-1" onClick={onNew}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
          <Button size="sm" variant="outline" onClick={onImport} title="Import .archrax file">
            <FileUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {projects.length === 0 && (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              No projects yet. Click <b>New</b> to start sketching your plot.
            </div>
          )}
          {projects.map((p) => {
            const active = p.id === activeId;
            const isEditing = editingId === p.id;
            return (
              <div
                key={p.id}
                className={`group rounded-md border px-2 py-1.5 text-sm transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { onRename(p.id, draft.trim() || p.name); setEditingId(null); }
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-xs"
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onRename(p.id, draft.trim() || p.name); setEditingId(null); }}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(p.id)}
                      className="block w-full truncate text-left font-medium"
                      title={p.name}
                    >
                      {p.name}
                    </button>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(p)} title="Rename">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onExport(p.id)} title="Export .archrax">
                          <FileDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-6 w-6 text-destructive"
                          onClick={() => { if (confirm(`Delete "${p.name}"? This cannot be undone.`)) onDelete(p.id); }}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-2 text-[10px] text-muted-foreground">
        Stored locally on this device.
      </div>
    </div>
  );
};
