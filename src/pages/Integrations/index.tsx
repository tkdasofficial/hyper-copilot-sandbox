import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Facebook, Github, Instagram, Loader2, AtSign, Plug, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";
import { StudioLayout } from "@/layouts/StudioLayout";
import { useMetaConnect } from "@/hooks/useMetaConnect";
import { useYouTubeConnect } from "@/hooks/useYouTubeConnect";
import { useGitHubConnect } from "@/hooks/useGitHubConnect";
import { listGitHubConnections } from "@/lib/github.functions";
import { disconnectSocialAccount, listSocialConnections } from "@/services/social";
import { PROVIDERS, type SocialProvider } from "@/types/social";

const ICONS: Record<SocialProvider, typeof Facebook> = {
  facebook_page: Facebook,
  instagram: Instagram,
  threads: AtSign,
  youtube: Youtube,
};

export function IntegrationsPage() {
  const fetchConnections = useServerFn(listSocialConnections);
  const disconnect = useServerFn(disconnectSocialAccount);
  const queryClient = useQueryClient();
  const { connect, connecting, configured } = useMetaConnect();
  const youtube = useYouTubeConnect();
  const github = useGitHubConnect();
  const fetchGitHub = useServerFn(listGitHubConnections);
  const githubAccounts = useQuery({
    queryKey: ["github-connections"],
    queryFn: () => fetchGitHub(),
  });

  const connections = useQuery({
    queryKey: ["social-connections"],
    queryFn: () => fetchConnections(),
  });

  async function onDisconnect(id: string) {
    try {
      await disconnect({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["social-connections"] });
      await queryClient.invalidateQueries({ queryKey: ["github-connections"] });
      toast.success("Account unlinked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlink the account.");
    }
  }

  return (
    <StudioLayout>
      {!configured ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface px-4 py-3 text-[12.5px] text-muted-foreground">
          Linking is unavailable right now.
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {PROVIDERS.map((provider) => {
          const Icon = ICONS[provider.id];
          const linked = (connections.data ?? []).filter((c) => c.provider === provider.id);
          const isYouTube = provider.id === "youtube";
          const busy = isYouTube ? youtube.connecting : connecting === provider.id;

          return (
            <section
              key={provider.id}
              className="rounded-2xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <p className="truncate text-[13.5px] font-bold">{provider.label}</p>
                  {linked.length ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      Linked
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => (isYouTube ? youtube.connect() : connect(provider.id))}
                  disabled={busy}
                  aria-label={`Connect ${provider.label}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plug className="h-3.5 w-3.5" strokeWidth={2.2} />
                  )}
                  {linked.length ? "Add" : "Connect"}
                </button>
              </div>

              {linked.length ? (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {linked.map((account) => (
                    <li key={account.id} className="flex items-center gap-2.5">
                      {account.avatarUrl ? (
                        <img
                          src={account.avatarUrl}
                          alt={`${account.displayName ?? "Account"} avatar`}
                          className="h-7 w-7 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-surface-2" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                        {account.displayName ?? account.externalId}
                        {account.username ? (
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            @{account.username}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDisconnect(account.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-border-strong hover:text-foreground"
                      >
                        <Trash2 className="h-3 w-3" strokeWidth={2} />
                        Unlink
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
        <section className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2">
              <Github className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p className="truncate text-[13.5px] font-bold">GitHub</p>
              {githubAccounts.data?.length ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Linked
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => github.connect()}
              disabled={github.connecting}
              aria-label="Connect GitHub"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {github.connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plug className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
              {githubAccounts.data?.length ? "Add" : "Connect"}
            </button>
          </div>
          {githubAccounts.data?.length ? (
            <ul className="mt-3 space-y-2 border-t border-border pt-3">
              {githubAccounts.data.map((account) => (
                <li key={account.id} className="flex items-center gap-2.5">
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={`${account.login ?? "GitHub"} avatar`}
                      className="h-7 w-7 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-surface-2" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {account.name ?? account.login}
                    {account.login ? (
                      <span className="ml-1.5 font-normal text-muted-foreground">@{account.login}</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDisconnect(account.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground hover:border-border-strong hover:text-foreground"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2} />
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </StudioLayout>
  );
}

export default IntegrationsPage;
