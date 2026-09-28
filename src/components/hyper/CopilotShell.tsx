import { useEffect, useRef, useState, type ReactNode, type TouchEvent, type WheelEvent } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CopilotHistoryPanel } from "./CopilotHistoryPanel";
import { cn } from "@/lib/utils";

type Tab = "new" | "chat";

export function CopilotShell({
  active: _active,
  chatId: _chatId,
  children,
  fullHeight = false,
}: {
  active: Tab;
  chatId?: string;
  children: ReactNode;
  fullHeight?: boolean;
}) {
  const isFull = fullHeight || _active === "chat";
  const [historyOpen, setHistoryOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelGesture = useRef({ distance: 0, lastAt: 0, lockedUntil: 0, lockedDirection: 0 });
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => setHistoryOpen(false), [pathname]);

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStart.current = null;
    if (event.touches.length !== 1) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        "textarea, input, select, [role='slider'], [contenteditable='true'], audio, video",
      )
    )
      return;
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.4 && !historyOpen) {
      setHistoryOpen(true);
    } else if (dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.4 && historyOpen) {
      setHistoryOpen(false);
    }
  };

  const onWheel = (event: WheelEvent<HTMLElement>) => {
    const { deltaX, deltaY } = event;
    if (Math.abs(deltaX) < Math.abs(deltaY) * 1.4) return;
    const gesture = wheelGesture.current;
    const now = Date.now();
    if (now < gesture.lockedUntil && Math.sign(deltaX) === gesture.lockedDirection) return;
    if (now - gesture.lastAt > 250 || Math.sign(gesture.distance) !== Math.sign(deltaX)) {
      gesture.distance = 0;
    }
    gesture.lastAt = now;
    gesture.distance += deltaX;
    if (Math.abs(gesture.distance) < 75) return;
    setHistoryOpen(gesture.distance > 0);
    gesture.lockedDirection = Math.sign(gesture.distance);
    gesture.distance = 0;
    gesture.lockedUntil = now + 600;
  };

  return (
    <div
      className={cn(
        "w-full max-w-full bg-background",
        isFull
          ? "h-screen max-h-screen overflow-hidden flex flex-col"
          : "min-h-screen overflow-x-hidden",
      )}
    >
      <Sidebar />
      <div
        className={cn(
          "lg:pl-[248px]",
          isFull ? "flex flex-col h-screen max-h-screen overflow-hidden flex-1 min-h-0" : "",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <div className="shrink-0 z-30">
          <TopBar />
        </div>
        <main
          className={cn(
            "flex-1 min-h-0 touch-pan-y",
            isFull ? "flex flex-col overflow-hidden relative" : "overflow-x-hidden",
          )}
        >
          {children}
        </main>
        <div
          aria-hidden={!historyOpen}
          inert={!historyOpen}
          className={cn(
            "fixed inset-y-0 left-0 right-0 z-40 flex flex-col bg-background shadow-float lg:left-[248px]",
            "transform-gpu transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none",
            historyOpen ? "visible translate-x-0" : "invisible translate-x-full pointer-events-none",
          )}
        >
          <div className="shrink-0"><TopBar copilotHistoryOpen onCopilotHistoryClose={() => setHistoryOpen(false)} /></div>
          <CopilotHistoryPanel onClose={() => setHistoryOpen(false)} activeChatId={_chatId} />
        </div>
      </div>
    </div>
  );
}
