import { Check } from "lucide-react";
import { PageShell } from "../PageShell";

export function BuildPipeline() {
  const steps = ["Install dependencies", "Compile modules", "Optimize assets", "Deploy preview"];
  return (
    <PageShell title="Build pipeline">
      <ul className="space-y-2 px-4 py-3">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 text-[12.5px]"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
              {i + 1}
            </span>
            {s}
            {i < 3 && <Check className="ml-auto h-3.5 w-3.5 text-spectral-1" strokeWidth={2.5} />}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

export default BuildPipeline;
