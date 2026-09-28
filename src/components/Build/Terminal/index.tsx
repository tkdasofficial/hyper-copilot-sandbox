import { MOCK_TERMINAL } from "../build-data";
import { PageShell } from "../PageShell";

export function BuildTerminal() {
  return (
    <PageShell title="Terminal">
      <pre className="px-4 py-3 font-mono text-[11.5px] leading-relaxed text-foreground/90">
        {MOCK_TERMINAL.join("\n")}
      </pre>
    </PageShell>
  );
}

export default BuildTerminal;
