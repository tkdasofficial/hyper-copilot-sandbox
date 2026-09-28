import type { CloudProvider } from "../types";

/** No project credentials configured yet — never report connected until real setup exists. */
export const supabaseProvider: CloudProvider = { id: "supabase", name: "Supabase", description: "Postgres, Auth, Storage", connected: false };
