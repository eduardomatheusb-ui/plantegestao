import "server-only";
import { db } from "@/lib/db";

const DIAS_PARADO = 7;

function inicioMes(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function inicioProxMes(d = new Date()) { return new Date(d.getFullYear(), d.getMonth() + 1, 1); }

export async function carregarIndicadores() {
  const agora = new Date();
  const ini = inicioMes(agora);
  const fim = inicioProxMes(agora);
  const limiteParado = new Date(agora.getTime() - DIAS_PARADO * 24 * 60 * 60 * 1000);

  const [
    cargaRaw, statusRaw, statuses, usuarios,
    totalAtivos, atrasadosCount, paradosCount,
    concluidosComPrazo,
    aguardandoAprovacao, ajustesAprovacao,
    clientesPorStatus,
    receitaMes, aReceberMes, despesaMes,
    atrasadosLista,
  ] = await Promise.all([
    db.job.groupBy({ by: ["responsavelId"], where: { arquivado: false, status: { isConcluido: false } }, _count: { _all: true } }),
    db.job.groupBy({ by: ["statusId"], where: { arquivado: false }, _count: { _all: true } }),
    db.jobStatus.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true, cor: true, isConcluido: true } }),
    db.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    db.job.count({ where: { arquivado: false, status: { isConcluido: false } } }),
    db.job.count({ where: { arquivado: false, status: { isConcluido: false }, prazo: { lt: agora } } }),
    db.job.count({ where: { arquivado: false, status: { isConcluido: false }, atualizadoEm: { lt: limiteParado } } }),
    db.job.findMany({ where: { concluidoEm: { not: null }, prazo: { not: null } }, select: { concluidoEm: true, prazo: true } }),
    db.job.count({ where: { arquivado: false, aprovacaoStatus: "enviado" } }),
    db.job.count({ where: { arquivado: false, aprovacaoStatus: "ajustes" } }),
    db.cliente.groupBy({ by: ["status"], where: { arquivado: false }, _count: { _all: true } }),
    db.lancamento.aggregate({ _sum: { valor: true }, where: { tipo: "RECEITA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim } } }),
    db.lancamento.aggregate({ _sum: { valor: true }, where: { tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { gte: ini, lt: fim } } }),
    db.lancamento.aggregate({ _sum: { valor: true }, where: { tipo: "DESPESA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim } } }),
    db.job.findMany({
      where: { arquivado: false, status: { isConcluido: false }, prazo: { lt: agora } },
      orderBy: { prazo: "asc" }, take: 8,
      select: { id: true, numero: true, titulo: true, prazo: true, cliente: { select: { nome: true, nomeFantasia: true } }, responsavel: { select: { nome: true } } },
    }),
  ]);

  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const carga = cargaRaw
    .map((c) => ({ id: c.responsavelId, nome: c.responsavelId ? nomePorId.get(c.responsavelId) ?? "—" : "Sem responsável", total: c._count._all }))
    .sort((a, b) => b.total - a.total);

  const statusNome = new Map(statuses.map((s) => [s.id, s]));
  const porStatus = statusRaw
    .map((s) => ({ id: s.statusId, nome: statusNome.get(s.statusId)?.nome ?? "—", cor: statusNome.get(s.statusId)?.cor ?? null, isConcluido: statusNome.get(s.statusId)?.isConcluido ?? false, total: s._count._all }))
    .sort((a, b) => (statuses.findIndex((x) => x.id === a.id)) - (statuses.findIndex((x) => x.id === b.id)));

  const noPrazo = concluidosComPrazo.filter((j) => j.concluidoEm! <= j.prazo!).length;
  const pctNoPrazo = concluidosComPrazo.length ? Math.round((noPrazo / concluidosComPrazo.length) * 100) : null;

  const num = (v: unknown) => (v ? Number(v) : 0);

  return {
    carga,
    porStatus,
    totalAtivos,
    atrasadosCount,
    paradosCount,
    diasParado: DIAS_PARADO,
    prazo: { total: concluidosComPrazo.length, noPrazo, pct: pctNoPrazo },
    aprovacao: { aguardando: aguardandoAprovacao, ajustes: ajustesAprovacao },
    clientes: clientesPorStatus.map((c) => ({ status: c.status, total: c._count._all })).sort((a, b) => b.total - a.total),
    financeiro: {
      receita: num(receitaMes._sum.valor),
      aReceber: num(aReceberMes._sum.valor),
      despesa: num(despesaMes._sum.valor),
      saldo: num(receitaMes._sum.valor) - num(despesaMes._sum.valor),
    },
    atrasadosLista,
  };
}
