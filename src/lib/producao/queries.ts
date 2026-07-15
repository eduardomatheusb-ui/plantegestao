import { db } from "@/lib/db";
import type { ProducaoStatus } from "@prisma/client";

export async function listarProducao(opts: { q?: string; status?: ProducaoStatus; clienteId?: string; soDoUsuario?: string } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.soDoUsuario) where.AND = [{ OR: [{ criadoPorId: opts.soDoUsuario }, { responsavelId: opts.soDoUsuario }] }];
  if (opts.status) where.status = opts.status;
  if (opts.clienteId) where.clienteId = opts.clienteId;
  if (opts.q) {
    where.OR = [
      { titulo: { contains: opts.q, mode: "insensitive" } },
      { cliente: { nome: { contains: opts.q, mode: "insensitive" } } },
    ];
  }
  return db.producaoOrdem.findMany({
    where,
    orderBy: { numero: "desc" },
    include: {
      cliente: { select: { id: true, nome: true } },
      fornecedor: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      _count: { select: { itens: true } },
    },
  });
}

export async function obterProducao(id: string) {
  return db.producaoOrdem.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, nome: true, documento: true, inscricaoEstadual: true,
          inscricaoMunicipal: true, email: true, contatoNome: true, endereco: true, cep: true,
        },
      },
      fornecedor: {
        select: {
          id: true, nome: true, razaoSocial: true, documento: true,
          inscricaoMunicipal: true, email: true, contato: true, endereco: true, cep: true,
        },
      },
      projeto: { select: { id: true, numero: true, nome: true } },
      itens: { orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }] },
    },
  });
}
