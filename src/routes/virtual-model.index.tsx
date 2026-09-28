import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { VirtualModelPage } from "@/pages/VirtualModel";

export const Route = createFileRoute("/virtual-model/")({
  head: () =>
    pageHead({
      path: "/virtual-model",
      title: "AI Influencer Generator — Virtual Model Studio | Hyper Copilot",
      description:
        "Create face-consistent AI influencers and virtual models with wardrobe, scene, lighting, lens and framing control from a reusable character profile.",
      ogTitle: "AI Influencer Generator — Virtual Model Studio",
      keywords: [
        "AI influencer generator",
        "virtual model AI",
        "consistent character AI",
        "AI fashion model",
        "virtual influencer creator",
        "AI UGC model",
        "face consistent AI images",
        "AI model photoshoot",
      ],
      breadcrumbs: [{ name: "Virtual Model", path: "/virtual-model" }],
    }),
  component: VirtualModelPage,
});
