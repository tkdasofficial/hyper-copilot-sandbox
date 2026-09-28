import { useCallback, useEffect, useRef, useState } from "react";
import { oauthRedirectUri } from "@/lib/oauth-callback";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { completeMetaConnection, getMetaConfig } from "@/lib/social.functions";
import { providerInfo, type SocialProvider } from "@/lib/social.shared";

const RESULT_KEY = "metaOAuthResult";
const PENDING_KEY = "metaOAuthPending";

type OAuthResult = {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  at?: number;
};
type PendingRequest = { provider: SocialProvider; redirectUri: string; state: string };

function readResult(): OAuthResult | null {
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as OAuthResult) : null;
  } catch {
    return null;
  }
}

function clearStored() {
  try {
    window.localStorage.removeItem(RESULT_KEY);
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
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
      else reject(new Error("Meta did not return an authorization code."));
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "metaOAuth" || event.data?.state !== state) return;
      settle(event.data as OAuthResult);
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
      const stored = readResult();
      if (stored && stored.state === state) {
        settle(stored);
        clearStored();
        return;
      }
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The Meta window closed before finishing."));
    }, 400);
  });
}

export function useMetaConnect() {
  const config = useQuery({ queryKey: ["meta-config"], queryFn: () => getMetaConfig() });
  const complete = useServerFn(completeMetaConnection);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<SocialProvider | null>(null);
  const handledStateRef = useRef<string | null>(null);

  useEffect(() => {
    const pendingRaw = window.localStorage.getItem(PENDING_KEY);
    const result = readResult();
    if (!pendingRaw || !result || !result.state) return;
    if (handledStateRef.current === result.state) return;

    try {
      const pending = JSON.parse(pendingRaw) as PendingRequest;
      if (pending.state !== result.state) return;
      handledStateRef.current = result.state;
      clearStored();

      if (result.error) {
        toast.error(`Meta connect failed: ${result.error}`);
        return;
      }
      if (!result.code) return;

      void (async () => {
        try {
          const res = await complete({
            data: {
              provider: pending.provider,
              code: result.code!,
              redirectUri: pending.redirectUri,
            },
          });
          if (res.linked === 0) {
            toast.error(res.message ?? "No profiles were available to connect.");
          } else {
            toast.success(
              `Connected ${res.linked} ${providerInfo(pending.provider).label} profile(s).`,
            );
          }
          void queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to link Meta profile");
        }
      })();
    } catch {
      clearStored();
    }
  }, [complete, queryClient]);

  const connect = useCallback(
    async (provider: SocialProvider) => {
      if (!config.data?.configured) {
        toast.error("Meta App ID is not configured in environment variables.");
        return;
      }
      setConnecting(provider);
      try {
        const redirectUri = oauthRedirectUri();
        const state = `${provider}:${Math.random().toString(36).slice(2)}:${Date.now()}`;
        const scopes = [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
          "instagram_basic",
          "instagram_content_publish",
        ];

        const authUrl =
          `https://www.facebook.com/v21.0/dialog/oauth?` +
          `client_id=${encodeURIComponent(config.data.appId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&state=${encodeURIComponent(state)}` +
          `&scope=${encodeURIComponent(scopes.join(","))}` +
          `&response_type=code`;

        const w = 600;
        const h = 720;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        clearStored();
        window.localStorage.setItem(PENDING_KEY, JSON.stringify({ provider, redirectUri, state }));

        const popup = window.open(
          authUrl,
          "meta-oauth",
          `width=${w},height=${h},top=${top},left=${left},scrollbars=yes`,
        );
        if (!popup) {
          window.location.assign(authUrl);
          return;
        }

        const code = await waitForCode(popup, state);
        clearStored();
        const res = await complete({ data: { provider, code, redirectUri } });
        if (res.linked === 0) {
          toast.error(res.message ?? "No profiles were available to connect.");
        } else {
          toast.success(`Connected ${res.linked} ${providerInfo(provider).label} profile(s).`);
        }
        void queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to link Meta profile");
      } finally {
        setConnecting(null);
      }
    },
    [complete, config.data, queryClient],
  );

  return {
    connect,
    connecting,
    configured: Boolean(config.data?.configured),
    appId: config.data?.appId,
  };
}
