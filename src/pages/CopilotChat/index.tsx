import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Loader2, Plus, RotateCw, Volume2, VolumeX } from "lucide-react";
import { CopilotMarkdown } from "@/components/hyper/CopilotMarkdown";
import { ImageCanvas } from "@/components/hyper/DriveMedia";
import { AppIcon } from "@/components/Navigation/AppIcon";
import { CopilotShell } from "@/components/Copilot/CopilotShell";
import { CopilotComposer } from "@/components/Copilot/CopilotComposer";
import { useCopilotStore } from "@/hooks/useCopilotStore";
import {
  COPILOT_MODELS,
  regenerateLastResponse,
  sendMessage,
  stopGeneration,
} from "@/stores/copilotStore";
import { useChatSyncEngine } from "@/lib/copilot-sync";

export function CopilotChatPage({ chatId }: { chatId: string }) {
  const { chats, pendingChatId } = useCopilotStore();
  const chat = chats.find((item) => item.id === chatId);
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [model, setModel] = useState(chat?.model ?? COPILOT_MODELS[1]?.id ?? "copilot-flash");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const pending = pendingChatId === chatId;

  const { isRestoring, restoreError, triggerAutoSync, restoreNow } = useChatSyncEngine(chatId, {
    autoSync: true,
    debounceMs: 2500,
    purgeOnClose: false,
  });

  // Auto-sync when chat messages change in background
  useEffect(() => {
    if (chat && chat.messages.length > 0 && !pending) {
      triggerAutoSync(chat);
    }
  }, [chat, pending, triggerAutoSync]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUp.current = distanceToBottom > 90;
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom(true);
    }
  }, [chat?.messages.length, chat?.updatedAt, pending]);

  const copyText = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const speakText = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice =
      voices.find(
        (v) => v.name.includes("Natural") || v.name.includes("Edge") || v.name.includes("Online"),
      ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const run = () => {
    const prompt = value.trim();
    if ((!prompt && !attachment) || pending) return;
    isUserScrolledUp.current = false;
    sendMessage(chatId, prompt, model, attachment ?? undefined);
    setValue("");
    setAttachment(null);
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleRegenerate = () => {
    if (pending || !chat || chat.messages.length < 2) return;
    isUserScrolledUp.current = false;
    regenerateLastResponse(chatId);
    setTimeout(() => scrollToBottom(true), 50);
  };

  return (
    <CopilotShell active="chat" chatId={chatId} fullHeight>
      <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
        {/* Center scrollable messages container - only this part scrolls */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-3 pb-36 sm:px-6">
            {isRestoring ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading chat…</p>
              </div>
            ) : restoreError && (!chat || chat.messages.length === 0) ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm font-medium text-foreground">Could not load conversation</p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => restoreNow()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-semibold text-background cursor-pointer"
                  >
                    <RotateCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              </div>
            ) : !chat ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
                <AppIcon className="h-12 w-12 rounded-xl" />
                <p className="text-base font-semibold text-foreground">
                  This chat is no longer available.
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  It may have been deleted or the link has expired. Start a new conversation
                  anytime.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    to="/copilot"
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                    New chat
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-3" aria-live="polite">
                {chat.messages.map((message, index) => {
                  const isLast = index === chat.messages.length - 1;
                  const busy = message.status && message.status !== "done";
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex flex-col items-end gap-2">
                        {message.attachmentUrl ? (
                          <img
                            src={message.attachmentUrl}
                            alt="Attached image"
                            className="max-w-[220px] rounded-xl border border-border object-cover"
                          />
                        ) : null}
                        {message.text ? (
                          <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-[14.5px] leading-6 text-background">
                            {message.text}
                          </p>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <div key={message.id} className="flex min-w-0 flex-col items-start gap-2">

                        {message.status === "thinking" ||
                        message.status === "generating" ? (
                          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                            <span className="flex gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-200ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-100ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                            </span>
                            {message.activity ?? (message.status === "thinking" ? "Thinking" : "Processing")}
                          </div>
                        ) : null}

                        {message.mediaType === "image" &&
                        (message.imageUrl || message.status === "generating") ? (
                          <ImageCanvas
                            generating={message.status === "generating"}
                            driveFileId={message.driveFileId}
                            imageUrl={message.imageUrl}
                            width={message.width}
                            height={message.height}
                          />
                        ) : null}

                        {message.text ? (
                          <div className="w-full">
                            <CopilotMarkdown text={message.text} />
                            {message.status === "streaming" ? (
                              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground" />
                            ) : null}
                          </div>
                        ) : null}

                        {message.mediaType === "audio" && message.audioUrl ? (
                          <audio
                            controls
                            src={message.audioUrl}
                            className="h-9 w-full max-w-[380px]"
                          />
                        ) : null}

                        {message.mediaType === "video" && !busy && !message.error ? (
                          <div className="w-full max-w-[440px] overflow-hidden rounded-xl border border-border bg-surface">
                            {message.videoUrl ? (
                              <video
                                src={message.videoUrl}
                                controls
                                playsInline
                                className="w-full bg-foreground"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 p-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <p className="text-[13px] font-medium text-foreground">
                                  Creating video…
                                </p>
                                <p className="text-[12px] text-muted-foreground">
                                  This can take a minute.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {message.error ? (
                          <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5">
                            <p className="text-[13px] leading-5 text-destructive">
                              {message.error}
                            </p>
                            {isLast && !pending ? (
                              <button
                                type="button"
                                onClick={handleRegenerate}
                                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-surface-2"
                              >
                                <RotateCw className="h-3 w-3" />
                                Retry
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        {!busy && !message.error && message.text ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <button
                              type="button"
                              onClick={() => copyText(message.id, message.text)}
                              aria-label="Copy"
                              title="Copy"
                              className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(message.id, message.text)}
                              aria-label={speakingId === message.id ? "Stop reading" : "Read aloud"}
                              title={speakingId === message.id ? "Stop reading" : "Read aloud"}
                              className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
                            >
                              {speakingId === message.id ? (
                                <VolumeX className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {isLast && !pending ? (
                              <button
                                type="button"
                                onClick={handleRegenerate}
                                aria-label="Regenerate"
                                title="Regenerate"
                                className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-foreground"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </div>

        {chat ? (
          <CopilotComposer
            value={value}
            onValueChange={setValue}
            model={model}
            onModelChange={setModel}
            onSubmit={run}
            onStop={() => stopGeneration(chatId)}
            pending={pending}
            attachment={attachment}
            onAttachmentChange={setAttachment}
          />
        ) : null}
      </div>
    </CopilotShell>
  );
}

export default CopilotChatPage;
