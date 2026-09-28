import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { HomePage } from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead({
      path: "/",
      title: "Hyper Copilot — Multi-Modal AI Generator",
      description:
        "Built by Tushar Kanti Das, Hyper Copilot is an all-in-one multi-modal AI platform for image, video, audio, and AI influencer creation.",
      keywords: [
        "AI image generator",
        "AI video generator",
        "AI music generator",
        "AI influencer creator",
        "photoreal image AI",
        "text to speech AI",
        "AI art generator online",
        "all in one AI studio",
        "generative AI for teams",
        "AI vector generator",
        "8K AI upscaler",
        "commercially safe AI images",
      ],
      jsonLd: [
        {
          "@type": "SoftwareApplication",
          name: "Hyper Copilot",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "All",
          url: "https://hypercopilot.vercel.app/",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          creator: {
            "@type": "Person",
            name: "Tushar Kanti Das",
          },
        },
      ],
    }),
  component: HomePage,
});
