/**
 * Server-only helpers for Copilot. The browser never talks to Supabase Edge
 * Functions directly — the app server calls them with the service role key.
 */
import { SUPABASE_URL } from "@/config";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export { supabaseAdmin };
export const CHAT_BUCKET = "copilot-chats";

export function edgeUrl(name: string, query = "") {
  return `${SUPABASE_URL}/functions/v1/${name}${query}`;
}

export function serviceHeaders(extra: Record<string, string> = {}) {
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    ...extra,
  };
}

/** Returns the signed-in user id from the request's bearer token, or null. */
export async function requestUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
