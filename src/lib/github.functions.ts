import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GitHubConnection = {
  id: string;
  login: string | null;
  name: string | null;
  avatarUrl: string | null;
};

/** Public GitHub client id plus whether the backend holds the secret. */
export const getGitHubConfig = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { githubCredentials } = await import("@/lib/github.server");
    const { clientId, clientSecret } = await githubCredentials();
    return { clientId, configured: Boolean(clientId && clientSecret) };
  } catch {
    return { clientId: "", configured: false };
  }
});

/** GitHub accounts linked by the signed-in user. */
export const listGitHubConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<GitHubConnection[]> => {
    const { data, error } = await context.supabase
      .from("social_connections")
      .select("id, display_name, username, avatar_url")
      .eq("provider", "github")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      login: r.username,
      name: r.display_name,
      avatarUrl: r.avatar_url,
    }));
  });

/** Exchanges the GitHub authorization code and stores the account for the Build page. */
export const completeGitHubConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; redirectUri: string }) => {
    if (!input?.code) throw new Error("Missing authorization code");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { exchangeGitHubCode } = await import("@/lib/github.server");
    const gh = await exchangeGitHubCode(data.code, data.redirectUri);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("social_connections").upsert(
      [
        {
          user_id: context.userId,
          provider: "github",
          external_id: gh.userId,
          display_name: gh.name ?? gh.login,
          username: gh.login,
          avatar_url: gh.avatarUrl,
          access_token: gh.accessToken,
          token_expires_at: gh.expiresIn
            ? new Date(Date.now() + gh.expiresIn * 1000).toISOString()
            : null,
          scopes: gh.scope ? gh.scope.split(/[,\s]+/).filter(Boolean) : [],
          status: "linked",
          metadata: { refreshToken: gh.refreshToken, purpose: "build" } as never,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "user_id,provider,external_id" },
    );
    if (error) throw new Error(error.message);
    return { login: gh.login };
  });
