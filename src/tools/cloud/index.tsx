import { useState } from "react";
import { ArrowUpRight, Database, HardDrive, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Build/PageShell";
import { CLOUD_PROVIDERS, type CloudProvider } from "./providers";

type Provider = CloudProvider["id"] | "development";
const providerNames: Record<Provider, string> = { supabase: "Supabase", firebase: "Firebase", development: "Development" };
const supabaseProject = "https://supabase.com/dashboard/project/uqyuwxztevkokzqldibh";

export function CloudTool({ provider }: { provider?: CloudProvider["id"] }) {
  const [selected, setSelected] = useState<Provider>(provider ?? "supabase");
  const [section, setSection] = useState<"database" | "auth">("database");
  const active = selected;
  const isSupabase = active === "supabase";

  return (
    <PageShell title="Cloud">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cloud</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Database and user authentication</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cloud provider">
          {[...CLOUD_PROVIDERS.map((p) => p.id), "development" as const].map((id) => (
            <Button key={id} variant={active === id ? "secondary" : "outline"} size="sm" onClick={() => setSelected(id)} className={`text-[12px] ${active === id ? "border border-border-strong" : "bg-surface"}`}>
              {providerNames[id]}
            </Button>
          ))}
        </div>
        <div className="border-b border-border">
          <div className="flex gap-5" role="tablist" aria-label="Cloud tools">
            <Button role="tab" aria-selected={section === "database"} variant="ghost" onClick={() => setSection("database")} className={`h-9 rounded-none border-b-2 px-0 text-[12px] ${section === "database" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}><Database className="h-4 w-4" /> Database</Button>
            <Button role="tab" aria-selected={section === "auth"} variant="ghost" onClick={() => setSection("auth")} className={`h-9 rounded-none border-b-2 px-0 text-[12px] ${section === "auth" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}><Users className="h-4 w-4" /> Users & Auth</Button>
          </div>
        </div>

        {section === "database" ? (
          <section className="space-y-5" role="tabpanel">
            <div>
              <h3 className="text-[18px] font-semibold">Database</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Stores structured data such as user profiles, game scores, and product catalogs.</p>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-[12px] font-semibold">All Databases</h4>
              <Button size="icon-sm" variant="ghost" aria-label="Refresh databases" title="Database listing is not connected to the builder" disabled><RefreshCw className="h-4 w-4" /></Button>
            </div>
            {isSupabase ? (
              <div className="rounded-md border border-border bg-surface px-4 py-4">
                <div className="flex items-start gap-3"><Database className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" /><div><h4 className="text-[13px] font-semibold">Hyper Copilot · Supabase</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">This app uses Supabase. A database has not been attached to this Builder workspace; usage and tables cannot be shown here yet.</p></div></div>
                <Button variant="outline" size="sm" asChild className="mt-4 bg-background text-[11px]"><a href={supabaseProject} target="_blank" rel="noopener noreferrer">Open Supabase <ArrowUpRight className="h-3.5 w-3.5" /></a></Button>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface px-4 py-5">
                <div className="flex items-start gap-3"><HardDrive className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" /><div><h4 className="text-[13px] font-semibold">{active === "firebase" ? "No Firebase project connected" : "Development database"}</h4><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{active === "firebase" ? "Firebase connection is not available yet. No data is being synced to Firebase." : "Built-in development storage is not set up yet. Nothing entered here is saved as a database."}</p></div></div>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-5" role="tabpanel">
            <div>
              <h3 className="text-[18px] font-semibold">Users & Auth</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Let users log in to your App using a prebuilt login page.</p>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold">Let people sign in to your app</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{isSupabase ? "Hyper Copilot already uses Supabase sign-in. User authentication for apps created in this Builder has not been configured." : active === "firebase" ? "Firebase authentication is not connected to this workspace." : "Development-stage authentication is not set up. No user accounts will be created in this workspace."}</p>
                {isSupabase && <Button variant="outline" size="sm" asChild className="mt-4 bg-background text-[11px]"><a href={`${supabaseProject}/auth/users`} target="_blank" rel="noopener noreferrer">View app users <ArrowUpRight className="h-3.5 w-3.5" /></a></Button>}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

export default CloudTool;
