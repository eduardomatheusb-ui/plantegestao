"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, HelpCircle } from "lucide-react";

// Primeira parte da rota → âncora da seção correspondente no guia (/ajuda).
const AJUDA_ANCORA: Record<string, string> = {
  chat: "3-chat-da-equipe-e-comentários",
  crm: "4-comercial--crm--funil-de-leads",
  projetos: "5-projetos",
  jobs: "6-jobs",
  calendario: "8-calendário-editorial",
  propostas: "9-propostas",
  midia: "10-mídia-pi",
  trafego: "11-tráfego--anúncios",
  producao: "12-produção-e-serviçosos",
  os: "12-produção-e-serviçosos",
  reunioes: "13-atas-de-reunião",
  financeiro: "14-financeiro",
  reembolsos: "15-central-de-reembolsos",
  contratos: "16-contratos-e-saúde-financeira",
  "saude-financeira": "16-contratos-e-saúde-financeira",
  indicadores: "18-indicadores-e-alertas",
  relatorios: "19-relatórios",
  clientes: "20-clientes",
  "clientes-incompletos": "20-clientes",
  cadastros: "21-outros-cadastros",
  configuracoes: "22-administração",
};

const SECAO: Record<string, string> = {
  chat: "Chat",
  ajuda: "Ajuda",
  crm: "CRM",
  calendario: "Calendário editorial",
  indicadores: "Indicadores",
  "saude-financeira": "Saúde financeira",
  contratos: "Contratos",
  projetos: "Projetos",
  jobs: "Jobs",
  propostas: "Propostas",
  midia: "Mídia",
  trafego: "Tráfego / anúncios",
  producao: "Produção",
  os: "Serviços / OS",
  clientes: "Clientes",
  "clientes-incompletos": "Cadastros incompletos",
  reunioes: "Atas de reunião",
  financeiro: "Financeiro",
  reembolsos: "Reembolsos",
  relatorios: "Relatórios",
  cadastros: "Cadastros",
  configuracoes: "Administração",
  notificacoes: "Notificações",
};

const SUBPAGINA: Record<string, string> = {
  novo: "Novo",
  editar: "Editar",
  status: "Status",
  trabalho: "Trabalho",
  financeiro: "Financeiro",
  projetos: "Projetos",
  jobs: "Jobs",
  midia: "Mídia",
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

// Seções sem página índice própria (não viram link).
const SEM_INDICE = new Set(["cadastros", "clientes"]);

/** Barra de navegação: botão "Voltar" + trilha (seção › subpágina › …). */
export function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/dashboard" || pathname === "/") return null;

  const segs = pathname.split("/").filter(Boolean);
  const ancora = AJUDA_ANCORA[segs[0] ?? ""];

  const crumbs = segs.map((seg, i) => {
    const ultimo = i === segs.length - 1;
    const label = i === 0 ? (SECAO[seg] ?? seg) : (SUBPAGINA[seg] ?? "Detalhe");
    // Link só em crumbs intermediários e que apontem para uma página real.
    const semIndice = i === 0 && SEM_INDICE.has(seg);
    const href = ultimo || semIndice ? null : `/${segs.slice(0, i + 1).join("/")}`;
    return { label, href };
  });

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

      <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
            {c.href ? (
              <Link href={c.href} className="hover:text-foreground">{c.label}</Link>
            ) : (
              <span className={i === crumbs.length - 1 ? "text-foreground" : undefined}>{c.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {ancora && (
        <Link
          href={`/ajuda#${ancora}`}
          title="Ajuda desta tela"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Ajuda</span>
        </Link>
      )}
    </div>
  );
}
