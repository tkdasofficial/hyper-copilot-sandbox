import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { AudioPage } from "@/pages/Audio";

export const Route = createFileRoute("/audio")({
  head: () =>
    pageHead({
      path: "/audio",
      title: "AI Voice & Music Generator — Audio Studio | Hyper Copilot",
      description:
        "Generate AI speech and music with 30 voices plus tone, pace, genre, tempo and duration controls in Hyper Copilot's Audio Studio.",
      ogTitle: "AI Voice & Music Generator — Hyper Copilot Audio Studio",
      keywords: [
        "AI voice generator",
        "text to speech online",
        "AI music generator",
        "AI voiceover",
        "realistic TTS voices",
        "royalty free AI music",
        "AI narration generator",
        "AI song maker",
      ],
      breadcrumbs: [{ name: "Audio Studio", path: "/audio" }],
    }),
  component: AudioPage,
});
