import type { CloudProvider } from "../types";

/** No project credentials configured yet — never report connected until real setup exists. */
export const firebaseProvider: CloudProvider = { id: "firebase", name: "Firebase", description: "Firestore, Auth, Hosting", connected: false };
