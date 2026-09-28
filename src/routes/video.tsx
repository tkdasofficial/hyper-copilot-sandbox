import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { VideoPage } from "@/pages/Video";

export const Route = createFileRoute("/video")({
  head: () =>
    pageHead({
      path: "/video",
      title: "AI Video Generator — Video Studio | Hyper Copilot",
      description:
        "Create cinematic AI videos from text or start and end frames with duration, frame rate, camera motion and aspect ratio control.",
      ogTitle: "AI Video Generator — Hyper Copilot Video Studio",
      keywords: [
        "AI video generator",
        "text to video",
        "image to video AI",
        "cinematic AI video",
        "AI video maker free",
        "start and end frame video AI",
        "AI reels generator",
        "short form video AI",
        "1080p AI video",
      ],
      breadcrumbs: [{ name: "Video Studio", path: "/video" }],
    }),
  component: VideoPage,
});
