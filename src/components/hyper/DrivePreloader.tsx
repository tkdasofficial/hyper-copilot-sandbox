import { useEffect } from "react";
import { driveFileUrl } from "@/lib/copilot-api";
import { getSnapshot } from "@/lib/copilot-store";

/**
 * Invisible background warm-up for Google Drive media. On site load (when the
 * browser is idle) it opens connections to Drive, warms the Drive web preview
 * viewer in a hidden frame, and pre-caches recently created images so they
 * appear instantly in chat. Renders nothing visible.
 */
export function DrivePreloader() {
  useEffect(() => {
    const run = () => {
      for (const href of ["https://drive.google.com", "https://lh3.googleusercontent.com"]) {
        if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = href;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      // Only this account's chats (the store is already scoped to the signed-in user).
      const ids = getSnapshot()
        .chats.flatMap((c) => c.messages ?? [])
        .map((m) => m.driveFileId)
        .filter((id): id is string => !!id)
        .slice(-12);

      for (const id of ids) {
        const img = new Image();
        img.decoding = "async";
        img.src = driveFileUrl(id);
      }

      const warmId = ids[ids.length - 1];
      if (warmId && !document.getElementById("drive-warmup")) {
        const frame = document.createElement("iframe");
        frame.id = "drive-warmup";
        frame.src = `https://drive.google.com/file/d/${warmId}/preview`;
        frame.setAttribute("aria-hidden", "true");
        frame.tabIndex = -1;
        frame.style.cssText =
          "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-9999px;top:0;";
        document.body.appendChild(frame);
        setTimeout(() => frame.remove(), 30000);
      }
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else setTimeout(run, 1500);
  }, []);

  return null;
}
