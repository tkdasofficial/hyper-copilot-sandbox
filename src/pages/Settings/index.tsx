import { useAccount } from "@/hooks/useAccount";
import { Monitor, Moon, Sun } from "lucide-react";
import { StudioLayout } from "@/layouts/StudioLayout";
import { useTheme, type Theme } from "@/components/Navigation/ThemeProvider";
import { cn } from "@/lib/utils";

const themeOptions: { value: Theme; label: string; note: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", note: "Follows your device", icon: Monitor },
  { value: "light", label: "Light", note: "Bright white canvas", icon: Sun },
  { value: "dark", label: "Dark", note: "Studio black canvas", icon: Moon },
];

const planLabel: Record<string, string> = {
  free: "Starter",
  pro: "Pro",
  unlimited: "Studio",
};

export function SettingsPage() {
  const { theme, resolved, setTheme } = useTheme();
  const { account } = useAccount();

  return (
    <StudioLayout showBackgroundTasks={false}>
      <section
        aria-labelledby="appearance"
        className="rounded-3xl border border-border bg-surface/60 p-4"
      >
        <h2 id="appearance" className="text-[15px] font-bold">
          Appearance
        </h2>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Currently rendering in <span className="font-semibold text-foreground">{resolved}</span>{" "}
          mode.
        </p>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {themeOptions.map((o) => {
            const Icon = o.icon;
            const active = theme === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(o.value)}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-colors",
                  active
                    ? "border-border-strong bg-surface-2 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
                <span className="text-[13.5px] font-bold text-foreground">{o.label}</span>
                <span className="text-[11.5px]">{o.note}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="account"
        className="mt-3 rounded-3xl border border-border bg-surface/60 p-4"
      >
        <h2 id="account" className="text-[15px] font-bold">
          Account
        </h2>
        <dl className="mt-3 divide-y divide-border text-[13px]">
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-semibold">{account?.name || "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-semibold">{account?.email || "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-semibold">
              {account ? (planLabel[account.tier] ?? account.tier) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-muted-foreground">Credits left</dt>
            <dd className="font-semibold">
              {account
                ? `${account.credits.toLocaleString()} of ${account.quota.toLocaleString()}`
                : "—"}
            </dd>
          </div>
          {account?.periodEnd ? (
            <div className="flex items-center justify-between py-2">
              <dt className="text-muted-foreground">Renews</dt>
              <dd className="font-semibold">{new Date(account.periodEnd).toLocaleDateString()}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </StudioLayout>
  );
}

export default SettingsPage;
