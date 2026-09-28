import {
  executeCopilotApi,
  pollVideoStatus,
  resolveCopilotIntent,
  streamCopilotChat,
  type CopilotActionType,
  type CopilotTier,
} from "@/lib/copilot-api";

export type CopilotRole = "user" | "assistant";

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  text: string;
  at: number;
  imageUrl?: string;
  /** Google Drive file id for stored media — preferred source when present. */
  driveFileId?: string;
  width?: number;
  height?: number;
  videoUrl?: string;
  audioUrl?: string;
  mediaType?: "text" | "image" | "video" | "audio";
  modelName?: string;
  tier?: CopilotTier;
  status?: "thinking" | "streaming" | "generating" | "done";
  activity?: string;
  error?: string;
  attachmentUrl?: string;
  requestId?: string;
  videoStatus?: string;
};

export type CopilotConversation = {
  id: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: CopilotMessage[];
  archivedToDrive?: boolean;
  isCachedLocally?: boolean;
  syncStatus?: "synced" | "syncing" | "idle" | "error";
  lastSyncedAt?: number;
  messageCount?: number;
};

export const COPILOT_MODELS = [
  { id: "copilot-speed", label: "Speed", detail: "Quick answers for everyday questions" },
  { id: "copilot-flash", label: "Flash", detail: "Balanced quality for most tasks" },
  { id: "copilot-heavy", label: "Heavy", detail: "Deep reasoning for complex problems" },
];

/** Old device-wide cache shared by every account on this browser — removed on load. */
const LEGACY_STORAGE_KEY = "hyper:copilot:chats";

type State = {
  chats: CopilotConversation[];
  pendingChatId: string | null;
};

let state: State = { chats: [], pendingChatId: null };
let hydrated = false;
/** Signed-in account that owns the chats currently in memory (null = signed out). */
let owner: string | null = null;
const listeners = new Set<() => void>();

const storageKey = () => (owner ? `hyper:copilot:chats:${owner}` : null);

function readCache(): CopilotConversation[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as CopilotConversation[];
    if (!Array.isArray(parsed)) return [];
    // Replies interrupted by a page reload can't resume; mark them so retry is offered.
    return parsed.map((c) => ({
      ...c,
      messages: (c.messages ?? []).map((m) =>
        m.status && m.status !== "done"
          ? { ...m, status: "done" as const, error: m.text ? undefined : "This reply was interrupted." }
          : m,
      ),
    }));
  } catch {
    return [];
  }
}

/** Switch the in-memory chats to one account, then load that account's saved chats. */
function setOwner(userId: string | null) {
  if (userId === owner) return;
  owner = userId;
  state = { chats: readCache(), pendingChatId: null };
  emit();
  if (!userId) return;
  void import("@/lib/copilot-sync").then(async ({ listDriveArchivedChats }) => {
    const res = await listDriveArchivedChats();
    if (owner !== userId || !res.ok || !res.chats) return;
    mergeRemoteChats(
      res.chats.map((c) => {
        const r = c as typeof c & { title?: string; model?: string; messageCount?: number; updatedAt?: string };
        return {
          sessionId: r.sessionId,
          title: r.title ?? "Chat",
          model: r.model,
          messageCount: r.messageCount ?? 0,
          updatedAt: r.updatedAt ?? r.modifiedTime ?? new Date().toISOString(),
        };
      }),
    );
  });
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  void import("@/config").then(({ supabase }) => {
    void supabase.auth.getSession().then(({ data }) => setOwner(data.session?.user.id ?? null));
    supabase.auth.onAuthStateChange((_event, session) => setOwner(session?.user.id ?? null));
  });
}

function persist() {
  const key = storageKey();
  if (typeof window === "undefined" || !key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state.chats));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: Partial<State>, save = true) {
  state = { ...state, ...next };
  if (save) persist();
  emit();
}

export function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): State {
  hydrate();
  return state;
}

export function getServerSnapshot(): State {
  return { chats: [], pendingChatId: null };
}

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function titleFrom(prompt: string) {
  const clean = prompt.replace(/\s+/g, " ").trim();
  return clean.length > 44 ? `${clean.slice(0, 44)}…` : clean || "New chat";
}

export function normalizeModel(modelId?: string): string {
  if (!modelId) return "copilot-flash";
  if (modelId === "speed" || modelId === "copilot-speed") return "copilot-speed";
  if (modelId === "flash" || modelId === "copilot-flash") return "copilot-flash";
  if (
    modelId === "heavy" ||
    modelId === "copilot-heavy" ||
    modelId === "nvidia-nemotron" ||
    modelId === "pixazo-ltx"
  ) {
    return "copilot-heavy";
  }
  if (modelId === "pixazo-flux" || modelId === "pixazo-inpainting") {
    return "copilot-flash";
  }
  const found = COPILOT_MODELS.find((m) => m.id === modelId);
  return found ? found.id : "copilot-flash";
}

export function createChat(model: string = "copilot-flash"): string {
  hydrate();
  const normalized = normalizeModel(model);
  const now = Date.now();
  const chat: CopilotConversation = {
    id: makeId(),
    title: "New chat",
    model: normalized,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  setState({ chats: [chat, ...state.chats] });
  return chat.id;
}

export function deleteChat(id: string) {
  hydrate();
  setState({ chats: state.chats.filter((chat) => chat.id !== id) });
}

/** Replace the history list with the signed-in account's saved chats (keeps unsaved local drafts). */
export function mergeRemoteChats(
  remote: Array<{ sessionId: string; title: string; model?: string; messageCount: number; updatedAt: string }>,
) {
  hydrate();
  const remoteIds = new Set(remote.map((r) => r.sessionId));
  const local = new Map(state.chats.map((c) => [c.id, c]));
  const merged: CopilotConversation[] = remote.map((r) => {
    const existing = local.get(r.sessionId);
    const updatedAt = new Date(r.updatedAt).getTime() || Date.now();
    if (existing && existing.messages.length > 0) {
      return { ...existing, title: r.title || existing.title, messageCount: r.messageCount };
    }
    return {
      id: r.sessionId,
      title: r.title || "Chat",
      model: normalizeModel(r.model),
      createdAt: existing?.createdAt ?? updatedAt,
      updatedAt,
      messages: [],
      messageCount: r.messageCount,
      archivedToDrive: true,
      isCachedLocally: false,
      syncStatus: "synced",
    };
  });
  // Keep chats that were never saved to the account yet (in progress / unsynced).
  const unsaved = state.chats.filter(
    (c) => !remoteIds.has(c.id) && !c.archivedToDrive && c.syncStatus !== "synced",
  );
  setState({ chats: [...unsaved, ...merged] });
}

export function renameChat(id: string, title: string) {
  hydrate();
  const trimmed = title.trim();
  if (!trimmed || !state.chats.some((chat) => chat.id === id)) return;
  setState({
    chats: state.chats.map((chat) =>
      chat.id === id ? { ...chat, title: trimmed, updatedAt: Date.now() } : chat,
    ),
  });
}

export function clearChats() {
  hydrate();
  setState({ chats: [] });
}

/**
 * Rehydrate a chat session with messages fetched dynamically from Google Drive
 */
export function rehydrateChat(
  chatId: string,
  messages: CopilotMessage[],
  meta?: { title?: string; model?: string; updatedAt?: number },
) {
  hydrate();
  const existing = state.chats.find((c) => c.id === chatId);
  if (existing) {
    setState({
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages,
              title: meta?.title || c.title,
              model: meta?.model || c.model,
              updatedAt: meta?.updatedAt || c.updatedAt,
              isCachedLocally: true,
              archivedToDrive: true,
              syncStatus: "synced",
              lastSyncedAt: Date.now(),
            }
          : c,
      ),
    });
  } else {
    // Session wasn't in state, add it
    const now = meta?.updatedAt || Date.now();
    const newChat: CopilotConversation = {
      id: chatId,
      title: meta?.title || "Archived chat",
      model: normalizeModel(meta?.model),
      createdAt: now,
      updatedAt: now,
      messages,
      isCachedLocally: true,
      archivedToDrive: true,
      syncStatus: "synced",
      lastSyncedAt: Date.now(),
    };
    setState({ chats: [newChat, ...state.chats] });
  }
}

/**
 * Purge local messages cache for an archived session (keeps header/metadata)
 */
export function purgeChatCache(chatId: string) {
  hydrate();
  setState({
    chats: state.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            messages: [], // Clear heavy message array from local storage
            isCachedLocally: false,
            archivedToDrive: true,
            syncStatus: "synced",
          }
        : c,
    ),
  });
}

/**
 * Update sync status for a chat session
 */
export function setChatSyncState(
  chatId: string,
  syncStatus: "synced" | "syncing" | "idle" | "error",
  lastSyncedAt?: number,
) {
  hydrate();
  setState(
    {
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              syncStatus,
              lastSyncedAt: lastSyncedAt ?? c.lastSyncedAt,
              archivedToDrive: syncStatus === "synced" ? true : c.archivedToDrive,
            }
          : c,
      ),
    },
    false,
  );
}

function appendAssistantMessage(chatId: string, message: CopilotMessage) {
  setState({
    chats: state.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, message],
          }
        : c,
    ),
  });
}

function updateMessageStatus(chatId: string, messageId: string, updates: Partial<CopilotMessage>) {
  setState({
    chats: state.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
          }
        : c,
    ),
  });
}

/** Picks the requested output aspect ratio from natural language. Defaults to square. */
export function detectAspect(prompt: string): { aspect: string; width: number; height: number } {
  const p = prompt.toLowerCase();
  if (/\b16\s*[:x]\s*9\b|landscape|widescreen|banner|wallpaper for (desktop|pc)/.test(p))
    return { aspect: "16:9", width: 1280, height: 720 };
  if (/\b9\s*[:x]\s*16\b|portrait|vertical|story|reel|phone wallpaper/.test(p))
    return { aspect: "9:16", width: 720, height: 1280 };
  if (/\b4\s*[:x]\s*3\b/.test(p)) return { aspect: "4:3", width: 1152, height: 864 };
  if (/\b3\s*[:x]\s*4\b|book cover|poster/.test(p))
    return { aspect: "3:4", width: 864, height: 1152 };
  return { aspect: "1:1", width: 1024, height: 1024 };
}

const activeStreams = new Map<string, AbortController>();

export function stopGeneration(chatId: string) {
  activeStreams.get(chatId)?.abort();
}

async function dispatchCopilotCall(
  chatId: string,
  prompt: string,
  model: string,
  attachmentUrl?: string,
) {
  const normalized = normalizeModel(model);
  const tier: CopilotTier =
    normalized === "copilot-speed" ? "speed" : normalized === "copilot-heavy" ? "heavy" : "flash";

  const initial: CopilotMessage = {
    id: makeId(), role: "assistant", text: "", mediaType: "text", status: "thinking", activity: "Thinking", at: Date.now(),
  };
  appendAssistantMessage(chatId, initial);
  let intent;
  try {
    intent = await resolveCopilotIntent(prompt, Boolean(attachmentUrl));
  } catch (error) {
    updateMessageStatus(chatId, initial.id, { status: "done", activity: undefined, error: error instanceof Error ? error.message : "Could not process the request." });
    setState({ pendingChatId: state.pendingChatId === chatId ? null : state.pendingChatId });
    return;
  }
  const action: CopilotActionType = intent.action;
  const cleanPrompt = intent.cleanPrompt || prompt;

  const currentChat = state.chats.find((c) => c.id === chatId);
  const history = (currentChat?.messages ?? [])
    .filter((m) => !m.error && m.text.trim())
    .map((m) => ({ role: m.role, content: m.text }));

  const finish = () =>
    setState({ pendingChatId: state.pendingChatId === chatId ? null : state.pendingChatId });

  const fail = (id: string, message: string) =>
    updateMessageStatus(chatId, id, { status: "done", error: message });

  // ---------- Text chat (streamed) ----------
  if (action === "text") {
    const msg = initial;
    updateMessageStatus(chatId, msg.id, { tier });
    const controller = new AbortController();
    activeStreams.set(chatId, controller);
    let text = "";
    let lastFlush = 0;
    try {
      await streamCopilotChat(
        tier,
        history,
        (e) => {
          if (e.t === "thinking") {
            updateMessageStatus(chatId, msg.id, { status: "thinking", activity: "Thinking" });
          } else if (e.t === "text") {
            text += e.v;
            const now = Date.now();
            if (now - lastFlush > 40) {
              lastFlush = now;
              updateMessageStatus(chatId, msg.id, { text, status: "streaming" });
            }
          } else if (e.t === "retrying") {
            updateMessageStatus(chatId, msg.id, { status: "thinking" });
          } else if (e.t === "activity") {
            updateMessageStatus(chatId, msg.id, { activity: e.v });
          } else if (e.t === "done") {
            updateMessageStatus(chatId, msg.id, { text, status: "done" });
          } else if (e.t === "error") {
            if (text) updateMessageStatus(chatId, msg.id, { text, status: "done", error: e.v });
            else fail(msg.id, e.v);
          }
        },
        controller.signal,
      );
    } catch (err) {
      if (controller.signal.aborted) {
        updateMessageStatus(chatId, msg.id, { text, status: "done" });
      } else {
        fail(
          msg.id,
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      activeStreams.delete(chatId);
      finish();
    }
    return;
  }

  // ---------- Image generation (canvas placeholder, then real image) ----------
  if (action === "text-to-image") {
    const dims = detectAspect(prompt);
    const msg = initial;
    updateMessageStatus(chatId, msg.id, { mediaType: "image", status: "generating", activity: intent.activity, width: dims.width, height: dims.height });
    const result = await executeCopilotApi({ action, prompt: cleanPrompt, aspect: dims.aspect });
    if (!result.ok || !result.imageUrl) {
      fail(msg.id, result.error || "Image creation failed. Please try again.");
    } else {
      updateMessageStatus(chatId, msg.id, {
        status: "done",
        text: intent.displayCaption ? `Here's your image of ${cleanPrompt}.` : "",
        imageUrl: result.imageUrl,
        driveFileId: result.driveFileId,
        width: result.width ?? dims.width,
        height: result.height ?? dims.height,
      });
    }
    finish();
    return;
  }

  // ---------- Other media ----------
  const pendingMsg = initial;
  updateMessageStatus(chatId, pendingMsg.id, { mediaType: action === "text-to-audio" ? "audio" : action === "image-to-video" ? "video" : "text", status: "generating", activity: intent.activity });
  const result = await executeCopilotApi({ action, prompt: cleanPrompt, imageUrl: attachmentUrl });
  if (!result.ok) {
    fail(pendingMsg.id, result.error || "Something went wrong. Please try again.");
    finish();
    return;
  }
  if (result.type === "audio" && result.audioUrl) {
    updateMessageStatus(chatId, pendingMsg.id, {
      status: "done",
      text: intent.displayCaption || "",
      audioUrl: result.audioUrl,
    });
  } else if (result.type === "video") {
    updateMessageStatus(chatId, pendingMsg.id, {
      status: "done",
      requestId: result.requestId,
      videoStatus: "PROCESSING",
    });
    if (result.requestId) {
      void pollVideoStatus(result.requestId, (s) =>
        updateMessageStatus(chatId, pendingMsg.id, { videoStatus: s }),
      ).then((r) => {
        if (r.status === "COMPLETED" && r.videoUrl) {
          updateMessageStatus(chatId, pendingMsg.id, {
            videoUrl: r.videoUrl,
            videoStatus: "COMPLETED",
            text: intent.displayCaption || "",
          });
        } else if (r.error) {
          updateMessageStatus(chatId, pendingMsg.id, { videoStatus: "FAILED", error: r.error });
        }
      });
    }
  } else {
    updateMessageStatus(chatId, pendingMsg.id, {
      status: "done",
      mediaType: "text",
      text: result.text || "",
    });
  }
  finish();
}

/**
 * Regenerate or replace the last assistant response in a chat
 */
export function regenerateLastResponse(chatId: string) {
  hydrate();
  const currentChat = state.chats.find((c) => c.id === chatId);
  if (!currentChat || currentChat.messages.length === 0) return;

  // Find the last user message
  const lastUserMsgIndex = currentChat.messages.map((m) => m.role).lastIndexOf("user");
  if (lastUserMsgIndex === -1) return;

  const lastUserMsg = currentChat.messages[lastUserMsgIndex];
  // Trim conversation so the previous assistant answer is removed
  const trimmedMessages = currentChat.messages.slice(0, lastUserMsgIndex + 1);

  setState({
    chats: state.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            updatedAt: Date.now(),
            messages: trimmedMessages,
          }
        : c,
    ),
    pendingChatId: chatId,
  });

  void dispatchCopilotCall(chatId, lastUserMsg.text, currentChat.model, lastUserMsg.attachmentUrl);
}

export function createAndSendMessage(
  prompt: string,
  model: string = "copilot-flash",
  attachmentUrl?: string,
): string {
  hydrate();
  const text = prompt.trim();
  const normalized = normalizeModel(model);
  const now = Date.now();
  const chatId = makeId();
  const userMessage: CopilotMessage = {
    id: makeId(),
    role: "user",
    text,
    at: now,
    attachmentUrl,
  };
  const chat: CopilotConversation = {
    id: chatId,
    title: titleFrom(text || "New conversation"),
    model: normalized,
    createdAt: now,
    updatedAt: now,
    messages: text || attachmentUrl ? [userMessage] : [],
  };
  setState({ chats: [chat, ...state.chats], pendingChatId: text || attachmentUrl ? chatId : null });

  if (text || attachmentUrl) {
    void dispatchCopilotCall(chatId, text, normalized, attachmentUrl);
  }

  return chatId;
}

export function sendMessage(
  chatId: string,
  prompt: string,
  model: string = "copilot-flash",
  attachmentUrl?: string,
) {
  hydrate();
  const text = prompt.trim();
  if (!text && !attachmentUrl) return;
  const normalized = normalizeModel(model);
  const now = Date.now();
  const userMessage: CopilotMessage = {
    id: makeId(),
    role: "user",
    text,
    at: now,
    attachmentUrl,
  };

  const exists = state.chats.some((chat) => chat.id === chatId);
  let chats: CopilotConversation[];
  if (!exists) {
    const newChat: CopilotConversation = {
      id: chatId,
      title: titleFrom(text || "New conversation"),
      model: normalized,
      createdAt: now,
      updatedAt: now,
      messages: [userMessage],
    };
    chats = [newChat, ...state.chats];
  } else {
    chats = state.chats.map((chat) =>
      chat.id === chatId
        ? {
            ...chat,
            model: normalized,
            title: chat.messages.length === 0 ? titleFrom(text || "Conversation") : chat.title,
            updatedAt: now,
            messages: [...chat.messages, userMessage],
          }
        : chat,
    );
  }
  setState({ chats, pendingChatId: chatId });

  void dispatchCopilotCall(chatId, text, normalized, attachmentUrl);
}
