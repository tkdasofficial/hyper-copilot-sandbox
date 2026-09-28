import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({ prompt: z.string().max(8000), hasAttachment: z.boolean() });

export const Route = createFileRoute("/api/copilot/intent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { json, requestUserId } = await import("@/lib/copilot.server");
        if (!(await requestUserId(request))) return json({ error: "Please sign in to use Copilot." }, 401);
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ error: "Invalid request." }, 400);
        const { classifyCopilotRequest } = await import("@/lib/copilot-intent.server");
        return json(classifyCopilotRequest(parsed.data.prompt, parsed.data.hasAttachment));
      },
    },
  },
});