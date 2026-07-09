import "server-only";
import { db } from "@/lib/db";
import { rotuloTipoJob, corTipoJob } from "@/lib/jobs/tipos";

const DIA = 86400000;

export type Produtividade = Awaited<ReturnType<typeof carregarProdutividade>>;

/** Indicadores de fluxo/produtividade dos últimos `dias` (padrão 90). */
export async function carregarProdutividade(dias = 90) {
  const agora = new Date();
  const ini = new Date(agora.getTime() - dias * DIA);
  const bufferEventos = new Date(ini.getTime() - 60 * DIA); // p/ parear "enviado" anterior à janela

  const [concluidos, ativos, gargaloRows, tarefasConcl, tarefasPend, eventos, usuarios, clientes] = await Promise.all([
    db.job.findMany({ where: { arquivado: false, concluidoEm: { gte: ini } }, select: { tipo: true, criadoEm: true, concluidoEm: true, prazo: true, clienteId: true } }),
    db.job.findMany({ where: { arquivado: false, concluidoEm: null }, select: { responsavelId: true, prazo: true } }),
    db.jobTarefa.findMany({ where: { concluida: false, prazo: { lt: agora } }, select: { descricao: true } }),
    db.jobTarefa.findMany({ where: { concluidaEm: { gte: ini }, responsavelId: { not: null } }, select: { responsavelId: true } }),
    db.jobTarefa.findMany({ where: { concluida: false, responsavelId: { not: null } }, select: { responsavelId: true } }),
    db.aprovacaoEvento.findMany({ where: { criadoEm: { gte: bufferEventos } }, select: { jobId: true, acao: true, criadoEm: true, job: { select: { clienteId: true } } }, orderBy: { criadoEm: "asc" } }),
    db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.cliente.findMany({ where: { arquivado: false }, select: { id: true, nome: true, nomeFantasia: true } }),
  ]);

  // ── Operação ──
  const atrasados = ativos.filter((j) => j.prazo && new Date(j.prazo) < agora).length;

  const porTipoMap = new Map<string, { soma: number; qtd: number }>();
  let somaGeral = 0, qtdGeral = 0, noPrazoOk = 0, noPrazoTotal = 0;
  for (const j of concluidos) {
    const dur = (new Date(j.concluidoEm!).getTime() - new Date(j.criadoEm).getTime()) / DIA;
    const e = porTipoMap.get(j.tipo) ?? { soma: 0, qtd: 0 };
    e.soma += dur; e.qtd += 1; porTipoMap.set(j.tipo, e);
    somaGeral += dur; qtdGeral += 1;
    if (j.prazo) { noPrazoTotal += 1; if (new Date(j.concluidoEm!) <= new Date(j.prazo)) noPrazoOk += 1; }
  }
  const porTipo = [...porTipoMap.entries()]
    .map(([tipo, e]) => ({ tipo, label: rotuloTipoJob(tipo), cor: corTipoJob(tipo), dias: e.soma / e.qtd, qtd: e.qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const gargaloMap = new Map<string, number>();
  for (const t of gargaloRows) gargaloMap.set(t.descricao, (gargaloMap.get(t.descricao) ?? 0) + 1);
  const gargalos = [...gargaloMap.entries()].map(([etapa, qtd]) => ({ etapa, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 8);

  // ── Equipe (por responsável) ──
  const contaPor = (rows: { responsavelId: string | null }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) if (r.responsavelId) m.set(r.responsavelId, (m.get(r.responsavelId) ?? 0) + 1);
    return m;
  };
  const jobsAtivosMap = contaPor(ativos);
  const tConclMap = contaPor(tarefasConcl);
  const tPendMap = contaPor(tarefasPend);
  const equipe = usuarios
    .map((u) => ({ id: u.id, nome: u.nome, jobsAtivos: jobsAtivosMap.get(u.id) ?? 0, tarefasConcluidas: tConclMap.get(u.id) ?? 0, tarefasPendentes: tPendMap.get(u.id) ?? 0 }))
    .filter((u) => u.jobsAtivos || u.tarefasConcluidas || u.tarefasPendentes)
    .sort((a, b) => b.jobsAtivos - a.jobsAtivos || b.tarefasConcluidas - a.tarefasConcluidas);

  // ── Clientes (aprovação externa + revisões + no prazo) ──
  const eventosPorJob = new Map<string, { acao: string; criadoEm: Date; clienteId: string | null }[]>();
  for (const e of eventos) {
    const arr = eventosPorJob.get(e.jobId) ?? [];
    arr.push({ acao: e.acao, criadoEm: new Date(e.criadoEm), clienteId: e.job.clienteId });
    eventosPorJob.set(e.jobId, arr);
  }
  const aprovPorCliente = new Map<string, { soma: number; qtd: number }>();
  for (const evs of eventosPorJob.values()) {
    let envio: Date | null = null;
    for (const ev of evs) {
      if (ev.acao === "enviado" || ev.acao === "reenviado") envio = ev.criadoEm;
      else if (ev.acao === "aprovado" && envio && ev.criadoEm >= ini && ev.clienteId) {
        const a = aprovPorCliente.get(ev.clienteId) ?? { soma: 0, qtd: 0 };
        a.soma += (ev.criadoEm.getTime() - envio.getTime()) / DIA; a.qtd += 1;
        aprovPorCliente.set(ev.clienteId, a);
        envio = null;
      }
    }
  }
  const revisoesPorCliente = new Map<string, number>();
  for (const e of eventos) if (e.acao === "ajustes" && new Date(e.criadoEm) >= ini && e.job.clienteId) revisoesPorCliente.set(e.job.clienteId, (revisoesPorCliente.get(e.job.clienteId) ?? 0) + 1);

  const conclPorCliente = new Map<string, { total: number; okPrazo: number; comPrazo: number }>();
  for (const j of concluidos) {
    if (!j.clienteId) continue;
    const c = conclPorCliente.get(j.clienteId) ?? { total: 0, okPrazo: 0, comPrazo: 0 };
    c.total += 1;
    if (j.prazo) { c.comPrazo += 1; if (new Date(j.concluidoEm!) <= new Date(j.prazo)) c.okPrazo += 1; }
    conclPorCliente.set(j.clienteId, c);
  }
  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nomeFantasia || c.nome]));
  const idsClientes = new Set([...aprovPorCliente.keys(), ...revisoesPorCliente.keys(), ...conclPorCliente.keys()]);
  const clientesOut = [...idsClientes].map((id) => {
    const ap = aprovPorCliente.get(id);
    const cc = conclPorCliente.get(id);
    return {
      id, nome: nomeCliente.get(id) ?? "—",
      aprovacaoDias: ap ? ap.soma / ap.qtd : null,
      revisoes: revisoesPorCliente.get(id) ?? 0,
      concluidos: cc?.total ?? 0,
      noPrazoPct: cc && cc.comPrazo ? Math.round((cc.okPrazo / cc.comPrazo) * 100) : null,
    };
  }).sort((a, b) => b.concluidos - a.concluidos || b.revisoes - a.revisoes);

  return {
    dias,
    operacao: {
      concluidos: concluidos.length,
      emAndamento: ativos.length,
      atrasados,
      tempoMedioGeralDias: qtdGeral ? somaGeral / qtdGeral : null,
      noPrazoPct: noPrazoTotal ? Math.round((noPrazoOk / noPrazoTotal) * 100) : null,
      porTipo,
      gargalos,
    },
    equipe,
    clientes: clientesOut,
  };
}
