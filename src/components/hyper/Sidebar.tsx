import type { LucideIcon } from "lucide-react";
import {
  ImageIcon,
  Video,
  AudioLines,
  PenTool,
  Boxes,
  Compass,
  ChevronRight,
  UserSquare,
  LibraryBig,
  Plug,
  Workflow,
  Hammer,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { AppIcon } from "./AppIcon";
import { VideoAgentIcon } from "./VideoAgentIcon";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: LucideIcon | React.FC<{ className?: string }>;
  badge?: string;
  to?: string;
};

const primary: Item[] = [{ label: "Explore", icon: Compass }];

const generate: Item[] = [
  { label: "Build", icon: Hammer, to: "/build", badge: "New" },
  { label: "Image", icon: ImageIcon, to: "/image" },
  { label: "Virtual Model", icon: UserSquare, to: "/virtual-model", badge: "New" },
  { label: "Video", icon: Video, to: "/video", badge: "New" },
  { label: "Video Agent", icon: VideoAgentIcon, to: "/video-agent", badge: "New" },
  { label: "Audio", icon: AudioLines, to: "/audio" },
  { label: "Vector", icon: PenTool },
  { label: "3D Scene", icon: Boxes, badge: "Beta" },
];

const myWork: Item[] = [
  { label: "Library", icon: LibraryBig, to: "/library" },
  { label: "Integrations", icon: Plug, to: "/integrations" },
  { label: "Workflows", icon: Workflow, to: "/workflows" },
];

function NavItem({ item }: { item: Item }) {
  const Icon = item.icon;
  const cls = cn(
    "group flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors",
    "text-muted-foreground hover:bg-surface hover:text-foreground",
  );
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-full border border-border-strong px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {item.badge}
        </span>
      ) : null}
    </>
  );
  if (item.to) {
    return (
      <Link
        to={item.to}
        className={cls}
        activeProps={{ className: "bg-surface-2 text-foreground" }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={() =>
        toast(`${item.label} is coming soon`, { description: "This studio is still in the works." })
      }
    >
      {inner}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
      {children}
    </p>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-border bg-background/80 px-3 pb-4 pt-3 backdrop-blur-xl lg:flex">
      <div className="px-2 pb-2">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto">
        <Link
          to="/copilot"
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-surface-2 text-foreground" }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <AppIcon className="h-[18px] w-[18px] rounded-[5px]" />
          <span className="truncate">Copilot</span>
        </Link>
        <div className="space-y-0.5">
          {primary.map((i) => (
            <NavItem key={i.label} item={i} />
          ))}
        </div>
        <SectionLabel>Generate</SectionLabel>
        <div className="space-y-0.5">
          {generate.map((i) => (
            <NavItem key={i.label} item={i} />
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-1">
          <SectionLabel>My Work</SectionLabel>
          <div className="space-y-0.5">
            {myWork.map((i) => (
              <NavItem key={i.label} item={i} />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
