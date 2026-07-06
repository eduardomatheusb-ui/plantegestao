import { db } from "@/lib/db";
import type { ReembolsoStatus, Prisma } from "@prisma/client";

const detalheInclude = {
  solicitante: { select: { id: true, nome: true, email: true } },
  analisadoPor: { select: { id: true, nome: true } },
  lancamento: { select: { id: true, numero: true, status: true } },
  despesas: {
    orderBy: [{ data: "asc" as const }, { ordem: "asc" as const }],
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      job: { select: { id: true, numero: true, titulo: true } },
      centroCusto: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.ReembolsoInclude;

export type ReembolsoDetalhe = Prisma.ReembolsoGetPayload<{ include: typeof detalheInclude }>;
export type ReembolsoDespesaDetalhe = ReembolsoDetalhe["despesas"][number];

/** Soma de todas as despesas do pedido. */
export function totalReembolso(despesas: { valor: Prisma.Decimal }[]): number {
  return despesas.reduce((s, d) => s + Number(d.valor), 0);
}

/** Soma apenas das despesas aprovadas (aprovada != false). */
export function totalAprovado(despesas: { valor: Prisma.Decimal; aprovada: boolean | null }[]): number {
  return despesas.filter((d) => d.aprovada !== false).reduce((s, d) => s + Number(d.valor), 0);
}

export async function obterReembolso(id: string): Promise<ReembolsoDetalhe | null> {
  return db.reembolso.findUnique({ where: { id }, include: detalheInclude });
}

const listaSelect = {
  id: true,
  numero: true,
  status: true,
  competenciaAno: true,
  competenciaMes: true,
  dataPrevistaPagamento: true,
  dataPagamento: true,
  criadoEm: true,
  solicitante: { select: { id: true, nome: true } },
  despesas: { select: { valor: true, aprovada: true } },
} satisfies Prisma.ReembolsoSelect;

export type ReembolsoLista = Prisma.ReembolsoGetPayload<{ select: typeof listaSelect }>;

/** Lista reembolsos com filtros. Sem `solicitanteId` → todos (visão do financeiro). */
export async function listarReembolsos(opts: {
  solicitanteId?: string;
  status?: ReembolsoStatus;
  ano?: number;
  mes?: number;
}): Promise<ReembolsoLista[]> {
  const where: Prisma.ReembolsoWhereInput = {};
  if (opts.solicitanteId) where.solicitanteId = opts.solicitanteId;
  if (opts.status) where.status = opts.status;
  if (opts.ano) where.competenciaAno = opts.ano;
  if (opts.mes) where.competenciaMes = opts.mes;
  return db.reembolso.findMany({
    where,
    orderBy: [{ criadoEm: "desc" }],
    select: listaSelect,
  });
}

/** Contagem de pedidos aguardando análise do financeiro (badge). */
export async function contarAguardandoAnalise(): Promise<number> {
  return db.reembolso.count({ where: { status: { in: ["ENVIADO", "PENDENTE_AJUSTE"] } } });
}

// ── Opções para o formulário de despesa ────────────────────────────────

export async function opcoesDespesa() {
  const [clientes, projetos, jobs, centros] = await Promise.all([
    db.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.projeto.findMany({ where: { arquivado: false }, orderBy: { numero: "desc" }, select: { id: true, numero: true, nome: true } }),
    db.job.findMany({ where: { arquivado: false }, orderBy: { numero: "desc" }, select: { id: true, numero: true, titulo: true } }),
    db.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  return { clientes, projetos, jobs, centros };
}
