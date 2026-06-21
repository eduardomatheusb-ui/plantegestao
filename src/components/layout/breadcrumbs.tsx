"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

const SECAO: Record<string, string> = {
  projetos: "Projetos",
  jobs: "Jobs",
  propostas: "Propostas",
  midia: "Mídia",
  producao: "Produção",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  cadastros: "Cadastros",
  configuracoes: "Administração",
};

const SUBPAGINA: Record<string, string> = {
  novo: "Novo",
  editar: "Editar",
  status: "Status",
  usuarios: "Usuários",
  perfis: "Perfis de acesso",
  empresa: "Dados da empresa",
  clientes: "Clientes",
  fornecedores: "Fornecedores",
  colaboradores: "Colaboradores",
  prestadores: "Prestadores",
  veiculos: "Veículos",
  produtos: "Produtos",
  categorias: "Categorias",
  "centros-custo": "Centros de custo",
  contas: "Contas bancárias",
};

/** Barra de navegação: botão "Voltar" + trilha (seção › subpágina). */
export function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/dashboard" || pathname === "/") return null;

  const segs = pathname.split("/").filter(Boolean);
  const raiz = segs[0];
  const secaoLabel = SECAO[raiz] ?? raiz;
  const secaoTemIndice = !["cadastros", "configuracoes"].includes(raiz);
  // Segunda "âncora": para cadastros/configuracoes é a subseção (lista); senão, "Detalhe".
  const segundo = segs[1];
  const segundoLabel = segundo ? (SUBPAGINA[segundo] ?? "Detalhe") : null;
  const segundoHref = segundo ? `/${raiz}/${segundo}` : null;
  const profundo = segs.length > (secaoTemIndice ? 1 : 2);

  return (
    <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2 text-sm lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </button>

      <span className="text-border" aria-hidden="true">|</span>

      <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-muted-foreground">
        {secaoTemIndice ? (
          <Link href={`/${raiz}`} className="hover:text-foreground">{secaoLabel}</Link>
        ) : (
          <span>{secaoLabel}</span>
        )}
        {segundoLabel && (
          <>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            {profundo && segundoHref ? (
              <Link href={segundoHref} className="hover:text-foreground">{segundoLabel}</Link>
            ) : (
              <span className="text-foreground">{segundoLabel}</span>
            )}
          </>
        )}
        {profundo && (
          <>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-foreground">Detalhe</span>
          </>
        )}
      </nav>
    </div>
  );
}
