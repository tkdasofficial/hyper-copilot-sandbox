import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { WorkflowsPage } from "@/pages/Workflows";

export const Route = createFileRoute("/_authenticated/workflows/")({
  head: () =>
    pageHead({
      path: "/workflows",
      title: "Workflows — Schedule & Publish Social Content",
      description:
        "Automated publishing workflows: generate videos on a schedule and publish them to Facebook, Instagram and Threads.",
      noindex: true,
      keywords: ["social media automation", "post scheduling", "reel publishing", "cross-posting"],
    }),
  component: WorkflowsPage,
});
