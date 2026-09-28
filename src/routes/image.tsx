import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { ImagePage } from "@/pages/Image";

export const Route = createFileRoute("/image")({
  head: () =>
    pageHead({
      path: "/image",
      title: "AI Image Generator — Image Studio | Hyper Copilot",
      description:
        "Generate photoreal AI images from text with aspect ratio, style, reference image and variation controls in Hyper Copilot's Image Studio.",
      ogTitle: "AI Image Generator — Hyper Copilot Image Studio",
      keywords: [
        "AI image generator",
        "text to image",
        "photoreal AI images",
        "image to image AI",
        "AI art generator",
        "free AI image maker",
        "4K AI image",
        "product photo AI",
        "AI reference image generator",
        "stable diffusion alternative",
        "AI poster generator",
        "aspect ratio image AI",
      ],
      breadcrumbs: [{ name: "Image Studio", path: "/image" }],
    }),
  component: ImagePage,
});
