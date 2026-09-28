import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { completeGitHubConnection, getGitHubConfig } from "@/lib/github.functions";
import { oauthRedirectUri, RESULT_KEYS } from "@/lib/oauth-callback";

const RESULT_KEY = RESULT_KEYS.githubOAuth;
type OAuthResult = { code?: string | null; state?: string | null; error?: string | null };

function waitForCode(popup: Window, state: string) {
  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(poll);
    };
    const settle = (r: OAuthResult) => {
      cleanup();
      if (r.error) reject(new Error(String(r.error)));
      else if (r.code) resolve(String(r.code));
      else reject(new Error("GitHub did not return an authorization code."));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "githubOAuth" || event.data?.state !== state) return;
      settle(event.data as OAuthResult);
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
      try {
        const raw = window.localStorage.getItem(RESULT_KEY);
        const stored = raw ? (JSON.parse(raw) as OAuthResult) : null;
        if (stored && stored.state === state) {
          window.localStorage.removeItem(RESULT_KEY);
          settle(stored);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The GitHub window closed before finishing."));
    }, 400);
  });
}

/** Runs the GitHub consent popup and stores the account for the Build page. */
export function useGitHubConnect() {
  const config = useQuery({ queryKey: ["github-config"], queryFn: () => getGitHubConfig() });
  const complete = useServerFn(completeGitHubConnection);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!config.data?.configured) {
      toast.error("GitHub linking is unavailable right now.");
      return;
    }
    setConnecting(true);
    try {
      const redirectUri = oauthRedirectUri();
      const state = `github:${Math.random().toString(36).slice(2)}:${Date.now()}`;
      const authUrl =
        `https://github.com/login/oauth/authorize?` +
        `client_id=${encodeURIComponent(config.data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent("repo read:user user:email workflow")}` +
        `&state=${encodeURIComponent(state)}`;
      try {
        window.localStorage.removeItem(RESULT_KEY);
      } catch {
        /* ignore */
      }
      const w = 600;
      const h = 720;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        authUrl,
        "github-oauth",
        `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`,
      );
      if (!popup) {
        window.location.assign(authUrl);
        return;
      }
      const code = await waitForCode(popup, state);
      const res = await complete({ data: { code, redirectUri } });
      toast.success(`Connected GitHub as @${res.login}.`);
      void queryClient.invalidateQueries({ queryKey: ["github-connections"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link GitHub");
    } finally {
      setConnecting(false);
    }
  }, [complete, config.data, queryClient]);

  return { connect, connecting, configured: Boolean(config.data?.configured) };
}
