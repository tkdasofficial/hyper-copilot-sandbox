import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { PricingPage } from "@/pages/Pricing";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      path: "/pricing",
      title: "Pricing & Plans — Hyper Copilot AI Studio",
      description:
        "Compare Hyper Copilot plans: free starter credits, Pro unlimited fast renders with 4K upscaling, and Studio for teams shipping generative AI at scale.",
      keywords: [
        "AI generator pricing",
        "free AI image generator",
        "AI video generator price",
        "cheap AI art subscription",
        "AI studio plans",
        "unlimited AI image generation",
        "commercial license AI images",
        "AI credits pricing",
      ],
      breadcrumbs: [{ name: "Pricing", path: "/pricing" }],
      jsonLd: [
        {
          "@type": "Product",
          name: "Hyper Copilot",
          description: "Multi-modal AI generation platform",
          brand: {
            "@type": "Brand",
            name: "Hyper Copilot",
          },
          offers: [
            {
              "@type": "Offer",
              name: "Starter",
              price: "0",
              priceCurrency: "USD",
              url: "https://hypercopilot.vercel.app/pricing",
            },
            {
              "@type": "Offer",
              name: "Pro",
              price: "29",
              priceCurrency: "USD",
              url: "https://hypercopilot.vercel.app/pricing",
            },
            {
              "@type": "Offer",
              name: "Studio",
              price: "89",
              priceCurrency: "USD",
              url: "https://hypercopilot.vercel.app/pricing",
            },
          ],
        },
      ],
    }),
  component: PricingPage,
});
