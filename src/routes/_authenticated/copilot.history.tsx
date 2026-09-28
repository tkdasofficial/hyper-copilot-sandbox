import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/copilot/history")({
  beforeLoad: () => {
    throw redirect({ to: "/copilot", replace: true });
  },
});
