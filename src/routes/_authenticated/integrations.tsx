import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { IntegrationsPage } from "@/pages/Integrations";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () =>
    pageHead({
      path: "/integrations",
      title: "Integrations — Connect Facebook, Instagram & Threads",
      description:
        "Link your Facebook Page, Instagram Business account and Threads profile to publish and automate directly from Hyper Copilot.",
      noindex: true,
      keywords: [
        "social integrations",
        "connect Instagram",
        "connect Facebook Page",
        "Threads API",
      ],
    }),
  component: IntegrationsPage,
});
