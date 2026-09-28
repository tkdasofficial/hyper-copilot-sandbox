import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/config";
import { kindForState, RESULT_KEYS } from "@/lib/oauth-callback";

type Phase = "working" | "done" | "error";

/** Universal OAuth return page for sign-in and every account link. */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState("Finishing up…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("code");
    const state = params.get("state");
    const error =
      params.get("error_description") ??
      params.get("error") ??
      hash.get("error_description") ??
      hash.get("error");
    const kind = kindForState(state);
    const timers: number[] = [];

    // ---- Account linking popups (Google / Meta / GitHub) ----
    if (kind) {
      setMessage("Linking your account…");
      const payload = { type: kind, code, state, error };
      try {
        window.localStorage.setItem(RESULT_KEYS[kind], JSON.stringify({ ...payload, at: Date.now() }));
      } catch {
        /* storage unavailable */
      }
      const closeSoon = (delay: number) => {
        timers.push(
          window.setTimeout(() => {
            window.close();
            timers.push(
              window.setTimeout(() => {
                if (!window.closed) window.location.replace("/integrations");
              }, 400),
            );
          }, delay),
        );
      };
      if (error) {
        setPhase("error");
        setMessage(String(error));
        closeSoon(1600);
        return () => timers.forEach((t) => window.clearTimeout(t));
      }
      const onAck = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== `${kind}Ack`) return;
        setPhase(event.data.ok ? "done" : "error");
        setMessage(event.data.ok ? "Account linked" : String(event.data.message ?? "Linking failed"));
        closeSoon(event.data.ok ? 600 : 1600);
      };
      window.addEventListener("message", onAck);
      window.opener?.postMessage(payload, window.location.origin);
      if (!window.opener) closeSoon(600);
      else timers.push(window.setTimeout(() => closeSoon(0), 20000));
      return () => {
        window.removeEventListener("message", onAck);
        timers.forEach((t) => window.clearTimeout(t));
      };
    }

    // ---- Supabase sign-in (Google / GitHub / Facebook / email links) ----
    let active = true;
    (async () => {
      if (error) throw new Error(String(error));
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) throw exErr;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign-in did not complete. Please try again.");
      if (!active) return;
      setPhase("done");
      setMessage("Signed in");
      const next = params.get("next");
      navigate({ to: next && next.startsWith("/") ? next : "/getting-ready", replace: true });
    })().catch((err) => {
      if (!active) return;
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
      timers.push(window.setTimeout(() => navigate({ to: "/auth", replace: true }), 2500));
    });
    return () => {
      active = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [navigate]);

  const Icon = phase === "done" ? CheckCircle2 : phase === "error" ? AlertCircle : Loader2;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6">
      <Icon
        className={`size-6 ${phase === "working" ? "animate-spin text-muted-foreground" : phase === "done" ? "text-foreground" : "text-destructive"}`}
      />
      <p className="text-center text-[13.5px] text-muted-foreground">{message}</p>
    </div>
  );
}

export default AuthCallbackPage;
