import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { requireUser } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo, type Capacidades, type ModuloKey } from "@/lib/permissoes";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Ajuda — Guia do TREM" };

// Seção (nº do "## N.") → módulo que controla a visibilidade. null = sempre visível.
const SECAO_MODULO: Record<number, ModuloKey | null> = {
  1: null, 2: null, 3: null, 4: "propostas", 5: "projetos", 6: "jobs", 7: "jobs",
  8: "jobs", 9: null, 10: "propostas", 11: "midia", 12: "midia", 13: "producao",
  14: "projetos", 15: "financeiro", 16: null, 17: "financeiro", 18: "financeiro",
  19: "relatorios", 20: "relatorios", 21: "cadastros", 22: "cadastros", 23: "admin",
  24: null, 25: null, 26: null, 27: null, 28: "admin", 29: null,
};

function lerGuia(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "docs", "GUIA-TREM.md"), "utf8");
  } catch {
    return "# Guia do TREM\n\nNão foi possível carregar o guia agora. Tente recarregar a página.";
  }
}

/** Esconde as seções (e as linhas do sumário) de módulos sem acesso do usuário. */
function filtrarGuia(md: string, caps: Capacidades): string {
  const permitido = (n: number) => {
    const m = SECAO_MODULO[n];
    return !m || podeModulo(caps, m, "VER");
  };
  const out: string[] = [];
  let pulando = false;
  for (const l of md.split("\n")) {
    const numHeading = l.match(/^##\s+(\d+)\.\s/);
    if (numHeading) {
      pulando = !permitido(Number(numHeading[1]));
      if (!pulando) out.push(l);
      continue;
    }
    if (l.startsWith("## ")) { pulando = false; out.push(l); continue; } // ## não numerado (Sumário)
    if (pulando) continue;
    const tocLinha = l.match(/^(\d+)\.\s+\[.*\]\(#.*\)/);
    if (tocLinha && !permitido(Number(tocLinha[1]))) continue;
    out.push(l);
  }
  return out.join("\n");
}

export default async function AjudaPage() {
  await requireUser();
  const acesso = await acessoAtual();
  const guia = filtrarGuia(lerGuia(), acesso.caps);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Ajuda" descricao="Guia de uso do TREM — como usar cada parte, boas práticas e exemplos." />
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-neutral max-w-none dark:prose-invert
              prose-headings:font-display prose-h1:text-2xl prose-h2:mt-8 prose-h2:scroll-mt-24 prose-h2:border-b prose-h2:border-border prose-h2:pb-1
              prose-a:text-foreground prose-a:underline prose-strong:text-foreground
              prose-table:text-sm prose-th:text-left"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>{guia}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
