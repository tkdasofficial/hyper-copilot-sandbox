import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Brain, Check, ChevronUp, CircleCheck, FileSearch, Files,
  FlaskConical, FolderSearch, Loader2, PackageCheck, Plus, Search,
  Send, ShieldCheck, Wrench,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";
import { COMPOSER_ACTIONS, MODES } from "../build-data";

type ActionType = "analyze" | "read" | "dependencies" | "search" | "edit" | "test" | "issue" | "fix" | "verify";
type ActionStatus = "running" | "done" | "issue" | "verified";
type RawAction = { id: string; type: ActionType; label: string; status: ActionStatus; outcome: ActionStatus };
type Entry =
  | { kind: "user" | "ai"; id: string; text: string; final?: boolean }
  | { kind: "activity"; id: string; actions: RawAction[] };
type ScriptEvent =
  | { kind: "ai"; text: string; final?: boolean }
  | { kind: "action"; type: ActionType; label: string; outcome?: ActionStatus }
  | { kind: "think" };

const ACTION_ICONS: Record<ActionType, LucideIcon> = {
  analyze: FolderSearch, read: FileSearch, dependencies: PackageCheck, search: Search,
  edit: Files, test: FlaskConical, issue: AlertTriangle, fix: Wrench, verify: ShieldCheck,
};

function demoScript(request: string): ScriptEvent[] {
  const subject = request.toLowerCase().includes("testimonial") ? "testimonials section" : "requested update";
  return [
    { kind: "ai", text: "I'll inspect the project and check what needs to change." },
    { kind: "action", type: "analyze", label: "Analyzing project" },
    { kind: "action", type: "read", label: "Reading src/routes/index.tsx" },
    { kind: "action", type: "search", label: "Searching files for pricing components" },
    { kind: "action", type: "read", label: "Reading src/components/Pricing.tsx" },
    { kind: "action", type: "dependencies", label: "Checking dependencies" },
    { kind: "think" },
    { kind: "ai", text: `The layout is clear. Adding the ${subject} now.` },
    { kind: "action", type: "edit", label: "Editing src/components/Testimonials.tsx" },
    { kind: "action", type: "edit", label: "Editing src/routes/index.tsx" },
    { kind: "action", type: "test", label: "Running tests" },
    { kind: "action", type: "issue", label: "Detected an issue: card overflow on small screens", outcome: "issue" },
    { kind: "think" },
    { kind: "ai", text: "Found a small layout issue. Fixing it and re-checking." },
    { kind: "action", type: "fix", label: "Fixing the card overflow" },
    { kind: "action", type: "test", label: "Running tests again" },
    { kind: "action", type: "verify", label: "Verifying the build", outcome: "verified" },
    { kind: "think" },
    { kind: "ai", text: "The changes are complete and the build has been verified.", final: true },
  ];
}

function settle(entries: Entry[]): Entry[] {
  return entries.map((e) => e.kind === "activity" && e.actions.some((a) => a.status === "running")
    ? { ...e, actions: e.actions.map((a) => a.status === "running" ? { ...a, status: a.outcome } : a) } : e);
}

function appendEvent(entries: Entry[], event: ScriptEvent, runId: string, index: number, live = true): Entry[] {
  const base = settle(entries);
  if (event.kind === "think") return base;
  if (event.kind === "ai") return [...base, { kind: "ai", id: `${runId}-message-${index}`, text: event.text, final: event.final }];
  const outcome = event.outcome ?? "done";
  const action: RawAction = { id: `${runId}-action-${index}`, type: event.type, label: event.label, outcome, status: live ? "running" : outcome };
  const last = base.at(-1);
  if (last?.kind === "activity") return [...base.slice(0, -1), { ...last, actions: [...last.actions, action] }];
  return [...base, { kind: "activity", id: `${runId}-activity-${index}`, actions: [action] }];
}

const INITIAL_REQUEST = "Add a testimonials section below pricing.";
const INITIAL_ENTRIES: Entry[] = demoScript(INITIAL_REQUEST).reduce<Entry[]>(
  (entries, event, index) => appendEvent(entries, event, "sample", index, false),
  [{ kind: "user", id: "sample-user", text: INITIAL_REQUEST }],
);

const STATUS_RING: Record<ActionStatus, string> = {
  running: "border-foreground/40 text-foreground",
  done: "border-border text-muted-foreground",
  issue: "border-destructive/50 text-destructive",
  verified: "border-primary/50 text-primary",
};
const STATUS_LABEL: Record<ActionStatus, string> = { running: "Running", done: "Completed", issue: "Issue", verified: "Verified" };

function ActionDot({ action }: { action: RawAction }) {
  const Icon = ACTION_ICONS[action.type];
  return (
    <span title={`${action.label} · ${STATUS_LABEL[action.status]}`}
      className={cn("relative grid h-7 w-7 shrink-0 place-items-center rounded-full border bg-surface", STATUS_RING[action.status])}>
      {action.status === "running"
        ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" strokeWidth={2} />
        : <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />}
    </span>
  );
}

function StatusMark({ status }: { status: ActionStatus }) {
  if (status === "running") return <span className="text-[10px] text-muted-foreground">Running</span>;
  if (status === "issue") return <AlertTriangle aria-label="Issue" className="h-3 w-3 shrink-0 text-destructive" />;
  if (status === "verified") return <CircleCheck aria-label="Verified" className="h-3 w-3 shrink-0 text-primary" />;
  return <Check aria-label="Completed" className="h-3 w-3 shrink-0 text-muted-foreground" />;
}

function ActionLine({ entry }: { entry: Extract<Entry, { kind: "activity" }> }) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(240);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([i]) => { if (i && i.contentRect.width > 0) setWidth(i.contentRect.width); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // 28px circles with 2px gaps; reserve room for the count label and overflow circle.
  const slots = Math.max(1, Math.floor((width - 76 + 2) / 30));
  const overflow = entry.actions.length > slots;
  const visible = entry.actions.slice(-Math.max(1, slots - (overflow ? 1 : 0)));

  return (
    <div className="w-full min-w-0 max-w-full" data-no-swipe>
      {!open ? (
        <button ref={ref} type="button" aria-expanded={false} aria-label="Show actions" onClick={() => setOpen(true)}
          className="group flex h-8 w-full min-w-0 items-center gap-0.5 overflow-hidden text-left">
          {overflow ? <>
            {visible.slice(0, Math.ceil(visible.length / 2)).map((a) => <ActionDot key={a.id} action={a} />)}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-surface text-[10px] leading-none text-muted-foreground">•••</span>
            {visible.slice(Math.ceil(visible.length / 2)).map((a) => <ActionDot key={a.id} action={a} />)}
          </> : visible.map((a) => <ActionDot key={a.id} action={a} />)}
          <span className="ml-2 shrink-0 text-[12px] tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">{entry.actions.length} {entry.actions.length === 1 ? "action" : "actions"}</span>
        </button>
      ) : (
        <div className="py-0.5">
          <button type="button" aria-expanded onClick={() => setOpen(false)}
            className="group flex h-9 w-full min-w-0 items-center gap-3 text-left">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground"><ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /></span>
            <span className="text-[13px] text-muted-foreground transition-colors group-hover:text-foreground">Show less</span>
          </button>
          <div role="list" aria-label="Actions" className="max-h-64 overflow-y-auto">
            {entry.actions.map((a) => (
              <div key={a.id} role="listitem" className="flex h-9 min-w-0 items-center gap-3">
                <ActionDot action={a} />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/85">{a.label}</span>
                <StatusMark status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BuildChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Entry[]>(INITIAL_ENTRIES);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("Flash");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runNumber = useRef(0);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const autogrow = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  const send = () => {
    const request = draft.trim();
    if (!request || running) return;
    const runId = `run-${++runNumber.current}`;
    setMessages((current) => [...current, { kind: "user", id: `${runId}-user`, text: request }]);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "";
    taRef.current?.focus();
    setRunning(true);
    setThinking(true);
    const script = demoScript(request);
    let index = 0;
    const next = () => {
      const eventIndex = index++;
      const event = script[eventIndex];
      if (!event) { setMessages((c) => settle(c)); setThinking(false); setRunning(false); timerRef.current = null; taRef.current?.focus(); return; }
      setThinking(event.kind === "think");
      if (event.kind !== "think") setMessages((current) => appendEvent(current, event, runId, eventIndex));
      timerRef.current = setTimeout(next, event.kind === "action" ? 660 : event.kind === "think" ? 650 : 880);
    };
    timerRef.current = setTimeout(next, 800);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto", compact ? "px-3 py-2" : "px-4 py-2")}>
        {messages.map((m) => m.kind === "activity" ? (
          <ActionLine key={m.id} entry={m} />
        ) : (
          <Message key={m.id} from={m.kind === "user" ? "user" : "assistant"} className={m.kind === "user" ? "max-w-[85%]" : "max-w-[92%]"}>
            <MessageContent className={m.kind === "user"
              ? "rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-[13px] leading-relaxed text-background group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-foreground group-[.is-user]:px-3.5 group-[.is-user]:py-2 group-[.is-user]:text-background"
              : "w-full gap-1 text-[13px] leading-relaxed"}>
              {m.kind === "ai" ? <MessageResponse className="text-[14px] leading-relaxed">{m.text}</MessageResponse> : m.text}
            </MessageContent>
          </Message>
        ))}
        {thinking && <div role="status" className="flex items-center gap-2.5 text-[13px] text-muted-foreground"><span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface"><Brain className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none" strokeWidth={1.8} /></span> Planning next steps…</div>}
      </div>

      <div className={cn("shrink-0", compact ? "p-2" : "px-3 pb-1 pt-1")}>
        <div className="rounded-2xl border border-border bg-surface focus-within:border-border-strong">
          <textarea ref={taRef} value={draft} onChange={(e) => { setDraft(e.target.value); autogrow(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1} placeholder="Describe what to build…"
            className="max-h-[120px] w-full resize-none bg-transparent px-3.5 pt-3 text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground" />
          <div className="flex items-center gap-1.5 px-2 pb-2">
            <div className="relative">
              <button type="button" aria-label="Add attachment" onClick={() => { setActionsOpen((v) => !v); setModeOpen(false); }}
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
              {actionsOpen && <div className="absolute bottom-10 left-0 z-20 w-40 rounded-xl border border-border bg-background p-1 shadow-xl">
                {COMPOSER_ACTIONS.map((a) => <button key={a} type="button" onClick={() => { setActionsOpen(false); toast(a, { description: "Available once the builder backend is connected." }); }}
                  className="w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground">{a}</button>)}
              </div>}
            </div>
            <div className="relative">
              <button type="button" onClick={() => { setModeOpen((v) => !v); setActionsOpen(false); }}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[11px] font-semibold leading-none text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                {mode}
              </button>
              {modeOpen && <div className="absolute bottom-10 left-0 z-20 w-28 rounded-xl border border-border bg-background p-1 shadow-xl">
                {MODES.map((m) => <button key={m} type="button" onClick={() => { setMode(m); setModeOpen(false); }}
                  className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium leading-none transition-colors hover:bg-surface", m === mode ? "text-foreground" : "text-muted-foreground")}>
                  {m}{m === mode && <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />}
                </button>)}
              </div>}
            </div>
            <button type="button" aria-label="Send" onClick={send} disabled={!draft.trim() || running}
              className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30">
              <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildChat;
