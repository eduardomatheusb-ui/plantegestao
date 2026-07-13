import "server-only";
import { db } from "@/lib/db";

const num = (v: unknown) => (v == null ? null : Number(v));

export async function listarContratos() {
  const contratos = await db.contrato.findMany({
    orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  return contratos.map((c) => ({ ...c, valorMensal: num(c.valorMensal), valorTotal: num(c.valorTotal) }));
}

export async function obterContrato(id: string) {
  const c = await db.contrato.findUnique({
    where: { id },
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  if (!c) return null;
  return { ...c, valorMensal: num(c.valorMensal), valorTotal: num(c.valorTotal) };
}

/** MRR = soma do fee mensal dos contratos RECORRENTES ativos (pontuais não entram). */
export async function resumoMrr() {
  const ativos = await db.contrato.findMany({ where: { status: "ativo", tipo: "recorrente" }, select: { valorMensal: true } });
  const mrr = ativos.reduce((s, c) => s + Number(c.valorMensal ?? 0), 0);
  return { mrr, arr: mrr * 12, contratosAtivos: ativos.length };
}
