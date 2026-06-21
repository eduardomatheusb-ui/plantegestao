import { db } from "@/lib/db";

/** Projetos ativos: agregados por situação e por cliente (contagem + budget). */
export async function relatorioProjetos() {
  const projetos = await db.projeto.findMany({
    where: { arquivado: false },
    select: { status: true, budget: true, cliente: { select: { nome: true } } },
  });
  const porSituacao = new Map<string, { qtd: number; budget: number }>();
  const porCliente = new Map<string, { qtd: number; budget: number }>();
  for (const p of projetos) {
    const b = Number(p.budget ?? 0);
    const s = porSituacao.get(p.status) ?? { qtd: 0, budget: 0 };
    s.qtd++; s.budget += b; porSituacao.set(p.status, s);
    const c = porCliente.get(p.cliente.nome) ?? { qtd: 0, budget: 0 };
    c.qtd++; c.budget += b; porCliente.set(p.cliente.nome, c);
  }
  return {
    total: projetos.length,
    budgetTotal: projetos.reduce((a, p) => a + Number(p.budget ?? 0), 0),
    porSituacao: [...porSituacao.entries()].map(([status, v]) => ({ status, ...v })),
    porCliente: [...porCliente.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.qtd - a.qtd),
  };
}

/** Jobs ativos: por status, por responsável e % concluído no prazo. */
export async function relatorioJobs() {
  const jobs = await db.job.findMany({
    where: { arquivado: false },
    select: {
      prazo: true, concluidoEm: true,
      status: { select: { nome: true, cor: true, isConcluido: true } },
      responsavel: { select: { nome: true } },
    },
  });
  const ehNoPrazo = (j: (typeof jobs)[number]) => !!j.concluidoEm && (!j.prazo || j.concluidoEm <= j.prazo);

  const porStatus = new Map<string, { qtd: number; cor: string | null }>();
  const porResp = new Map<string, { qtd: number; concluidos: number; noPrazo: number }>();
  let concluidos = 0, noPrazoTotal = 0;

  for (const j of jobs) {
    const st = porStatus.get(j.status.nome) ?? { qtd: 0, cor: j.status.cor };
    st.qtd++; porStatus.set(j.status.nome, st);

    const rn = j.responsavel?.nome ?? "— sem responsável";
    const r = porResp.get(rn) ?? { qtd: 0, concluidos: 0, noPrazo: 0 };
    r.qtd++;
    if (j.status.isConcluido) {
      r.concluidos++; concluidos++;
      if (ehNoPrazo(j)) { r.noPrazo++; noPrazoTotal++; }
    }
    porResp.set(rn, r);
  }

  return {
    total: jobs.length,
    concluidos,
    pctNoPrazo: concluidos ? Math.round((noPrazoTotal / concluidos) * 100) : null,
    porStatus: [...porStatus.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.qtd - a.qtd),
    porResponsavel: [...porResp.entries()]
      .map(([nome, v]) => ({ nome, ...v, pct: v.concluidos ? Math.round((v.noPrazo / v.concluidos) * 100) : null }))
      .sort((a, b) => b.qtd - a.qtd),
  };
}

/** Planos de mídia: investimento por veículo e por cliente. */
export async function relatorioMidia() {
  const planos = await db.midiaPlano.findMany({
    select: { valorTotal: true, veiculo: { select: { nome: true } }, cliente: { select: { nome: true } } },
  });
  const porVeiculo = new Map<string, { qtd: number; total: number }>();
  const porCliente = new Map<string, { qtd: number; total: number }>();
  let total = 0;
  for (const p of planos) {
    const v = Number(p.valorTotal);
    total += v;
    const vn = p.veiculo?.nome ?? "— sem veículo";
    const ve = porVeiculo.get(vn) ?? { qtd: 0, total: 0 }; ve.qtd++; ve.total += v; porVeiculo.set(vn, ve);
    const cn = p.cliente.nome;
    const ce = porCliente.get(cn) ?? { qtd: 0, total: 0 }; ce.qtd++; ce.total += v; porCliente.set(cn, ce);
  }
  return {
    qtd: planos.length,
    total,
    porVeiculo: [...porVeiculo.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.total - a.total),
    porCliente: [...porCliente.entries()].map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.total - a.total),
  };
}
