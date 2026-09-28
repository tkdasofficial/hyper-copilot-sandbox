import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/Build/PageShell";

/** Future skills register here as individual .ts modules. */
export const SKILLS: { id: string; name: string }[] = [];

export function SkillsTool() {
  return (
    <PageShell title="Skills">
      {SKILLS.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <p className="text-[12.5px] font-semibold">No skills available yet</p>
          <p className="text-[11px] text-muted-foreground">Skills are coming soon.</p>
        </div>
      )}
    </PageShell>
  );
}

export default SkillsTool;
