import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { VerifyPage } from "@/pages/Verify";

export const Route = createFileRoute("/verify")({
  ssr: false,
  head: () =>
    pageHead({
      path: "/verify",
      title: "Confirm Your Email \u2014 Hyper Copilot",
      description:
        "Confirm your email address to activate your Hyper Copilot account and start generating.",
      noindex: true,
      keywords: ["Hyper Copilot email verification", "activate AI account"],
    }),
  component: VerifyPage,
});
