import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LibraryPage } from "@/pages/Library";

export const Route = createFileRoute("/library")({
  head: () =>
    pageHead({
      path: "/library",
      title: "Library — Manage Your AI Generations | Hyper Copilot",
      description:
        "Browse, search, download and delete every image, video, audio and vector asset you have generated in Hyper Copilot.",
      noindex: true,
      keywords: [
        "AI generation library",
        "AI asset manager",
        "download AI images",
        "AI media history",
      ],
    }),
  component: LibraryPage,
});
