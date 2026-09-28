import type { LucideIcon } from "lucide-react";
import {
  Code2,
  FolderTree,
  TerminalSquare,
  GitBranch,
  Database,
  Flame,
  Sparkles,
  Puzzle,
  Hammer,
  ScrollText,
  Eye,
  MessageSquare,
} from "lucide-react";

export type PageType =
  | "preview"
  | "chat"
  | "code"
  | "files"
  | "terminal"
  | "git"
  | "supabase"
  | "firebase"
  | "skills"
  | "tools"
  | "build"
  | "logs";

export type WorkspacePage = { id: string; type: PageType };

export const PAGE_META: Record<
  PageType,
  { label: string; icon: LucideIcon; permanent?: boolean }
> = {
  preview: { label: "Preview", icon: Eye, permanent: true },
  chat: { label: "Chat", icon: MessageSquare, permanent: true },
  code: { label: "Code", icon: Code2 },
  files: { label: "Files", icon: FolderTree },
  terminal: { label: "Terminal", icon: TerminalSquare },
  git: { label: "Git", icon: GitBranch },
  supabase: { label: "Supabase", icon: Database },
  firebase: { label: "Firebase", icon: Flame },
  skills: { label: "Skills", icon: Sparkles },
  tools: { label: "Tools", icon: Puzzle, permanent: true },
  build: { label: "Build", icon: Hammer },
  logs: { label: "Logs", icon: ScrollText },
};

export type Project = { id: string; name: string; updated: string; stack: string };

export const MOCK_PROJECTS: Project[] = [
  { id: "p1", name: "Aurora Storefront", updated: "2 min ago", stack: "React · Tailwind" },
  { id: "p2", name: "Pulse Analytics", updated: "1 hour ago", stack: "Next.js · Supabase" },
  { id: "p3", name: "Nimbus Landing", updated: "Yesterday", stack: "Vite · TypeScript" },
];

export type ChatMessage =
  | { kind: "user"; id: string; text: string }
  | { kind: "ai"; id: string; text: string }
  | {
      kind: "activity";
      id: string;
      steps: { label: string; state: "done" | "active" | "pending" }[];
    };

export const MOCK_CHAT: ChatMessage[] = [
  {
    kind: "user",
    id: "m1",
    text: "Build me a landing page for a coffee subscription service with a hero, pricing and FAQ.",
  },
  {
    kind: "ai",
    id: "m2",
    text: "I'll scaffold a React + Tailwind project with a hero section, a three-tier pricing block and an accordion FAQ. Setting up the project now.",
  },
  {
    kind: "activity",
    id: "m3",
    steps: [
      { label: "Planning", state: "done" },
      { label: "Creating project", state: "done" },
      { label: "Creating files", state: "done" },
      { label: "Running build", state: "done" },
      { label: "Checking errors", state: "done" },
      { label: "Build completed", state: "done" },
    ],
  },
  {
    kind: "ai",
    id: "m4",
    text: "Done. The landing page is ready in the Preview tab — hero with a roast-selector call to action, monthly pricing tiers, and a five-question FAQ. Want me to adjust the color palette or add a testimonials section?",
  },
  {
    kind: "user",
    id: "m5",
    text: "Add a testimonials section below pricing.",
  },
  {
    kind: "activity",
    id: "m6",
    steps: [
      { label: "Updating files", state: "done" },
      { label: "Running build", state: "active" },
      { label: "Checking errors", state: "pending" },
    ],
  },
];

export const MOCK_FILES = [
  { name: "src", depth: 0, folder: true },
  { name: "components", depth: 1, folder: true },
  { name: "Hero.tsx", depth: 2, folder: false },
  { name: "Pricing.tsx", depth: 2, folder: false },
  { name: "Testimonials.tsx", depth: 2, folder: false },
  { name: "Faq.tsx", depth: 2, folder: false },
  { name: "App.tsx", depth: 1, folder: false },
  { name: "styles.css", depth: 1, folder: false },
  { name: "index.html", depth: 0, folder: false },
  { name: "package.json", depth: 0, folder: false },
  { name: "vite.config.ts", depth: 0, folder: false },
];

export const MOCK_CODE = `export function Hero() {
  return (
    <section className="hero">
      <h1>Fresh coffee, roasted weekly</h1>
      <p>Small-batch beans delivered to your door
         every Monday morning.</p>
      <button>Choose your roast</button>
    </section>
  );
}`;

export const MOCK_TERMINAL = [
  "$ vite build",
  "vite v7.1.0 building for production...",
  "✓ 142 modules transformed.",
  "dist/index.html                  0.84 kB",
  "dist/assets/index-B2k9.css      12.31 kB",
  "dist/assets/index-D4m1.js       96.20 kB",
  "✓ built in 1.42s",
];

export const MOCK_LOGS = [
  { time: "11:20:04", level: "info", text: "Build started for Aurora Storefront" },
  { time: "11:20:05", level: "info", text: "Installing dependencies (cached)" },
  { time: "11:20:09", level: "info", text: "Compiling 142 modules" },
  { time: "11:20:11", level: "warn", text: "Hero.tsx: unused import 'useRef'" },
  { time: "11:20:12", level: "info", text: "Build completed in 1.42s" },
  { time: "11:20:12", level: "ok", text: "Preview refreshed" },
];

export const COMPOSER_ACTIONS = ["Add File", "Add Skill", "Add Tool", "Add Image"];
export const MODES = ["Speed", "Flash", "Heavy"] as const;
