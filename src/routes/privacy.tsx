import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { PrivacyPage } from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      path: "/privacy",
      title: "Privacy Policy — Hyper Copilot",
      description:
        "How Hyper Copilot collects, uses and protects your prompts, uploaded references and account data, plus the controls you have over them.",
      keywords: [
        "Hyper Copilot privacy policy",
        "AI data privacy",
        "AI prompt data retention",
        "GDPR AI platform",
        "AI model training opt out",
      ],
      breadcrumbs: [{ name: "Privacy Policy", path: "/privacy" }],
    }),
  component: PrivacyPage,
});
