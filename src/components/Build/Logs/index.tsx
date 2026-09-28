import { MOCK_LOGS } from "../build-data";
import { PageShell } from "../PageShell";
import { cn } from "@/lib/utils";

export function BuildLogs() {
  return (
    <PageShell title="Logs">
      <ul className="px-4 py-3 font-mono text-[11px] leading-relaxed">
        {MOCK_LOGS.map((l, i) => (
          <li key={i} className="flex gap-2 py-0.5">
            <span className="text-muted-foreground/60">{l.time}</span>
            <span
              className={cn(
                "w-10 shrink-0 font-bold uppercase",
                l.level === "warn"
                  ? "text-spectral-1"
                  : l.level === "ok"
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {l.level}
            </span>
            <span className="text-foreground/90">{l.text}</span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

export default BuildLogs;
