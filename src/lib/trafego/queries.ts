import "server-only";
import { db } from "@/lib/db";

export async function listarCampanhas(opts: { soDoUsuario?: string } = {}) {
  const campanhas = await db.campanha.findMany({
    where: opts.soDoUsuario ? { criadoPorId: opts.soDoUsuario } : undefined,
    orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
    include: {
      cliente: { select: { id: true, nome: true, nomeFantasia: true } },
      resultados: { select: { investido: true, leads: true } },
    },
  });
  return campanhas.map((c) => {
    const investido = c.resultados.reduce((s, r) => s + Number(r.investido), 0);
    const leads = c.resultados.reduce((s, r) => s + r.leads, 0);
    return {
      id: c.id, nome: c.nome, plataforma: c.plataforma, status: c.status,
      verba: c.verba ? Number(c.verba) : null,
      cliente: c.cliente,
      investido, leads,
    };
  });
}

export type CampanhaListItem = Awaited<ReturnType<typeof listarCampanhas>>[number];

export async function obterCampanha(id: string) {
  const c = await db.campanha.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true, nomeFantasia: true } },
      resultados: { orderBy: { data: "desc" } },
    },
  });
  if (!c) return null;

  const agg = c.resultados.reduce(
    (a, r) => ({
      investido: a.investido + Number(r.investido),
      alcance: a.alcance + r.alcance,
      cliques: a.cliques + r.cliques,
      conversoes: a.conversoes + r.conversoes,
      leads: a.leads + r.leads,
    }),
    { investido: 0, alcance: 0, cliques: 0, conversoes: 0, leads: 0 },
  );

  return {
    ...c,
    verba: c.verba ? Number(c.verba) : null,
    resultados: c.resultados.map((r) => ({ ...r, investido: Number(r.investido) })),
    totais: {
      ...agg,
      cpl: agg.leads > 0 ? agg.investido / agg.leads : null,
      ctr: agg.alcance > 0 ? (agg.cliques / agg.alcance) * 100 : null,
    },
  };
}
