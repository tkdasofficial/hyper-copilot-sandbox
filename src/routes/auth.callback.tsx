import { createFileRoute } from "@tanstack/react-router";
import { AuthCallbackPage } from "@/pages/AuthCallback";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finishing sign-in — Hyper Copilot" },
      { name: "description", content: "Completing sign-in or account linking for Hyper Copilot." },
      { property: "og:title", content: "Finishing sign-in — Hyper Copilot" },
      { property: "og:description", content: "Completing sign-in or account linking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});
