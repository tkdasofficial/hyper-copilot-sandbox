/**
 * Server-only GitHub OAuth helpers. Client credentials come from the Supabase
 * backend (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET), never from app code.
 */

import { providerSecret } from "@/lib/provider-secrets.server";

async function syncFromBackend() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("job_runner")
    .select("worker_token")
    .eq("id", "default")
    .maybeSingle();
  const secret = (data?.worker_token ?? "").trim();
  if (!secret) return;
  await supabaseAdmin.functions.invoke("sync-meta-secrets", {
    body: {},
    headers: { "x-worker-secret": secret },
  });
}

export async function githubCredentials() {
  const read = async () => ({
    clientId: await providerSecret("GITHUB_CLIENT_ID"),
    clientSecret: await providerSecret("GITHUB_CLIENT_SECRET"),
  });
  try {
    return await read();
  } catch {
    await syncFromBackend();
    return await read();
  }
}

export async function exchangeGitHubCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = await githubCredentials();
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitHub refused the request [${res.status}]: ${text}`);
  const token = JSON.parse(text) as Record<string, string>;
  if (token["error"]) throw new Error(token["error_description"] ?? token["error"]);
  const accessToken = token["access_token"];
  if (!accessToken) throw new Error("GitHub did not return an access token.");

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/vnd.github+json",
      "user-agent": "hyper-copilot",
    },
  });
  const userText = await userRes.text();
  if (!userRes.ok) throw new Error(`GitHub user lookup failed [${userRes.status}]: ${userText}`);
  const user = JSON.parse(userText) as Record<string, unknown>;

  return {
    accessToken,
    refreshToken: token["refresh_token"] ?? null,
    expiresIn: token["expires_in"] ? Number(token["expires_in"]) : null,
    scope: token["scope"] ?? "",
    userId: String(user["id"] ?? ""),
    login: String(user["login"] ?? ""),
    name: (user["name"] as string | null) ?? null,
    avatarUrl: (user["avatar_url"] as string | null) ?? null,
  };
}
