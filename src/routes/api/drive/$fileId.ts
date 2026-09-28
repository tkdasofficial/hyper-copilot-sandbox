import { createFileRoute } from "@tanstack/react-router";

/**
 * Live Google Drive file proxy. Streams a Drive file through the app server so
 * the page can show it instantly without opening Google Drive. Files are
 * immutable once stored, so responses are cached aggressively by the browser/CDN.
 */
export const Route = createFileRoute("/api/drive/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { edgeUrl, serviceHeaders } = await import("@/lib/copilot.server");
        const id = params.fileId;
        if (!/^[a-zA-Z0-9_-]{10,120}$/.test(id)) return new Response("Bad id", { status: 400 });
        const res = await fetch(
          edgeUrl("upload-to-drive", `?fileId=${encodeURIComponent(id)}&download=true`),
          { headers: serviceHeaders() },
        );
        if (!res.ok || !res.body) return new Response("Not found", { status: res.status || 404 });
        return new Response(res.body, {
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
