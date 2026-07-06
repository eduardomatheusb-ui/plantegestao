import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Ajuda — Guia do TREM" };

function lerGuia(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "docs", "GUIA-TREM.md"), "utf8");
  } catch {
    return "# Guia do TREM\n\nNão foi possível carregar o guia agora. Tente recarregar a página.";
  }
}

export default async function AjudaPage() {
  await requireUser();
  const guia = lerGuia();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Ajuda" descricao="Guia de uso do TREM — como usar cada parte, boas práticas e exemplos." />
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-neutral max-w-none dark:prose-invert
              prose-headings:font-display prose-h1:text-2xl prose-h2:mt-8 prose-h2:border-b prose-h2:border-border prose-h2:pb-1
              prose-a:text-foreground prose-a:underline prose-strong:text-foreground
              prose-table:text-sm prose-th:text-left"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{guia}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
