import { PageShell } from "../PageShell";

export function BuildTools() {
  const tools = [
    ["web-search", "Search the web for references"],
    ["image-gen", "Generate assets on demand"],
    ["db-migrate", "Run database migrations"],
  ];
  return (
    <PageShell title="Tools / MCP servers">
      <ul className="space-y-2 px-4 py-3">
        {tools.map(([name, desc]) => (
          <li key={name} className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="font-mono text-[12px] font-semibold">{name}</p>
            <p className="pt-0.5 text-[11px] text-muted-foreground">{desc}</p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

export default BuildTools;
