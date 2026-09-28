import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PAGE_META, type PageType } from "./build-data";

type Entry = {
  key: "git" | "code" | "files" | "cloud" | "skills";
  title: string;
  description: string;
  icon: keyof typeof PAGE_META;
  openType: PageType;
};

const ENTRIES: Entry[] = [
  { key: "git", title: "Git", description: "Branches, commits and pull requests", icon: "git", openType: "git" },
  { key: "code", title: "Code", description: "Browse and edit project source", icon: "code", openType: "code" },
  { key: "files", title: "Files", description: "Manage files in the workspace", icon: "files", openType: "files" },
  { key: "cloud", title: "Cloud", description: "Databases, storage and auth", icon: "supabase", openType: "supabase" },
  { key: "skills", title: "Skills", description: "Reusable capabilities and tools", icon: "skills", openType: "skills" },
];

const CLOUD_PROVIDERS = [
  { key: "supabase" as const, title: "Supabase", description: "Postgres, Auth, Storage", openType: "supabase" as PageType },
  { key: "firebase" as const, title: "Firebase", description: "Firestore, Auth, Hosting", openType: "firebase" as PageType },
];

function ToolCard({
  title,
  description,
  Icon,
  trailing,
  onClick,
}: {
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-semibold leading-tight text-foreground">{title}</span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground">{description}</span>
      </span>
      {trailing}
    </button>
  );
}

export function ToolsWindow({ onOpen }: { onOpen?: (type: PageType) => void }) {
  const [cloudOpen, setCloudOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="shrink-0 border-b border-border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
        Tools
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-2">
          {ENTRIES.map((entry) => {
            const Icon = PAGE_META[entry.icon].icon;
            const isCloud = entry.key === "cloud";
            return (
              <li key={entry.key} className="flex flex-col gap-2">
                <ToolCard
                  title={entry.title}
                  description={entry.description}
                  Icon={Icon}
                  onClick={() => (isCloud ? setCloudOpen((v) => !v) : onOpen?.(entry.openType))}
                  trailing={
                    isCloud ? (
                      cloudOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )
                    ) : null
                  }
                />
                {isCloud && cloudOpen && (
                  <ul className="flex flex-col gap-2 pl-3">
                    {CLOUD_PROVIDERS.map((provider) => {
                      const ProviderIcon = PAGE_META[provider.key].icon;
                      return (
                        <li key={provider.key}>
                          <ToolCard
                            title={provider.title}
                            description={provider.description}
                            Icon={ProviderIcon}
                            onClick={() => onOpen?.(provider.openType)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
