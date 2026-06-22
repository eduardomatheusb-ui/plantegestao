import "server-only";
import { db } from "@/lib/db";

/**
 * Saúde financeira por cliente no ano: MRR (contratos ativos),
 * margem (receita − despesa atribuída ao cliente) e inadimplência (a receber vencido).
 * Observação: margem usa o valor base dos lançamentos quitados do ano (acréscimos/
 * descontos não entram na agregação). Despesa sem cliente (overhead) não é rateada.
 */
export async function saudeFinanceira(ano: number) {
  const ini = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);
  const agora = new Date();

  const [contratosAtivos, recRaw, despRaw, vencidos, clientes] = await Promise.all([
    db.contrato.findMany({ where: { status: "ativo" }, select: { clienteId: true, valorMensal: true } }),
    db.lancamento.groupBy({
      by: ["clienteId"],
      where: { tipo: "RECEITA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim }, clienteId: { not: null } },
      _sum: { valor: true },
    }),
    db.lancamento.groupBy({
      by: ["clienteId"],
      where: { tipo: "DESPESA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim }, clienteId: { not: null } },
      _sum: { valor: true },
    }),
    db.lancamento.findMany({
      where: { tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { lt: agora }, clienteId: { not: null } },
      select: { id: true, numero: true, titulo: true, clienteId: true, valor: true, acrescimos: true, descontos: true, dataVencimento: true },
      orderBy: { dataVencimento: "asc" },
    }),
    db.cliente.findMany({ where: { arquivado: false }, select: { id: true, nome: true, nomeFantasia: true, status: true } }),
  ]);

  const nomeDe = new Map(clientes.map((c) => [c.id, c.nomeFantasia || c.nome]));

  // MRR
  const mrr = contratosAtivos.reduce((s, c) => s + Number(c.valorMensal), 0);
  const mrrPorCliente = new Map<string, number>();
  for (const c of contratosAtivos) mrrPorCliente.set(c.clienteId, (mrrPorCliente.get(c.clienteId) ?? 0) + Number(c.valorMensal));

  // Margem por cliente
  const receitaDe = new Map<string, number>();
  for (const r of recRaw) if (r.clienteId) receitaDe.set(r.clienteId, Number(r._sum.valor ?? 0));
  const despesaDe = new Map<string, number>();
  for (const d of despRaw) if (d.clienteId) despesaDe.set(d.clienteId, Number(d._sum.valor ?? 0));

  const idsCliente = new Set<string>([...mrrPorCliente.keys(), ...receitaDe.keys(), ...despesaDe.keys()]);
  const porCliente = [...idsCliente].map((id) => {
    const receita = receitaDe.get(id) ?? 0;
    const despesa = despesaDe.get(id) ?? 0;
    return {
      clienteId: id,
      nome: nomeDe.get(id) ?? "—",
      mrr: mrrPorCliente.get(id) ?? 0,
      receita,
      despesa,
      margem: receita - despesa,
      margemPct: receita > 0 ? Math.round(((receita - despesa) / receita) * 100) : null,
    };
  }).sort((a, b) => b.receita - a.receita);

  // Inadimplência
  const dia = 24 * 60 * 60 * 1000;
  const itensInad = vencidos.map((v) => ({
    id: v.id,
    numero: v.numero,
    titulo: v.titulo,
    nome: v.clienteId ? nomeDe.get(v.clienteId) ?? "—" : "—",
    valor: Number(v.valor) + Number(v.acrescimos) - Number(v.descontos),
    diasAtraso: Math.max(0, Math.floor((agora.getTime() - new Date(v.dataVencimento).getTime()) / dia)),
  }));
  const inadimplenciaTotal = itensInad.reduce((s, i) => s + i.valor, 0);

  return {
    ano,
    mrr,
    arr: mrr * 12,
    contratosAtivos: contratosAtivos.length,
    porCliente,
    inadimplencia: { total: inadimplenciaTotal, itens: itensInad },
  };
}
