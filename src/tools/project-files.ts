import { useSyncExternalStore } from "react";
import { MOCK_CODE, MOCK_FILES } from "@/components/Build/build-data";

/** Workspace project files shared by the Files and Code tools (in-memory for now). */
export type ProjectNode = { path: string; folder: boolean; content?: string };

type State = { nodes: ProjectNode[]; activePath: string | null; drafts: Record<string, string> };

function seed(): ProjectNode[] {
  const stack: string[] = [];
  return MOCK_FILES.map((f) => {
    stack.length = f.depth;
    const path = [...stack, f.name].join("/");
    if (f.folder) stack.push(f.name);
    return { path, folder: f.folder, content: f.folder ? undefined : path.endsWith("Hero.tsx") ? MOCK_CODE : "" };
  });
}

let state: State = { nodes: seed(), activePath: "src/components/Hero.tsx", drafts: {} };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export function useProjectFiles() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  );
}

const sorted = (nodes: ProjectNode[]) => [...nodes].sort((a, b) => a.path.localeCompare(b.path));
const exists = (path: string) => state.nodes.some((n) => n.path === path);

export const projectFiles = {
  open: (path: string) => set({ activePath: path }),
  edit: (path: string, content: string) => set({ drafts: { ...state.drafts, [path]: content } }),
  save(path: string) {
    const draft = state.drafts[path];
    if (draft === undefined) return;
    const { [path]: _, ...drafts } = state.drafts;
    set({ nodes: state.nodes.map((n) => (n.path === path ? { ...n, content: draft } : n)), drafts });
  },
  create(path: string, folder: boolean) {
    const clean = path.replace(/^\/+|\/+$/g, "");
    if (!clean || exists(clean)) return false;
    set({ nodes: sorted([...state.nodes, { path: clean, folder, content: folder ? undefined : "" }]) });
    return true;
  },
  move(from: string, to: string) {
    const target = to.replace(/^\/+|\/+$/g, "");
    if (!target || exists(target)) return false;
    const re = (p: string) => (p === from ? target : p.startsWith(from + "/") ? target + p.slice(from.length) : p);
    set({
      nodes: sorted(state.nodes.map((n) => ({ ...n, path: re(n.path) }))),
      activePath: state.activePath ? re(state.activePath) : null,
    });
    return true;
  },
  remove(path: string) {
    const gone = (p: string) => p === path || p.startsWith(path + "/");
    set({
      nodes: state.nodes.filter((n) => !gone(n.path)),
      activePath: state.activePath && gone(state.activePath) ? null : state.activePath,
    });
  },
};
