import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { CreateVirtualModelPage } from "@/pages/CreateVirtualModel";

export const Route = createFileRoute("/virtual-model/create-model")({
  head: () =>
    pageHead({
      path: "/virtual-model/create-model",
      title: "Create an AI Character — AI Model Builder | Hyper Copilot",
      description:
        "Build a reusable AI character with age, height, body type, render style, skin tone, eyes, hair and face traits for consistent AI influencer images.",
      ogTitle: "Create an AI Character — Hyper Copilot Model Builder",
      keywords: [
        "create AI character",
        "AI character builder",
        "custom AI model creator",
        "consistent AI face",
        "AI persona generator",
        "design virtual influencer",
      ],
      breadcrumbs: [
        { name: "Virtual Model", path: "/virtual-model" },
        { name: "Create Model", path: "/virtual-model/create-model" },
      ],
    }),
  component: CreateVirtualModelPage,
});
