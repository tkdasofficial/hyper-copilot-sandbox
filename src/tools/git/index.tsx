import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, ChevronDown, Cloud, FileDiff, GitBranch, GitCommitHorizontal, Github, History, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Build/PageShell";
import { GIT_PROVIDERS } from "./providers";
import { listGitHubConnections } from "@/lib/github.functions";
import { useGitHubConnect } from "@/hooks/useGitHubConnect";

export function GitTool() {
  const fetchAccounts = useServerFn(listGitHubConnections);
  const accounts = useQuery({ queryKey: ["github-connections"], queryFn: () => fetchAccounts(), retry: false });
  const github = useGitHubConnect();
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [showProviders, setShowProviders] = useState(false);
  const linked = accounts.data ?? [];

  return (
    <PageShell title="Git">
      <div className="mx-auto w-full max-w-2xl space-y-7 px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Git</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Version control for your App</p>
        </div>

        <div className="relative flex items-center justify-between gap-2 border-b border-border pb-4">
          <Button variant="outline" size="sm" disabled title="No repository has been added to this workspace" className="max-w-full gap-2 bg-surface text-[12px]">
            <GitBranch className="h-4 w-4" /> No branch <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" aria-expanded={showProviders} onClick={() => setShowProviders((open) => !open)} className="text-[12px]">
              <Github className="h-4 w-4" /> GitHub <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {showProviders && (
              <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-md border border-border bg-popover p-1 shadow-lg">
                {GIT_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between rounded px-3 py-2 text-[12px] text-foreground">
                    {provider.name}{provider.status === "coming-soon" && <span className="text-[10px] text-muted-foreground">Coming Soon</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4 border-b border-border pb-6">
          <div className="flex items-start gap-3">
            <Github className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold">No remote repositories configured</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">To push changes, create a new repository or connect an existing one. This workspace does not have a Git remote yet.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-0 sm:pl-8">
            <Button size="sm" asChild className="text-[12px]">
              <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" title="Create a repository on GitHub (does not attach it to this workspace)"><Plus className="h-4 w-4" /> Create Remote <ArrowUpRight className="h-3.5 w-3.5" /></a>
            </Button>
            <Button size="sm" variant="outline" onClick={() => github.connect()} disabled={github.connecting || !github.configured} className="bg-surface text-[12px]">
              {github.connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />} Connect Existing
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Create Remote opens GitHub. Connect Existing links your GitHub account; attaching a repository to this workspace is not available yet.</p>
          {accounts.isLoading ? (
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking GitHub connection…</p>
          ) : accounts.isError ? (
            <div className="flex items-center gap-2 text-[11px] text-destructive">Could not check linked accounts. <Button variant="ghost" size="icon-sm" aria-label="Retry GitHub connection" onClick={() => void accounts.refetch()}><RefreshCw className="h-3.5 w-3.5" /></Button></div>
          ) : linked.length ? (
            <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><Github className="h-3.5 w-3.5" /> Linked as {linked.map((a) => `@${a.login ?? a.name ?? "GitHub account"}`).join(", ")}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">No GitHub account linked.</p>
          )}
          <div className="flex items-center justify-center gap-2 rounded-md bg-surface px-3 py-3 text-[12px] text-muted-foreground"><Cloud className="h-4 w-4" /> No remotes to push to</div>
        </section>

        <section className="space-y-4 border-b border-border pb-6">
          <div className="flex items-center gap-2"><GitCommitHorizontal className="h-4 w-4 text-muted-foreground" /><h3 className="text-[15px] font-semibold">Commit</h3></div>
          <div className="space-y-3">
            <label className="block text-[11px] font-semibold text-muted-foreground">Message
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Commit message" className="mt-1.5 h-9 w-full rounded-md border border-input bg-surface px-3 text-[12px] font-normal text-foreground outline-none focus:border-ring" />
            </label>
            <label className="block text-[11px] font-semibold text-muted-foreground">Summary
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Optional description" rows={2} className="mt-1.5 w-full resize-none rounded-md border border-input bg-surface px-3 py-2 text-[12px] font-normal text-foreground outline-none focus:border-ring" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-[12px] font-semibold"><FileDiff className="h-4 w-4 text-muted-foreground" /> Review Changes <span className="text-muted-foreground">0 changes</span></h4>
            <div className="flex gap-1"><Button variant="ghost" size="sm" disabled className="text-[11px]">Discard All</Button><Button variant="ghost" size="sm" disabled className="text-[11px]">Stage All</Button></div>
          </div>
          <div className="rounded-md border border-border bg-surface px-4 py-6 text-center text-[12px] text-muted-foreground">No tracked changes to review</div>
          <p className="text-[11px] text-muted-foreground">Committing will automatically stage your changes once a repository is attached.</p>
          <Button disabled title="Connect a repository before committing" className="w-full text-[12px]">Stage and commit all changes</Button>
        </section>

        <section className="space-y-3 pb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold"><History className="h-4 w-4 text-muted-foreground" /> Commit history</h3>
          <p className="py-4 text-center text-[12px] text-muted-foreground">No commit history for this workspace yet</p>
        </section>
      </div>
    </PageShell>
  );
}

export default GitTool;
