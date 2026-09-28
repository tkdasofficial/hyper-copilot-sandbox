import { PageShell } from "@/components/Build/PageShell";
import { projectFiles, useProjectFiles } from "../project-files";

export function CodeTool() {
  const { nodes, activePath, drafts } = useProjectFiles();
  const files = nodes.filter((n) => !n.folder);
  const file = files.find((f) => f.path === activePath);
  const draft = activePath ? drafts[activePath] : undefined;
  const value = draft ?? file?.content ?? "";
  const dirty = draft !== undefined && draft !== file?.content;

  return (
    <PageShell title="Code">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <select
            value={activePath ?? ""}
            onChange={(e) => projectFiles.open(e.target.value)}
            className="h-8 min-w-0 flex-1 truncate rounded-full border border-border bg-surface px-3 font-mono text-[11.5px] outline-none"
          >
            <option value="" disabled>Select a file</option>
            {files.map((f) => (
              <option key={f.path} value={f.path}>{f.path}</option>
            ))}
          </select>
          {dirty && <span className="text-[11px] text-muted-foreground">Unsaved</span>}
          <button
            disabled={!dirty}
            onClick={() => activePath && projectFiles.save(activePath)}
            className="h-8 rounded-full border border-border bg-surface px-3 text-[11px] font-semibold disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {file ? (
          <textarea
            value={value}
            spellCheck={false}
            onChange={(e) => projectFiles.edit(file.path, e.target.value)}
            className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[11.5px] leading-relaxed text-foreground/90 outline-none"
          />
        ) : (
          <p className="px-4 py-6 text-center text-[12px] text-muted-foreground">Open a file to view its code</p>
        )}
      </div>
    </PageShell>
  );
}

export default CodeTool;
