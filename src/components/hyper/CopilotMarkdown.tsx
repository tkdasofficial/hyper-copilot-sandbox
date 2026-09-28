import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders assistant replies with a clear typographic hierarchy. */
export function CopilotMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("text-[14.5px] leading-7 text-foreground break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => (
            <h2 className="mt-7 mb-3 font-display text-[24px] font-semibold leading-8 tracking-tight first:mt-0" {...p} />
          ),
          h2: (p) => (
            <h3 className="mt-6 mb-2.5 font-display text-[19px] font-semibold leading-7 tracking-tight first:mt-0" {...p} />
          ),
          h3: (p) => <h4 className="mt-5 mb-1.5 font-display text-[16px] font-semibold first:mt-0" {...p} />,
          h4: (p) => <h5 className="mt-4 mb-1 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground first:mt-0" {...p} />,
          p: (p) => <p className="my-3 first:mt-0 first:text-[16px] first:leading-7 last:mb-0" {...p} />,
          ul: (p) => (
            <ul className="my-2.5 list-disc space-y-1 pl-5 marker:text-muted-foreground" {...p} />
          ),
          ol: (p) => (
            <ol
              className="my-2.5 list-decimal space-y-1 pl-5 marker:text-muted-foreground"
              {...p}
            />
          ),
          li: (p) => <li className="pl-1" {...p} />,
          strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
          a: (p) => (
            <a
              className="font-medium underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
              {...p}
            />
          ),
          blockquote: (p) => (
            <blockquote
              className="my-4 border-l-2 border-foreground/40 pl-4 font-serif text-[17px] italic leading-7 text-foreground/85"
              {...p}
            />
          ),
          hr: () => <hr className="my-4 border-border" />,
          code: ({ className: c, children, ...rest }) =>
            /language-/.test(c ?? "") ? (
              <code className={cn("font-mono text-[12.5px]", c)} {...rest}>
                {children}
              </code>
            ) : (
              <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[12.5px]" {...rest}>
                {children}
              </code>
            ),
          pre: (p) => (
            <pre
              className="my-3 overflow-x-auto rounded-lg border border-border bg-surface p-3 leading-6"
              {...p}
            />
          ),
          table: (p) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-[13px]" {...p} />
            </div>
          ),
          th: (p) => (
            <th className="border-b border-border bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground" {...p} />
          ),
          td: (p) => <td className="border-b border-border px-3 py-2 align-top" {...p} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
