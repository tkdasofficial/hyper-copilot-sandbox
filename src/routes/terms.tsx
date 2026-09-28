import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { TermsPage } from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      path: "/terms",
      title: "Terms of Service — Hyper Copilot",
      description:
        "The terms that govern your use of Hyper Copilot, including acceptable use, output ownership, credits and account termination.",
      keywords: [
        "Hyper Copilot terms of service",
        "AI output ownership",
        "AI commercial use license",
        "AI acceptable use policy",
      ],
      breadcrumbs: [{ name: "Terms of Service", path: "/terms" }],
    }),
  component: TermsPage,
});
