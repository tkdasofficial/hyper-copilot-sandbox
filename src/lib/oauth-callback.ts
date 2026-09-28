/**
 * One universal OAuth return address for every service: /auth/callback.
 * The `state` prefix tells the callback page which flow the result belongs to.
 */

export const OAUTH_CALLBACK_PATH = "/auth/callback";

export function oauthRedirectUri() {
  return `${window.location.origin}${OAUTH_CALLBACK_PATH}`;
}

export type OAuthKind = "googleOAuth" | "metaOAuth" | "githubOAuth";

/** Maps a `state` value to the flow that started it (null = Supabase sign-in). */
export function kindForState(state: string | null): OAuthKind | null {
  if (!state) return null;
  const prefix = state.split(":")[0];
  if (prefix === "youtube") return "googleOAuth";
  if (prefix === "github") return "githubOAuth";
  if (prefix === "facebook_page" || prefix === "instagram" || prefix === "threads") {
    return "metaOAuth";
  }
  return null;
}

export const RESULT_KEYS: Record<OAuthKind, string> = {
  googleOAuth: "googleOAuthResult",
  metaOAuth: "metaOAuthResult",
  githubOAuth: "githubOAuthResult",
};
