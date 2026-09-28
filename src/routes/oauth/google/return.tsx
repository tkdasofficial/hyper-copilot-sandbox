import { createFileRoute } from "@tanstack/react-router";
import { AuthCallbackPage } from "@/pages/AuthCallback";

// Legacy return address — handled by the universal callback.
export const Route = createFileRoute("/oauth/google/return")({
  ssr: false,
  component: AuthCallbackPage,
});
