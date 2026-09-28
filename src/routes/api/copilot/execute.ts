import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  action: z.enum(["text-to-image", "image-to-image", "image-to-video", "image-analyse", "text-to-audio"]),
  prompt: z.string().max(8000).optional(),
  imageUrl: z.string().optional(),
  aspect: z.string().max(10).optional(),
});

/** Media actions (image, video, audio, image analysis) proxied to the Copilot backend. */
export const Route = createFileRoute("/api/copilot/execute")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { edgeUrl, json, requestUserId, serviceHeaders } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Please sign in to use Copilot." }, 401);
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);

        const res = await fetch(edgeUrl("copilot"), {
          method: "POST",
          headers: serviceHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(parsed.data),
        });
        const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok || !body.ok) {
          console.error("copilot execute failed", res.status, body);
          return json(
            { ok: false, error: "Generation failed. Please try again." },
            res.ok ? 502 : res.status,
          );
        }
        // Strip provider/model details before returning to the browser.
        delete body.model;
        return json(body);
      },
      GET: async ({ request }) => {
        const { edgeUrl, json, requestUserId, serviceHeaders } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Unauthorized" }, 401);
        const requestId = new URL(request.url).searchParams.get("requestId");
        if (!requestId) return json({ ok: false, error: "Missing requestId" }, 400);
        const res = await fetch(edgeUrl("copilot", `?requestId=${encodeURIComponent(requestId)}`), {
          headers: serviceHeaders(),
        });
        const body = await res.json().catch(() => ({ ok: false }));
        return json(body, res.status);
      },
    },
  },
});
