import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownDocumentProps {
  markdown: string;
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  return (
    <article className="mx-auto max-w-[72ch] text-[0.9375rem] leading-7 text-ink-muted">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="mb-5 text-2xl font-semibold tracking-[-0.025em] text-ink" {...props} />,
          h2: (props) => <h2 className="mb-3 mt-9 text-xl font-semibold tracking-[-0.02em] text-ink" {...props} />,
          h3: (props) => <h3 className="mb-2 mt-7 text-base font-semibold text-ink" {...props} />,
          p: (props) => <p className="my-4" {...props} />,
          ul: (props) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
          ol: (props) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
          blockquote: (props) => <blockquote className="my-5 border-l border-line-strong pl-4 text-ink" {...props} />,
          code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
            <code className={`rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.88em] text-ink ${className ?? ""}`} {...props} />
          ),
          pre: (props) => <pre className="my-5 overflow-x-auto rounded-xl bg-[#10231f] p-4 text-sm text-white" {...props} />,
          a: (props) => <a className="font-medium text-signal underline" target="_blank" rel="noreferrer noopener" {...props} />,
          table: (props) => <div className="my-5 overflow-x-auto"><table className="w-full border-collapse text-sm" {...props} /></div>,
          th: (props) => <th className="border-b border-line-strong px-3 py-2 text-left font-semibold text-ink" {...props} />,
          td: (props) => <td className="border-b border-line px-3 py-2 align-top" {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
