import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders instructor-authored Markdown (GFM). react-markdown never injects raw HTML,
 * so lesson content cannot smuggle scripts into the page.
 */

/** react-markdown passes its AST node as a prop; it must not reach the DOM. */
function omitNode<T extends object>(props: T): Omit<T, "node"> {
  const rest = { ...props } as T & { node?: unknown };
  delete rest.node;
  return rest;
}

const components: Components = {
  h1: (props) => <h2 className="mt-8 text-xl font-semibold tracking-tight first:mt-0" {...omitNode(props)} />,
  h2: (props) => <h3 className="mt-8 text-lg font-semibold tracking-tight first:mt-0" {...omitNode(props)} />,
  h3: (props) => <h4 className="mt-6 text-base font-semibold first:mt-0" {...omitNode(props)} />,
  p: (props) => <p className="leading-7 text-foreground/90 [&:not(:first-child)]:mt-4" {...omitNode(props)} />,
  ul: (props) => <ul className="mt-4 ml-5 list-disc space-y-1.5 marker:text-subtle" {...omitNode(props)} />,
  ol: (props) => <ol className="mt-4 ml-5 list-decimal space-y-1.5 marker:text-subtle" {...omitNode(props)} />,
  li: (props) => <li className="pl-1 leading-7 text-foreground/90" {...omitNode(props)} />,
  a: (props) => (
    <a className="font-medium text-brand-soft underline underline-offset-4 hover:text-foreground" target="_blank" rel="noopener noreferrer" {...omitNode(props)} />
  ),
  blockquote: (props) => <blockquote className="mt-4 border-l-2 border-border-strong pl-4 text-muted-foreground" {...omitNode(props)} />,
  hr: () => <hr className="my-8 border-border" />,
  code: ({ className, ...props }) => (
    <code className={cn("rounded-md bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.85em]", className)} {...omitNode(props)} />
  ),
  pre: (props) => (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface-sunken p-4 font-mono text-sm leading-6 [&_code]:bg-transparent [&_code]:p-0" {...omitNode(props)} />
  ),
  table: (props) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...omitNode(props)} />
    </div>
  ),
  th: (props) => <th className="border-b border-border bg-surface-sunken px-3 py-2 text-left font-medium" {...omitNode(props)} />,
  td: (props) => <td className="border-b border-border px-3 py-2 last:border-b-0" {...omitNode(props)} />,
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-[15px]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
