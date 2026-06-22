import "server-only";
import { db } from "@/lib/db";

export async function listarContratos() {
  const contratos = await db.contrato.findMany({
    orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  return contratos.map((c) => ({ ...c, valorMensal: Number(c.valorMensal) }));
}

export async function obterContrato(id: string) {
  const c = await db.contrato.findUnique({
    where: { id },
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  if (!c) return null;
  return { ...c, valorMensal: Number(c.valorMensal) };
}

/** MRR = soma do valor mensal dos contratos ativos. */
export async function resumoMrr() {
  const ativos = await db.contrato.findMany({ where: { status: "ativo" }, select: { valorMensal: true } });
  const mrr = ativos.reduce((s, c) => s + Number(c.valorMensal), 0);
  return { mrr, arr: mrr * 12, contratosAtivos: ativos.length };
}
