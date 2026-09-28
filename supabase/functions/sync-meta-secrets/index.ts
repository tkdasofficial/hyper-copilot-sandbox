import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Copies provider credentials from the Supabase function secrets into the
// service-role-only provider store the app server reads from.
const REQUIRED = ["META_APP_ID", "META_APP_SECRET", "META_LOGIN_CONFIG_ID"] as const;
const OPTIONAL = ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] as const;

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const managementToken = Deno.env.get("SB_MANAGEMENT_ACCESS_TOKEN") ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const workerSecret = request.headers.get("x-worker-secret") ?? "";

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let allowed = Boolean(managementToken) && authorization === `Bearer ${managementToken}`;
  if (!allowed && workerSecret) {
    const { data } = await supabase.rpc("verify_worker_token", { p_token: workerSecret });
    allowed = data === true;
  }
  if (!serviceKey || !allowed) return new Response("Forbidden", { status: 403 });

  const synced: string[] = [];
  const missing: string[] = [];
  for (const name of [...REQUIRED, ...OPTIONAL]) {
    const value = (Deno.env.get(name) ?? "").trim().replace(/^["']|["']$/g, "");
    if (!value) {
      missing.push(name);
      continue;
    }
    const { error } = await supabase.rpc("set_provider_secret", { p_name: name, p_value: value });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    synced.push(name);
  }

  return Response.json({ ok: missing.length === 0, synced, missing });
});
