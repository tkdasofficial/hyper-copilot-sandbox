import { Check } from "lucide-react";
import { useAccount } from "@/hooks/useAccount";
import { StudioLayout } from "@/layouts/StudioLayout";
import { cn } from "@/lib/utils";

const plans = [
  {
    tier: "free" as const,
    name: "Starter",
    price: "$0",
    note: "per month",
    features: ["150 credits monthly", "Standard queue", "Personal use license"],
  },
  {
    tier: "pro" as const,
    name: "Pro",
    price: "$29",
    note: "per month",
    highlight: true,
    features: ["Unlimited fast renders", "4K upscaling", "Private models", "Commercial license"],
  },
  {
    tier: "unlimited" as const,
    name: "Studio",
    price: "$89",
    note: "per seat / month",
    features: [
      "Shared workspaces",
      "Brand kits & HEAVEN presets",
      "Priority GPUs",
      "SSO & audit log",
    ],
  },
];

export function PricingPage() {
  const { account } = useAccount();

  return (
    <StudioLayout maxWidth="max-w-5xl" showBackgroundTasks={false}>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((p) => {
          const current = account?.tier === p.tier;
          return (
            <div
              key={p.name}
              className={cn(
                "rounded-3xl border border-border bg-surface/60 p-4",
                (p.highlight || current) && "ring-spectral bg-surface",
              )}
            >
              <p className="flex items-center justify-between text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {p.name}
                {current ? (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] tracking-normal text-foreground">
                    Current plan
                  </span>
                ) : null}
              </p>
              <p className="mt-2.5 text-3xl font-extrabold tracking-tight">{p.price}</p>
              <p className="text-[12px] text-muted-foreground">{p.note}</p>
              <ul className="mt-3 space-y-1.5 text-[13px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-spectral-3" strokeWidth={2.2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={current}
                className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {current ? "Your plan" : `Choose ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </StudioLayout>
  );
}

export default PricingPage;
