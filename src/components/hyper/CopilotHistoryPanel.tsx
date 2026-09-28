import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCopilotStore } from "./useCopilotStore";
import { deleteChat, getSnapshot, mergeRemoteChats, renameChat } from "@/lib/copilot-store";
import { deleteChatFromDrive, listDriveArchivedChats, syncChatToDrive } from "@/lib/copilot-sync";

function when(at: number) {
  return new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CopilotHistoryPanel({ onClose, activeChatId }: { onClose: () => void; activeChatId?: string }) {
  const { chats } = useCopilotStore();
  const navigate = useNavigate();
  const recent = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listDriveArchivedChats()
      .then((res) => {
        if (cancelled || !res.ok || !res.chats) return;
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
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRename = (id: string) => {
    if (!draft.trim()) return;
    renameChat(id, draft);
    setEditingId(null);
    const updated = getSnapshot().chats.find((chat) => chat.id === id);
    if (updated) void syncChatToDrive(updated);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteChatFromDrive(id);
    if (!res.ok) {
      toast.error("Couldn't delete this chat. Please try again.");
      return;
    }
    deleteChat(id);
    if (id === activeChatId) void navigate({ to: "/copilot" });
  };

  return (
    <section
      aria-label="Chat history"
      className="flex min-h-0 flex-1 flex-col bg-background"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-12 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{loading ? "Loading chats…" : "No chats yet."}</p>
          ) : (
            <div className="space-y-1.5 pt-4">
              {recent.map((chat) => (
                <div
                  key={chat.id}
                  className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-1 rounded-lg border border-border bg-surface px-2 py-2"
                >
                  <span aria-hidden="true" />
                  {editingId === chat.id ? (
                    <form className="col-span-2 flex min-w-0 items-center gap-1" onSubmit={(event) => { event.preventDefault(); handleRename(chat.id); }}>
                      <input autoFocus aria-label="Chat title" value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setEditingId(null); }} className="h-8 min-w-0 flex-1 rounded border border-input bg-background px-2 text-[13px] outline-none focus:ring-1 focus:ring-ring" />
                      <Button type="submit" variant="ghost" size="icon" aria-label="Save title" title="Save title" className="h-8 w-8"><Check /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Cancel editing" title="Cancel editing" onClick={() => setEditingId(null)} className="h-8 w-8"><X /></Button>
                    </form>
                  ) : (
                    <>
                      <Link to="/copilot/$chatId" params={{ chatId: chat.id }} onClick={onClose} className="min-w-0 flex-1 text-center">
                        <span className="block truncate text-[13px] font-semibold">{chat.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{chat.messages.length || chat.messageCount || 0} messages · {when(chat.updatedAt)}</span>
                      </Link>
                      <div className="flex items-center justify-end">
                        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${chat.title}`} title={`Edit ${chat.title}`} onClick={() => { setEditingId(chat.id); setDraft(chat.title); }} className="h-8 w-8 shrink-0 text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${chat.title}`} title={`Delete ${chat.title}`} onClick={() => handleDelete(chat.id)} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
