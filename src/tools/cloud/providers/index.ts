import { supabaseProvider } from "./supabase";
import { firebaseProvider } from "./firebase";

export const CLOUD_PROVIDERS = [supabaseProvider, firebaseProvider];
export type { CloudProvider } from "./types";
