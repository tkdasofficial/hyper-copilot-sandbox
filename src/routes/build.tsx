import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { BuildPage } from "@/pages/Build";

export const Route = createFileRoute("/build")({
  head: () =>
    pageHead({
      path: "/build",
      title: "Build — AI Website & Web App Builder | Hyper Copilot",
      description:
        "Build websites and web apps with an AI development agent in Hyper Copilot's Build workspace — chat-driven development with live preview, files, terminal and more.",
      ogTitle: "Build — AI Website & Web App Builder | Hyper Copilot",
      keywords: [
        "AI website builder",
        "AI web app builder",
        "AI coding agent",
        "chat to website",
        "AI app development",
      ],
      noindex: true,
    }),
  component: BuildPage,
});
