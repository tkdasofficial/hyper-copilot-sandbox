import { PageShell } from "../PageShell";

export function BuildSettings() {
  const rows = [
    ["Project name", "Aurora Storefront"],
    ["Framework", "React + Vite"],
    ["Package manager", "bun"],
    ["Node version", "22 LTS"],
    ["Auto-save", "Enabled"],
  ];
  return (
    <PageShell title="Project settings">
      <ul className="px-4 py-3">
        {rows.map(([k, v]) => (
          <li
            key={k}
            className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
          >
            <span className="text-[12.5px] text-muted-foreground">{k}</span>
            <span className="text-[12.5px] font-medium">{v}</span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

export default BuildSettings;
