import { db } from "@/lib/db";
import type { OsStatus } from "@prisma/client";

export async function listarOs(opts: { q?: string; status?: OsStatus; clienteId?: string } = {}) {
  const where: Record<string, unknown> = {};
  if (opts.status) where.status = opts.status;
  if (opts.clienteId) where.clienteId = opts.clienteId;
  if (opts.q) {
    where.OR = [
      { titulo: { contains: opts.q, mode: "insensitive" } },
      { cliente: { nome: { contains: opts.q, mode: "insensitive" } } },
    ];
  }
  return db.ordemServico.findMany({
    where,
    orderBy: { numero: "desc" },
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      _count: { select: { itens: true } },
    },
  });
}

export async function obterOs(id: string) {
  return db.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, nome: true, documento: true, inscricaoEstadual: true,
          inscricaoMunicipal: true, email: true, telefone: true, contatoNome: true, endereco: true, cep: true,
        },
      },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      itens: { orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }] },
    },
  });
}

export async function clientesParaOs() {
  return db.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}

export async function projetosParaOs() {
  return db.projeto.findMany({
    where: { arquivado: false },
    orderBy: { numero: "desc" },
    select: { id: true, numero: true, nome: true, clienteId: true },
  });
}
