import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { SettingsPage } from "@/pages/Settings";

export const Route = createFileRoute("/settings")({
  head: () =>
    pageHead({
      path: "/settings",
      title: "Settings & Appearance — Hyper Copilot",
      description:
        "Manage your Hyper Copilot account preferences and choose a System, Light or Dark appearance for the generative AI studio.",
      noindex: true,
      keywords: ["Hyper Copilot settings", "AI studio dark mode", "account preferences"],
    }),
  component: SettingsPage,
});
