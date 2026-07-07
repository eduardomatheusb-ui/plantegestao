import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "@/lib/utils";

// Permite os elementos/atributos do editor. `style` é liberado aqui e depois
// filtrado pelo plugin abaixo para manter APENAS text-align (evita CSS arbitrário).
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u", "div", "span"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "style"],
  },
};

type Node = { type?: string; properties?: Record<string, unknown>; children?: Node[] };

/** Mantém somente `text-align` no atributo style de cada elemento. */
function apenasAlinhamento() {
  return (tree: Node) => {
    const visitar = (n: Node) => {
      const style = n.properties?.style;
      if (typeof style === "string") {
        const m = style.match(/text-align\s*:\s*(left|right|center|justify)/i);
        if (m) n.properties!.style = `text-align:${m[1].toLowerCase()}`;
        else delete n.properties!.style;
      }
      n.children?.forEach(visitar);
    };
    visitar(tree);
  };
}

const BASE =
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_b]:font-semibold " +
  "[&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:font-semibold " +
  "[&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground";

/** Renderiza conteúdo rich-text (HTML do editor) com segurança. Fonte/altura herdadas do pai. */
export function RichTextView({ texto, className }: { texto: string; className?: string }) {
  return (
    <div className={cn(BASE, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], apenasAlinhamento]}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
