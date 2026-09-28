import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from "react";
import {
  Menu,
  X,
  Minus,
  Maximize2,
  Plus,
  Check,
  Pencil,
  ChevronDown,
  FolderKanban,
  ImageIcon,
  Video,
  AudioLines,
  UserSquare,
  LibraryBig,
  Plug,
  Workflow,
  Clapperboard,
  Hammer,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppIcon } from "@/components/Navigation/AppIcon";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MOCK_PROJECTS,
  PAGE_META,
  type PageType,
  type Project,
  type WorkspacePage,
} from "./build-data";
import { BuildPageContent } from "./BuildPageContent";
import { BuildSettings } from "./Settings";

const SWIPE_Y = 70;

let pageSeq = 0;
const makePage = (type: PageType): WorkspacePage => ({ id: `${type}-${++pageSeq}`, type });
const INITIAL_PAGES: WorkspacePage[] = [
  { id: "preview", type: "preview" },
  { id: "chat", type: "chat" },
  { id: "tools", type: "tools" },
];

export function BuildWorkspace() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0]!.id);
  const project = projects.find((p) => p.id === projectId) ?? projects[0]!;

  const [pages, setPages] = useState<WorkspacePage[]>(INITIAL_PAGES);
  const [activeId, setActiveId] = useState("chat");
  const activeIndex = Math.max(
    0,
    pages.findIndex((p) => p.id === activeId),
  );
  const active = pages[activeIndex]!;

  const [minimized, setMinimized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const cardTouch = useRef<{ id: string; x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const windowsRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const userScrollingMain = useRef(false);
  const userScrollingTabs = useRef(false);
  const userScrollingWindows = useRef(false);
  const [mainSize, setMainSize] = useState({ width: 360, height: 480 });

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setMainSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const carousel = carouselRef.current;
    const behavior = initialized.current ? "smooth" : "instant";
    if (carousel && !minimized) {
      carousel.scrollTo({ left: activeIndex * carousel.clientWidth, behavior });
    }
    const rail = tabsRef.current;
    const tab = Array.from(rail?.children ?? []).find(
      (child) => child.getAttribute("data-page-id") === activeId,
    );
    if (rail && tab instanceof HTMLElement) {
      const left =
        tab.getBoundingClientRect().left -
        rail.getBoundingClientRect().left +
        rail.scrollLeft -
        (rail.clientWidth - tab.clientWidth) / 2;
      rail.scrollTo({
        left: Math.max(0, Math.min(left, rail.scrollWidth - rail.clientWidth)),
        behavior,
      });
    }
    initialized.current = true;
  }, [activeId, activeIndex, minimized, pages]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const carousel = carouselRef.current;
      if (
        carousel &&
        !userScrollingMain.current &&
        !minimized &&
        Math.abs(carousel.scrollLeft - activeIndex * carousel.clientWidth) > 1
      ) {
        carousel.scrollTo({ left: activeIndex * carousel.clientWidth, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [minimized, pages]);

  const syncFromCarousel = () => {
    const carousel = carouselRef.current;
    if (!carousel || !carousel.clientWidth) return;
    if (!userScrollingMain.current) {
      if (Math.round(carousel.scrollLeft / carousel.clientWidth) !== activeIndex) {
        carousel.scrollTo({ left: activeIndex * carousel.clientWidth, behavior: "instant" });
      }
      return;
    }
    userScrollingMain.current = false;
    const index = Math.min(
      pages.length - 1,
      Math.max(0, Math.round(carousel.scrollLeft / carousel.clientWidth)),
    );
    if (pages[index]?.id !== activeId) setActiveId(pages[index].id);
    else carousel.scrollTo({ left: index * carousel.clientWidth, behavior: "smooth" });
  };

  const syncFromTabs = () => {
    const rail = tabsRef.current;
    if (!rail) return;
    if (!userScrollingTabs.current) {
      const selected = Array.from(rail.children).find(
        (child) => child.getAttribute("data-page-id") === activeId,
      );
      if (selected instanceof HTMLElement) {
        const left =
          selected.getBoundingClientRect().left -
          rail.getBoundingClientRect().left +
          rail.scrollLeft -
          (rail.clientWidth - selected.clientWidth) / 2;
        const target = Math.max(0, Math.min(left, rail.scrollWidth - rail.clientWidth));
        if (Math.abs(rail.scrollLeft - target) > 1)
          rail.scrollTo({ left: target, behavior: "instant" });
      }
      return;
    }
    userScrollingTabs.current = false;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    const tabs = Array.from(rail.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && !!child.dataset.pageId,
    );
    const nearest = tabs.reduce<HTMLElement | null>(
      (best, tab) =>
        !best ||
        Math.abs(
          tab.getBoundingClientRect().left -
            rail.getBoundingClientRect().left +
            rail.scrollLeft +
            tab.clientWidth / 2 -
            center,
        ) <
          Math.abs(
            best.getBoundingClientRect().left -
              rail.getBoundingClientRect().left +
              rail.scrollLeft +
              best.clientWidth / 2 -
              center,
          )
          ? tab
          : best,
      null,
    );
    if (nearest?.dataset.pageId && nearest.dataset.pageId !== activeId)
      setActiveId(nearest.dataset.pageId);
  };

  const miniScale = Math.min(0.72, 360 / Math.max(mainSize.width, 1));
  const miniWidth = Math.round(mainSize.width * miniScale);
  const miniHeight = Math.round(mainSize.height * miniScale);
  const miniEdge = Math.max(0, (mainSize.width - miniWidth) / 2 - 12);

  const centerMiniWindow = (behavior: ScrollBehavior) => {
    const rail = windowsRef.current;
    const card = Array.from(rail?.children ?? []).find(
      (child) => child.getAttribute("data-window-id") === activeId,
    );
    if (!rail || !(card instanceof HTMLElement)) return;
    const left =
      card.getBoundingClientRect().left -
      rail.getBoundingClientRect().left +
      rail.scrollLeft -
      (rail.clientWidth - card.clientWidth) / 2;
    rail.scrollTo({ left, behavior });
  };

  useLayoutEffect(() => {
    if (minimized && !userScrollingWindows.current) centerMiniWindow("instant");
  }, [minimized, activeId, pages, miniWidth]);

  const syncFromMiniWindows = () => {
    if (!userScrollingWindows.current) return;
    userScrollingWindows.current = false;
    const rail = windowsRef.current;
    if (!rail) return;
    const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-window-id]"));
    const nearest = cards.reduce<HTMLElement | null>(
      (best, card) =>
        !best ||
        Math.abs(card.getBoundingClientRect().left + card.clientWidth / 2 - center) <
          Math.abs(best.getBoundingClientRect().left + best.clientWidth / 2 - center)
          ? card
          : best,
      null,
    );
    if (nearest?.dataset.windowId && nearest.dataset.windowId !== activeId)
      setActiveId(nearest.dataset.windowId);
    else centerMiniWindow("smooth");
  };

  const closePage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page || PAGE_META[page.type].permanent) return;
    const idx = pages.findIndex((p) => p.id === id);
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    if (id === activeId) setActiveId(next[Math.min(idx, next.length - 1)]!.id);
  };

  const openTool = (type: PageType) => {
    const existing = pages.find((p) => p.type === type);
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const page = makePage(type);
    setPages((current) => {
      const toolsIndex = current.findIndex((p) => p.type === "tools");
      return toolsIndex < 0
        ? [...current, page]
        : [...current.slice(0, toolsIndex), page, ...current.slice(toolsIndex)];
    });
    setActiveId(page.id);
  };

  /* ------------------------------- Gestures ------------------------------- */
  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    touchStart.current = null;
    if (minimized || settingsOpen) return;
    if (e.touches.length !== 1) return;
    const target = e.target;
    if (
      target instanceof Element &&
      target.closest(
        "textarea, input, select, [role='slider'], [contenteditable='true'], audio, video, [data-no-swipe]",
      )
    )
      return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
    if (minimized || settingsOpen) return;
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (dy < -SWIPE_Y && Math.abs(dy) > Math.abs(dx) * 1.4) {
      // Swipe up: close dynamic pages only.
      if (!PAGE_META[active.type].permanent) closePage(active.id);
    }
  };

  /* --------------------------------- Sheets -------------------------------- */
  const drawer = menuOpen ? (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setMenuOpen(false)}
      />
      <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-background px-3 py-4 shadow-2xl">
        <div className="flex items-center justify-between px-2 pb-3">
          <span className="text-[15px] font-extrabold tracking-[-0.02em]">Hyper Copilot</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto pt-2">
          <Link
            to="/copilot"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <AppIcon className="h-[18px] w-[18px] rounded-[5px]" />
            Copilot
          </Link>
          <p className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            Generate
          </p>
          {[
            { label: "Build", icon: Hammer, to: "/build" },
            { label: "Image", icon: ImageIcon, to: "/image" },
            { label: "Virtual Model", icon: UserSquare, to: "/virtual-model" },
            { label: "Video", icon: Video, to: "/video" },
            { label: "Video Agent", icon: Clapperboard, to: "/video-agent" },
            { label: "Audio", icon: AudioLines, to: "/audio" },
          ].map((i) => (
            <Link
              key={i.label}
              to={i.to}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <i.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {i.label}
            </Link>
          ))}
          <p className="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            My Work
          </p>
          {[
            { label: "Library", icon: LibraryBig, to: "/library" },
            { label: "Integrations", icon: Plug, to: "/integrations" },
            { label: "Workflows", icon: Workflow, to: "/workflows" },
          ].map((i) => (
            <Link
              key={i.label}
              to={i.to}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              <i.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-screen max-h-screen w-full flex-col overflow-hidden bg-background">
      <Sidebar />
      <div className="flex h-full min-h-0 flex-1 flex-col lg:pl-[248px]">
        {/* Workspace header — always visible, even minimized */}
        <header className="relative z-30 flex shrink-0 items-center gap-2 bg-background/70 px-3 py-2 backdrop-blur-xl">
          {settingsOpen ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Back to workspace"
                onClick={() => setSettingsOpen(false)}
                className="h-9 w-9 rounded-full text-foreground"
              >
                <ArrowLeft strokeWidth={1.8} />
              </Button>
              <h1 className="text-[14px] font-semibold">Workspace Settings</h1>
            </>
          ) : (
            <>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 lg:hidden"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
          <span className="hidden w-9 lg:block" />

          {/* Centered project name */}
          <div className="absolute left-1/2 -translate-x-1/2">
            {editingName ? (
              <form
                className="flex items-center gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = nameDraft.trim();
                  if (name)
                    setProjects((ps) => ps.map((p) => (p.id === project.id ? { ...p, name } : p)));
                  setEditingName(false);
                }}
              >
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditingName(false)}
                  className="w-40 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-center text-[13px] font-bold outline-none focus:border-border-strong"
                />
                <button
                  type="submit"
                  aria-label="Save name"
                  className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setEditingName(false)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </form>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNameMenuOpen((v) => !v)}
                  className="flex max-w-[46vw] items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors hover:bg-surface"
                >
                  <span className="truncate">{project.name}</span>
                  <ChevronDown
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    strokeWidth={2.2}
                  />
                </button>
                {nameMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setNameMenuOpen(false)}
                    />
                    <div className="absolute left-1/2 top-full z-20 mt-1 w-44 -translate-x-1/2 rounded-xl border border-border bg-background p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setNameMenuOpen(false);
                          setNameDraft(project.name);
                          setEditingName(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        Edit Project Name
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label={minimized ? "Restore workspace" : "Minimize workspace"}
              title={minimized ? "Restore" : "Minimize"}
              onClick={() => setMinimized((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {minimized ? (
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Minus className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
            </>
          )}
        </header>

        {/* Central workspace content */}
        <main
          ref={mainRef}
          className="relative flex-1 min-h-0 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {settingsOpen ? (
            <BuildSettings />
          ) : minimized ? (
            <div
              ref={windowsRef}
              data-testid="minimized-windows"
              onScrollEnd={syncFromMiniWindows}
              onTouchStartCapture={() => {
                userScrollingWindows.current = true;
              }}
              onWheelCapture={() => {
                userScrollingWindows.current = true;
              }}
              className="flex h-full items-center gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div aria-hidden="true" className="h-px shrink-0" style={{ width: miniEdge }} />
              {pages.map((p) => (
                <div
                  key={p.id}
                  data-window-id={p.id}
                  className="shrink-0 snap-center"
                  style={{ width: miniWidth }}
                >
                  <div
                    className="relative overflow-hidden rounded-md border border-border bg-background shadow-sm"
                    style={{ width: miniWidth, height: miniHeight }}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1)
                        cardTouch.current = {
                          id: p.id,
                          x: e.touches[0].clientX,
                          y: e.touches[0].clientY,
                        };
                    }}
                    onTouchEnd={(e) => {
                      const start = cardTouch.current;
                      cardTouch.current = null;
                      if (!start || start.id !== p.id || e.changedTouches.length !== 1) return;
                      const dx = e.changedTouches[0].clientX - start.x;
                      const dy = e.changedTouches[0].clientY - start.y;
                      if (
                        dy < -SWIPE_Y &&
                        Math.abs(dy) > Math.abs(dx) * 1.4 &&
                        !PAGE_META[p.type].permanent
                      ) {
                        e.preventDefault();
                        closePage(p.id);
                      }
                    }}
                  >
                    <div
                      inert
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{
                        width: mainSize.width,
                        height: mainSize.height,
                        transform: `scale(${miniScale})`,
                      }}
                    >
                      <BuildPageContent type={p.type} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Restore ${PAGE_META[p.type].label}`}
                      onClick={() => {
                        setActiveId(p.id);
                        setMinimized(false);
                      }}
                      className="absolute inset-0 h-full w-full rounded-none bg-transparent hover:bg-transparent"
                    />
                  </div>
                  <p className="mt-2 truncate text-center text-[12px] font-medium text-muted-foreground">
                    {PAGE_META[p.type].label}
                  </p>
                </div>
              ))}
              <div aria-hidden="true" className="h-px shrink-0" style={{ width: miniEdge }} />
            </div>
          ) : (
            <div
              ref={(node) => {
                carouselRef.current = node;
                if (node && !initialized.current) node.scrollLeft = activeIndex * node.clientWidth;
              }}
              onScrollEnd={syncFromCarousel}
              onTouchStartCapture={() => {
                userScrollingMain.current = true;
              }}
              onWheelCapture={() => {
                userScrollingMain.current = true;
              }}
              className="flex h-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {pages.map((p) => (
                <div
                  key={p.id}
                  data-window-id={p.id}
                  className="h-full w-full min-w-full shrink-0 snap-center overflow-hidden"
                >
                  <BuildPageContent type={p.type} onOpenTool={openTool} />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Bottom navigation — always visible */}
        {!settingsOpen && <nav className="grid shrink-0 grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 bg-background/80 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Select project"
            onClick={() => setProjectsOpen(true)}
            className="h-10 w-10 shrink-0 rounded-full bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <FolderKanban className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </Button>

           <div data-no-swipe className="mx-auto w-[136px] max-w-full min-w-0">
            <div
              ref={tabsRef}
              onScrollEnd={syncFromTabs}
              onTouchStartCapture={() => {
                userScrollingTabs.current = true;
              }}
              onWheelCapture={() => {
                userScrollingTabs.current = true;
              }}
              className="flex w-full items-center gap-2 overflow-x-auto overscroll-x-contain snap-x snap-mandatory px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {pages.map((p) => {
                const Meta = PAGE_META[p.type];
                const isActive = p.id === activeId;
                return (
                  <Button
                    variant="ghost"
                    size="icon"
                    key={p.id}
                    data-page-id={p.id}
                    type="button"
                    aria-label={p.type === "tools" ? "Add Tools" : Meta.label}
                    title={p.type === "tools" ? "Add Tools" : Meta.label}
                    onClick={() => {
                      userScrollingTabs.current = false;
                      userScrollingMain.current = false;
                      setActiveId(p.id);
                    }}
                    className={cn(
                      "h-10 w-10 shrink-0 snap-center rounded-full border border-border bg-surface transition-colors",
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                    )}
                  >
                    {p.type === "tools" ? <Plus className="h-4 w-4" strokeWidth={2} /> : <Meta.icon className="h-4 w-4" strokeWidth={1.9} />}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            type="button"
            aria-label="Workspace Settings"
            title="Workspace Settings"
            onClick={() => setSettingsOpen(true)}
            className="h-10 w-10 shrink-0 rounded-full bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </Button>
        </nav>}
      </div>

      {/* Project selector */}
      {projectsOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close projects"
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setProjectsOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-border-strong" />
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[13px] font-bold">Projects</p>
              <button
                type="button"
                onClick={() =>
                  toast("New project", {
                    description: "Project creation arrives with the builder backend.",
                  })
                }
                className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3 w-3" strokeWidth={2.5} />
                New
              </button>
            </div>
            <ul className="space-y-1.5">
              {projects.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId(p.id);
                      setProjectsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      p.id === project.id
                        ? "border-foreground bg-surface"
                        : "border-border hover:bg-surface",
                    )}
                  >
                    <FolderKanban
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      strokeWidth={1.8}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                      <span className="block text-[10.5px] text-muted-foreground">
                        {p.stack} · {p.updated}
                      </span>
                    </span>
                    {p.id === project.id && (
                      <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {drawer}
    </div>
  );
}

export default BuildWorkspace;
