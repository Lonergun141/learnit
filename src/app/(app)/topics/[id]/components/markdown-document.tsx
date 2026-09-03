import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownDocumentProps {
  markdown: string;
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  return (
    <article className="mx-auto max-w-[68ch] text-[0.9375rem] leading-8 text-ink-muted">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="display mb-8 text-[2rem] leading-[1.05]" {...props} />,
          h2: (props) => (
            <h2
              className="display mb-4 mt-16 border-t border-line pt-8 text-[1.15rem] tracking-[0.03em]"
              {...props}
            />
          ),
          h3: (props) => (
            <h3
              className="mb-3 mt-10 font-display text-[0.85rem] font-semibold uppercase tracking-[0.08em] text-ink-soft"
              {...props}
            />
          ),
          p: (props) => <p className="my-5" {...props} />,
          ul: (props) => (
            <ul
              className="my-5 list-none space-y-2.5 pl-0 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.85em] [&>li]:before:h-px [&>li]:before:w-3 [&>li]:before:bg-signal"
              {...props}
            />
          ),
          ol: (props) => (
            <ol
              className="my-5 list-decimal space-y-2.5 pl-6 marker:font-mono marker:text-xs marker:text-signal"
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote className="my-8 border-l-2 border-signal py-1 pl-6 text-ink-soft" {...props} />
          ),
          code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
            <code
              className={`bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em] text-signal ${className ?? ""}`}
              {...props}
            />
          ),
          pre: (props) => (
            <pre
              className="my-8 overflow-x-auto border border-line bg-surface p-6 font-mono text-[0.8125rem] leading-6 text-ink-soft"
              {...props}
            />
          ),
          a: (props) => (
            <a
              className="text-signal underline decoration-signal/40 underline-offset-4 hover:decoration-signal"
              target="_blank"
              rel="noreferrer noopener"
              {...props}
            />
          ),
          hr: () => <hr className="my-12 border-line" />,
          table: (props) => (
            <div className="my-8 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border-b border-line-strong px-3 py-3 text-left font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint"
              {...props}
            />
          ),
          td: (props) => <td className="border-b border-line px-3 py-3 align-top" {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
