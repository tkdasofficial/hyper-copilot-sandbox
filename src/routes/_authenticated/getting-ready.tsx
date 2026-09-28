import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { GettingReadyPage } from "@/pages/GettingReady";

export const Route = createFileRoute("/_authenticated/getting-ready")({
  head: () =>
    pageHead({
      path: "/getting-ready",
      title: "Getting Ready \u2014 Hyper Copilot",
      description:
        "Tell us your name, role and what you plan to create so we can tailor your studio.",
      noindex: true,
      keywords: ["Hyper Copilot onboarding"],
    }),
  component: GettingReadyPage,
});
