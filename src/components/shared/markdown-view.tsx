import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

/** Renderiza texto Markdown simples (negrito, itálico, listas, links) com estilo de prosa. */
export function MarkdownView({ texto, className }: { texto: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm prose-neutral max-w-none dark:prose-invert",
        "prose-p:my-2 prose-headings:font-display prose-a:text-primary prose-strong:text-foreground",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{texto}</ReactMarkdown>
    </div>
  );
}
