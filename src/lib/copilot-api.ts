import { supabase } from "@/config";

export type CopilotActionType =
  "text" | "text-to-image" | "image-to-video" | "image-analyse" | "text-to-audio" | "check-video";

export type CopilotTier = "speed" | "flash" | "heavy";

export type CopilotApiResponse = {
  ok: boolean;
  type?: "text" | "image" | "video" | "audio";
  text?: string;
  imageUrl?: string;
  driveFileId?: string;
  width?: number;
  height?: number;
  videoUrl?: string;
  audioUrl?: string;
  requestId?: string;
  status?: "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "ERROR";
  error?: string;
};

/** All Copilot calls go to the app server, which talks to the backend on our behalf. */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** URL for a Google Drive file served live through the app server. */
export function driveFileUrl(fileId: string) {
  return `/api/drive/${encodeURIComponent(fileId)}`;
}

export async function executeCopilotApi(payload: {
  action: CopilotActionType;
  prompt?: string;
  imageUrl?: string;
  aspect?: string;
}): Promise<CopilotApiResponse> {
  try {
    const res = await fetch("/api/copilot/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as CopilotApiResponse;
    if (!res.ok || !json.ok)
      throw new Error(json.error || "Something went wrong. Please try again.");
    return json;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type ChatStreamEvent =
  | { t: "thinking" }
  | { t: "activity"; v: string }
  | { t: "retrying"; attempt: number }
  | { t: "text"; v: string }
  | { t: "done" }
  | { t: "error"; v: string };

export type CopilotIntentResult = {
  action: "text" | "text-to-image" | "image-to-video" | "image-analyse" | "text-to-audio";
  cleanPrompt: string;
  displayCaption?: string;
  activity: string;
};

export async function resolveCopilotIntent(prompt: string, hasAttachment: boolean): Promise<CopilotIntentResult> {
  const res = await fetch("/api/copilot/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ prompt, hasAttachment }),
  });
  const body = await res.json().catch(() => ({})) as Partial<CopilotIntentResult> & { error?: string };
  if (!res.ok || !body.action) throw new Error(body.error || "Could not process the request.");
  return body as CopilotIntentResult;
}

/** Streams a chat reply from the selected Copilot mode. */
export async function streamCopilotChat(
  tier: CopilotTier,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onEvent: (e: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ tier, messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    onEvent({ t: "error", v: body.error || "Something went wrong. Please try again." });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const evt = JSON.parse(line) as ChatStreamEvent;
        if (evt.t === "done" || evt.t === "error") finished = true;
        onEvent(evt);
      } catch {
        /* ignore partial line */
      }
    }
  }
  if (!finished) onEvent({ t: "error", v: "The connection was interrupted. Please try again." });
}

export async function pollVideoStatus(
  requestId: string,
  onProgress?: (status: string) => void,
  maxAttempts = 40,
  intervalMs = 3000,
): Promise<{ status: string; videoUrl?: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`/api/copilot/execute?requestId=${encodeURIComponent(requestId)}`, {
        headers: await authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const status = (data.status || "PROCESSING").toUpperCase();
        onProgress?.(status);
        if (status === "COMPLETED" && data.videoUrl) {
          return { status: "COMPLETED", videoUrl: data.videoUrl };
        }
        if (status === "FAILED" || status === "ERROR") {
          return { status: "FAILED", error: "Video rendering failed." };
        }
      }
    } catch {
      // Continue polling through transient network blips
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { status: "PROCESSING", error: "Video is still processing in background." };
}
