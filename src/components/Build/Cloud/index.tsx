import { CloudTool } from "@/tools/cloud";

export function BuildCloud({ provider }: { provider?: "Supabase" | "Firebase" }) {
  return <CloudTool provider={provider ? (provider.toLowerCase() as "supabase" | "firebase") : undefined} />;
}

export default BuildCloud;
