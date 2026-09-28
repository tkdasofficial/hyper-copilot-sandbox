import { useState } from "react";
import { ChevronRight, Lock, Monitor, RotateCw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function BuildPreview({ compact = false }: { compact?: boolean }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  return (
    <div className="flex h-full min-h-0 flex-col">
      {!compact && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-3 py-2">
          <button
            type="button"
            aria-label="Reload preview"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="truncate">preview.aurora-storefront.app</span>
          </div>
          <div className="flex items-center rounded-full border border-border p-0.5">
            {(["mobile", "desktop"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-label={`${d} preview`}
                onClick={() => setDevice(d)}
                className={cn(
                  "grid h-6 w-7 place-items-center rounded-full transition-colors",
                  device === d ? "bg-surface-2 text-foreground" : "text-muted-foreground",
                )}
              >
                {d === "mobile" ? (
                  <Smartphone className="h-3.5 w-3.5" />
                ) : (
                  <Monitor className="h-3.5 w-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto bg-surface/50 p-3">
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all",
            device === "mobile" && !compact ? "max-w-[320px]" : "max-w-full",
          )}
        >
          {/* Mock generated site */}
          <div className="border-b border-border px-4 py-6 text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-spectral-1">
              Weekly roast club
            </p>
            <p className="pt-1.5 text-[17px] font-extrabold leading-tight tracking-tight">
              Fresh coffee, roasted weekly
            </p>
            <p className="mx-auto max-w-[240px] pt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Small-batch beans delivered to your door every Monday morning.
            </p>
            <span className="mt-3 inline-block rounded-full bg-foreground px-4 py-1.5 text-[11px] font-semibold text-background">
              Choose your roast
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 py-4">
            {["Light", "Medium", "Dark"].map((r, i) => (
              <div
                key={r}
                className={cn(
                  "rounded-lg border p-2.5 text-center",
                  i === 1 ? "border-foreground" : "border-border",
                )}
              >
                <p className="text-[11px] font-bold">{r}</p>
                <p className="pt-0.5 text-[10px] text-muted-foreground">${[14, 16, 15][i]}/mo</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border px-4 py-4">
            {[
              "Best coffee I've had at home.",
              "The Monday delivery is perfect.",
              "Switched my whole office over.",
            ].map((q) => (
              <div key={q} className="rounded-lg bg-surface px-3 py-2">
                <p className="text-[10.5px] leading-relaxed text-foreground">“{q}”</p>
                <p className="pt-0.5 text-[9px] font-semibold text-muted-foreground">
                  Verified subscriber
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3">
            {[
              "How often is coffee roasted?",
              "Can I pause my subscription?",
              "Do you ship internationally?",
            ].map((q) => (
              <div
                key={q}
                className="flex items-center justify-between py-1.5 text-[11px] font-medium"
              >
                {q}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildPreview;
