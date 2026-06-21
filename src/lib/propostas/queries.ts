import { db } from "@/lib/db";
import type { PropostaStatus } from "@prisma/client";

export async function listarPropostas(opts: { q?: string; status?: PropostaStatus; clienteId?: string } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.clienteId) where.clienteId = opts.clienteId;
  if (opts.q) {
    where.OR = [
      { titulo: { contains: opts.q, mode: "insensitive" } },
      { cliente: { nome: { contains: opts.q, mode: "insensitive" } } },
    ];
  }
  return db.proposta.findMany({
    where,
    orderBy: { numero: "desc" },
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      _count: { select: { itens: true } },
    },
  });
}

export async function obterProposta(id: string) {
  return db.proposta.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      criadoPor: { select: { id: true, nome: true } },
      itens: { orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }] },
    },
  });
}

export async function listarProdutosAtivos() {
  return db.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, descricao: true, valorUnit: true },
  });
}
