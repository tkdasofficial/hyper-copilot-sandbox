import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  tier: z.enum(["speed", "flash", "heavy"]),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
});

type Emit = (event: Record<string, unknown>) => void;

/**
 * Reads the NVIDIA SSE stream and forwards only user-facing events.
 * Returns "retry" when the provider failed before any answer text arrived.
 */
async function pump(
  res: Response,
  emit: Emit,
  signal: AbortSignal,
): Promise<"ok" | "retry" | string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotText = false;
  let announcedThinking = false;
  while (true) {
    if (signal.aborted) return "ok";
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let parsed: {
        error?: { message?: string; code?: number };
        choices?: Array<{ delta?: { content?: string | null; reasoning_content?: string | null } }>;
      };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      if (parsed.error) {
        const code = parsed.error.code ?? 500;
        if (!gotText && (code === 429 || code >= 500)) return "retry";
        return code === 429
          ? "The model is busy right now. Please try again in a moment."
          : "The response was interrupted. Please try again.";
      }
      const delta = parsed.choices?.[0]?.delta;
      if (delta?.reasoning_content && !announcedThinking && !gotText) {
        announcedThinking = true;
         emit({ t: "activity", v: "Reasoning" });
      }
      if (delta?.content) {
        gotText = true;
        emit({ t: "text", v: delta.content });
      }
    }
  }
  return gotText ? "ok" : "retry";
}

export const Route = createFileRoute("/api/copilot/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { edgeUrl, json, requestUserId, serviceHeaders } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Please sign in to use Copilot." }, 401);

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ ok: false, error: "Invalid request." }, 400);
        const { tier, messages } = parsed.data;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const emit: Emit = (e) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
             emit({ t: "thinking" });
            let outcome: string = "retry";
            for (let attempt = 0; attempt < 3 && outcome === "retry"; attempt++) {
              if (attempt > 0) {
                emit({ t: "retrying", attempt });
                await new Promise((r) =>
                  setTimeout(r, 1000 * 2 ** (attempt - 1) + Math.random() * 400),
                );
              }
              try {
                const res = await fetch(edgeUrl("copilot"), {
                  method: "POST",
                  headers: serviceHeaders({ "Content-Type": "application/json" }),
                  body: JSON.stringify({ action: "text", modelTier: tier, messages, stream: true }),
                  signal: request.signal,
                });
                if (!res.ok || !res.body) {
                  const body = (await res.json().catch(() => ({}))) as { error?: string };
                  outcome =
                    res.status === 429 || res.status >= 500
                      ? "retry"
                      : body.error || "The request could not be completed.";
                  if (outcome === "retry" && attempt === 2) {
                    outcome =
                      body.error || "The model is temporarily unavailable. Please try again.";
                  }
                  continue;
                }
                outcome = await pump(res, emit, request.signal);
              } catch (err) {
                if (request.signal.aborted) {
                  outcome = "ok";
                  break;
                }
                console.error("copilot chat stream failed", err);
                outcome = "retry";
              }
            }
            if (outcome === "retry") {
              outcome = "The model is temporarily unavailable. Please try again.";
            }
            emit(outcome === "ok" ? { t: "done" } : { t: "error", v: outcome });
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
