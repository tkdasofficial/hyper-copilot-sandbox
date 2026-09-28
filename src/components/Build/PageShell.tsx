import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="shrink-0 border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {title}
      </p>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
