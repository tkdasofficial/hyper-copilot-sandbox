import { useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { driveFileUrl } from "@/lib/copilot-api";
import { cn } from "@/lib/utils";

/**
 * Image Canvas: a square (1:1) canvas while the image is being created, then
 * the finished image shown at its real dimensions. The image is served live
 * from Google Drive through the app server, with the original link as fallback.
 */
export function ImageCanvas({
  generating,
  driveFileId,
  imageUrl,
  width,
  height,
  alt = "Created image",
}: {
  generating: boolean;
  driveFileId?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
}) {
  const primary = driveFileId ? driveFileUrl(driveFileId) : imageUrl;
  const [src, setSrc] = useState(primary);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSrc(primary);
    setLoaded(false);
  }, [primary]);

  const ratio = !generating && width && height ? `${width} / ${height}` : "1 / 1";
  const portrait = !generating && width && height && height > width;

  return (
    <figure
      className={cn(
        "group relative mt-1 overflow-hidden rounded-[28px] bg-surface-2",
        portrait ? "w-[min(58%,320px)]" : "w-[min(80%,460px)]",
      )}
      style={{ aspectRatio: ratio }}
    >
      {(generating || !loaded) && (
        <div
          aria-label={generating ? "Creating image" : "Loading image"}
          className="absolute inset-0 animate-pulse bg-surface-2"
        />
      )}
      {!generating && src ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (imageUrl && src !== imageUrl) setSrc(imageUrl);
          }}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {!generating && loaded && src ? (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <a href={src} download="copilot-image.png" aria-label="Download" className="grid h-10 w-10 place-items-center rounded-full bg-background/45 text-foreground backdrop-blur-md transition-colors hover:bg-background/70">
            <Download className="h-[18px] w-[18px]" />
          </a>
          <button
            type="button"
            aria-label="Share"
            onClick={async () => {
              const url = new URL(src, window.location.href).href;
              try {
                if (navigator.share) await navigator.share({ title: alt, url });
                else await navigator.clipboard.writeText(url);
              } catch {
                /* share cancelled */
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-background/45 text-foreground backdrop-blur-md transition-colors hover:bg-background/70"
          >
            <Share2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      ) : null}
    </figure>
  );
}

/** Google Drive web preview for any file type (PDF, video, audio, docs) without opening Drive. */
export function DrivePreviewFrame({
  fileId,
  title = "File preview",
}: {
  fileId: string;
  title?: string;
}) {
  return (
    <iframe
      src={`https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`}
      title={title}
      allow="autoplay"
      loading="lazy"
      className="aspect-video w-full rounded-xl border border-border bg-surface"
    />
  );
}
