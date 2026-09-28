import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { CreateWorkflowPage } from "@/pages/CreateWorkflow";

type Search = { id?: string | undefined };

export const Route = createFileRoute("/_authenticated/workflows/create")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () =>
    pageHead({
      path: "/workflows/create",
      title: "Create Workflow — Automated Video Publishing",
      description:
        "Set a schedule, customize the AI video creation and publish automatically to your connected social accounts.",
      noindex: true,
      keywords: ["create workflow", "schedule video", "auto publishing"],
    }),
  component: CreateWorkflowRoute,
});

function CreateWorkflowRoute() {
  const { id } = Route.useSearch();
  return <CreateWorkflowPage id={id} />;
}
