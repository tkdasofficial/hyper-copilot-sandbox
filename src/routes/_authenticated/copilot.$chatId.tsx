import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { CopilotChatPage } from "@/pages/CopilotChat";

export const Route = createFileRoute("/_authenticated/copilot/$chatId")({
  beforeLoad: ({ params }) => {
    if (params.chatId === "new") {
      throw redirect({ to: "/copilot" });
    }
  },
  head: () =>
    pageHead({
      path: "/copilot",
      title: "Copilot — Hyper Copilot",
      description: "Continue your Hyper Copilot conversation.",
      noindex: true,
      keywords: ["Hyper Copilot chat"],
    }),
  component: CopilotConversationRoute,
});

function CopilotConversationRoute() {
  const { chatId } = Route.useParams();
  return <CopilotChatPage chatId={chatId} />;
}
