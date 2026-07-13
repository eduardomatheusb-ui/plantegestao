import "server-only";
import { db } from "@/lib/db";

const DIAS_CONTRATO = 30; // contrato vencendo dentro de N dias
const DIAS_PARADO = 30; // cliente sem atividade há N dias

/** Alertas de gestão: contratos vencendo, clientes parados, jobs sem responsável. */
export async function alertasGestao() {
  const agora = new Date();
  const limiteContrato = new Date(agora.getTime() + DIAS_CONTRATO * 24 * 3600 * 1000);
  const limiteParado = new Date(agora.getTime() - DIAS_PARADO * 24 * 3600 * 1000);

  const [contratosVencendo, clientesAtivos, jobsSemResp] = await Promise.all([
    db.contrato.findMany({
      where: { status: "ativo", tipo: "recorrente", dataFim: { not: null, gte: agora, lte: limiteContrato } },
      orderBy: { dataFim: "asc" },
      select: { id: true, dataFim: true, valorMensal: true, cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
    }),
    db.cliente.findMany({
      where: { arquivado: false, status: "ativo" },
      select: {
        id: true, nome: true, nomeFantasia: true,
        jobs: { where: { atualizadoEm: { gte: limiteParado } }, select: { id: true }, take: 1 },
      },
    }),
    db.job.findMany({
      where: { arquivado: false, status: { isConcluido: false }, responsavelId: null },
      orderBy: { criadoEm: "desc" },
      select: { id: true, numero: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
    }),
  ]);

  const clientesParados = clientesAtivos
    .filter((c) => c.jobs.length === 0)
    .map((c) => ({ id: c.id, nome: c.nomeFantasia || c.nome }));

  return {
    contratosVencendo: contratosVencendo.map((c) => ({
      id: c.id,
      cliente: c.cliente?.nomeFantasia || c.cliente?.nome || "—",
      dataFim: c.dataFim!,
      valorMensal: Number(c.valorMensal),
    })),
    clientesParados,
    jobsSemResponsavel: jobsSemResp.map((j) => ({ id: j.id, numero: j.numero, titulo: j.titulo, cliente: j.cliente?.nomeFantasia || j.cliente?.nome || "—" })),
    diasContrato: DIAS_CONTRATO,
    diasParado: DIAS_PARADO,
  };
}
