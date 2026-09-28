import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { VideoAgentPage } from "@/pages/VideoAgent";

export const Route = createFileRoute("/video-agent")({
  head: () =>
    pageHead({
      path: "/video-agent",
      title: "Video Agent | Hyper Copilot",
      description:
        "Clean, high-performance AI video studio for long-form documentaries and short-form reels.",
      ogTitle: "Video Agent — Long-Form & Short-Form Studio",
      breadcrumbs: [{ name: "Video Agent", path: "/video-agent" }],
    }),
  component: VideoAgentPage,
});
