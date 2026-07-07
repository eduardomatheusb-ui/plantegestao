import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const detalheInclude = {
  cliente: { select: { id: true, nome: true, nomeFantasia: true } },
  criadoPor: { select: { id: true, nome: true } },
  participantes: { select: { usuario: { select: { id: true, nome: true } } } },
} satisfies Prisma.CompromissoInclude;

export type CompromissoDetalhe = Prisma.CompromissoGetPayload<{ include: typeof detalheInclude }>;

/** Compromissos que aparecem/cruzam um mês (para o calendário). */
export async function listarCompromissosMes(ano: number, mes: number): Promise<CompromissoDetalhe[]> {
  const ini = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);
  return db.compromisso.findMany({
    where: {
      // início dentro do mês OU evento que termina dentro/depois cruzando o mês
      OR: [
        { inicio: { gte: ini, lt: fim } },
        { AND: [{ inicio: { lt: ini } }, { fim: { gte: ini } }] },
      ],
    },
    orderBy: [{ inicio: "asc" }],
    include: detalheInclude,
  });
}

export async function obterCompromisso(id: string): Promise<CompromissoDetalhe | null> {
  return db.compromisso.findUnique({ where: { id }, include: detalheInclude });
}

/** Próximos compromissos (para o dashboard / lista rápida). */
export async function proximosCompromissos(limite = 6): Promise<CompromissoDetalhe[]> {
  const agora = new Date();
  return db.compromisso.findMany({
    where: { OR: [{ inicio: { gte: agora } }, { fim: { gte: agora } }] },
    orderBy: [{ inicio: "asc" }],
    take: limite,
    include: detalheInclude,
  });
}

/** Compromissos para o feed .ics (janela ampla). */
export async function compromissosParaFeed() {
  const agora = new Date();
  const ini = new Date(agora.getTime() - 60 * 24 * 3600 * 1000);
  const fim = new Date(agora.getTime() + 400 * 24 * 3600 * 1000);
  return db.compromisso.findMany({
    where: { inicio: { gte: ini, lt: fim } },
    orderBy: [{ inicio: "asc" }],
    include: {
      cliente: { select: { nome: true, nomeFantasia: true } },
    },
  });
}

/** Opções para o formulário (clientes + usuários ativos). */
export async function opcoesCompromisso() {
  const [clientes, usuarios] = await Promise.all([
    db.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  return { clientes, usuarios };
}
