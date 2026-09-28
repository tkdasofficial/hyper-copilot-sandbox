import { useCallback, useState } from "react";
import { oauthRedirectUri } from "@/lib/oauth-callback";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { completeYouTubeConnection, getYouTubeConfig } from "@/lib/youtube.functions";
import { providerInfo } from "@/lib/social.shared";

const RESULT_KEY = "googleOAuthResult";

type OAuthResult = { code?: string | null; state?: string | null; error?: string | null };

function readResult(): OAuthResult | null {
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as OAuthResult) : null;
  } catch {
    return null;
  }
}

function waitForCode(popup: Window, state: string) {
  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(poll);
    };
    const settle = (result: OAuthResult) => {
      cleanup();
      if (result.error) reject(new Error(String(result.error)));
      else if (result.code) resolve(String(result.code));
      else reject(new Error("Google did not return an authorization code."));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "googleOAuth" || event.data?.state !== state) return;
      settle(event.data as OAuthResult);
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
      const stored = readResult();
      if (stored && stored.state === state) {
        try {
          window.localStorage.removeItem(RESULT_KEY);
        } catch {
          /* ignore */
        }
        settle(stored);
        return;
      }
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The Google window closed before finishing."));
    }, 400);
  });
}

/** Runs the Google consent popup and stores the resulting YouTube channel. */
export function useYouTubeConnect() {
  const config = useQuery({ queryKey: ["youtube-config"], queryFn: () => getYouTubeConfig() });
  const complete = useServerFn(completeYouTubeConnection);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!config.data?.configured) {
      toast.error(
        "YouTube is not configured. Ask the workspace admin to provide Google OAuth credentials.",
      );
      return;
    }
    setConnecting(true);
    try {
      const redirectUri = oauthRedirectUri();
      const state = `youtube:${Math.random().toString(36).slice(2)}:${Date.now()}`;
      const scopes = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "openid",
        "email",
        "profile",
      ];
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(config.data.clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes.join(" "))}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;

      const w = 520;
      const h = 640;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      try {
        window.localStorage.removeItem(RESULT_KEY);
      } catch {
        /* ignore */
      }
      const popup = window.open(
        authUrl,
        "google-oauth",
        `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`,
      );
      if (!popup) {
        window.location.assign(authUrl);
        return;
      }

      const code = await waitForCode(popup, state);
      const res = await complete({ data: { code, redirectUri } });
      toast.success(res.linked ? "Connected your YouTube channel." : "No channel was connected.");
      void queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link YouTube channel");
    } finally {
      setConnecting(false);
    }
  }, [complete, config.data, queryClient]);

  return {
    connect,
    connecting,
    configured: Boolean(config.data?.configured),
    clientId: config.data?.clientId,
    info: providerInfo("youtube"),
  };
}
