import { createFileRoute } from "@tanstack/react-router";

const safeId = (id: string | null) => (id && /^[a-zA-Z0-9_-]{4,64}$/.test(id) ? id : null);

/** Copilot chat history stored as JSON files in Supabase Storage, one folder per user. */
export const Route = createFileRoute("/api/copilot/chats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { CHAT_BUCKET, json, requestUserId, supabaseAdmin } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Unauthorized" }, 401);
        const id = safeId(new URL(request.url).searchParams.get("id"));
        if (id) {
          const { data, error } = await supabaseAdmin.storage
            .from(CHAT_BUCKET)
            .download(`${userId}/${id}.json`);
          if (error || !data) return json({ ok: false, error: "Chat not found." }, 404);
          return json({ ok: true, data: JSON.parse(await data.text()) });
        }
        const { data, error } = await supabaseAdmin.storage
          .from(CHAT_BUCKET)
          .list(userId, { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
        if (error) return json({ ok: false, error: "Could not load chats." }, 500);
        const files = (data ?? []).filter((f) => f.name.endsWith(".json"));
        const chats = await Promise.all(
          files.map(async (f) => {
            let title = "Chat";
            let model: string | undefined;
            let messageCount = 0;
            let updatedAt = f.updated_at;
            try {
              const { data: blob } = await supabaseAdmin.storage
                .from(CHAT_BUCKET)
                .download(`${userId}/${f.name}`);
              if (blob) {
                const p = JSON.parse(await blob.text());
                title = p.title || title;
                model = p.model;
                messageCount = Array.isArray(p.messages) ? p.messages.length : 0;
                updatedAt = p.updatedAt || updatedAt;
              }
            } catch {
              /* unreadable file: keep defaults */
            }
            return {
              fileId: f.id,
              fileName: f.name,
              sessionId: f.name.replace(/\.json$/, ""),
              modifiedTime: f.updated_at,
              title,
              model,
              messageCount,
              updatedAt,
            };
          }),
        );
        return json({ ok: true, chats });
      },
      POST: async ({ request }) => {
        const { CHAT_BUCKET, json, requestUserId, supabaseAdmin } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Unauthorized" }, 401);
        const payload = (await request.json().catch(() => null)) as { sessionId?: string } | null;
        const id = safeId(payload?.sessionId ?? null);
        if (!payload || !id) return json({ ok: false, error: "Invalid chat." }, 400);
        const body = JSON.stringify(payload);
        if (body.length > 5_000_000) return json({ ok: false, error: "Chat too large." }, 413);
        const { error } = await supabaseAdmin.storage
          .from(CHAT_BUCKET)
          .upload(`${userId}/${id}.json`, new Blob([body], { type: "application/json" }), {
            upsert: true,
            contentType: "application/json",
          });
        if (error) return json({ ok: false, error: "Could not save chat." }, 500);
        return json({ ok: true, action: "saved", storageType: "supabase_storage" });
      },
      DELETE: async ({ request }) => {
        const { CHAT_BUCKET, json, requestUserId, supabaseAdmin } =
          await import("@/lib/copilot.server");
        const userId = await requestUserId(request);
        if (!userId) return json({ ok: false, error: "Unauthorized" }, 401);
        const id = safeId(new URL(request.url).searchParams.get("id"));
        if (!id) return json({ ok: false, error: "Invalid chat." }, 400);
        const { error } = await supabaseAdmin.storage.from(CHAT_BUCKET).remove([`${userId}/${id}.json`]);
        if (error) return json({ ok: false, error: "Could not delete chat." }, 500);
        return json({ ok: true });
      },
    },
  },
});
