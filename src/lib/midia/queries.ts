import { db } from "@/lib/db";
import type { MidiaStatus } from "@prisma/client";

export async function listarMidiaPlanos(opts: { q?: string; status?: MidiaStatus; clienteId?: string; soDoUsuario?: string } = {}) {
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
  return db.midiaPlano.findMany({
    where,
    orderBy: { numero: "desc" },
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      veiculo: { select: { id: true, nome: true } },
      _count: { select: { grades: true, pecas: true } },
    },
  });
}

export async function obterMidiaPlano(id: string) {
  return db.midiaPlano.findUnique({
    where: { id },
    include: {
      cliente: {
        select: {
          id: true, nome: true, nomeFantasia: true, documento: true,
          inscricaoEstadual: true, inscricaoMunicipal: true, email: true,
          telefone: true, contatoNome: true, endereco: true, cep: true,
        },
      },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      veiculo: {
        select: {
          id: true, nome: true, razaoSocial: true, documento: true,
          inscricaoMunicipal: true, endereco: true, cep: true,
          contatoNome: true, contatoEmail: true, contatoTelefone: true,
        },
      },
      pecas: { orderBy: { codigo: "asc" } },
      grades: {
        orderBy: [{ ano: "asc" }, { mes: "asc" }],
        include: {
          linhas: {
            orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
            include: {
              peca: { select: { id: true, codigo: true, nome: true } },
              insercoes: { select: { dia: true, quantidade: true } },
            },
          },
        },
      },
    },
  });
}

export function listarVeiculosAtivos() {
  return db.veiculo.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, tipo: true, contatoNome: true },
  });
}
