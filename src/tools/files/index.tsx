import { useState } from "react";
import { FileCode2, FileJson, FileText, Folder, FolderPlus, FilePlus, Pencil, Trash2, Search } from "lucide-react";
import { PageShell } from "@/components/Build/PageShell";
import { projectFiles, useProjectFiles } from "../project-files";

function iconFor(path: string) {
  if (/\.(tsx?|jsx?|css|html)$/.test(path)) return FileCode2;
  if (path.endsWith(".json")) return FileJson;
  return FileText;
}

export function FilesTool() {
  const { nodes, activePath } = useProjectFiles();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visible = nodes.filter((n) => {
    if (query) return n.path.toLowerCase().includes(query.toLowerCase());
    return ![...collapsed].some((c) => n.path.startsWith(c + "/"));
  });

  const toggle = (p: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  const create = (folder: boolean) => {
    const name = window.prompt(folder ? "New folder path" : "New file path", "src/");
    if (name && !projectFiles.create(name, folder)) window.alert("That path already exists or is invalid.");
  };

  const rename = (path: string) => {
    const to = window.prompt("Rename or move to", path);
    if (to && to !== path && !projectFiles.move(path, to)) window.alert("That path already exists or is invalid.");
  };

  return (
    <PageShell title="Files · Project">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <label className="flex h-8 flex-1 items-center gap-2 rounded-full border border-border bg-surface px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files"
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button aria-label="New file" onClick={() => create(false)} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground">
          <FilePlus className="h-3.5 w-3.5" />
        </button>
        <button aria-label="New folder" onClick={() => create(true)} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground">
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">No files found</p>
      ) : (
        <ul className="px-2 py-2">
          {visible.map((n) => {
            const depth = query ? 0 : n.path.split("/").length - 1;
            const name = query ? n.path : n.path.split("/").pop();
            const Icon = n.folder ? Folder : iconFor(n.path);
            return (
              <li key={n.path} className={`group flex items-center rounded-lg ${activePath === n.path ? "bg-surface-2" : "hover:bg-surface"}`}>
                <button
                  onClick={() => (n.folder ? toggle(n.path) : projectFiles.open(n.path))}
                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left text-[12.5px]"
                  style={{ paddingLeft: `${8 + depth * 16}px` }}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${n.folder ? "text-spectral-1" : "text-muted-foreground"}`} strokeWidth={1.8} />
                  <span className="truncate">{name}</span>
                </button>
                <button aria-label={`Rename ${name}`} onClick={() => rename(n.path)} className="hidden h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-foreground group-hover:grid">
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  aria-label={`Delete ${name}`}
                  onClick={() => window.confirm(`Delete ${n.path}?`) && projectFiles.remove(n.path)}
                  className="mr-1 hidden h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-destructive group-hover:grid"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}

export default FilesTool;
