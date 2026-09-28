import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { AuthPage } from "@/pages/Auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () =>
    pageHead({
      path: "/auth",
      title: "Sign In or Sign Up \u2014 Hyper Copilot AI Studio",
      description:
        "Continue with email or Google to access the Hyper Copilot generative AI studio for image, video, vector and audio creation.",
      ogTitle: "Sign in to Hyper Copilot",
      ogDescription:
        "Continue with email or Google to access the Hyper Copilot generative AI studio.",
      keywords: [
        "Hyper Copilot login",
        "Hyper Copilot sign up",
        "AI generator login",
        "free AI account signup",
        "google sign in AI studio",
      ],
      breadcrumbs: [{ name: "Sign in", path: "/auth" }],
    }),
  component: AuthPage,
});
