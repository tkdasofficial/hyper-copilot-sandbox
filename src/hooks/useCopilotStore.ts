import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "@/stores/copilotStore";

export function useCopilotStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
