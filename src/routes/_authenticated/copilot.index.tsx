import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { CopilotPage } from "@/pages/Copilot";

export const Route = createFileRoute("/_authenticated/copilot/")({
  head: () =>
    pageHead({
      path: "/copilot",
      title: "Copilot — Hyper Copilot",
      description: "Start a new conversation with Hyper Copilot.",
      noindex: true,
      keywords: ["Hyper Copilot", "AI assistant", "Copilot chat"],
    }),
  component: CopilotPage,
});
