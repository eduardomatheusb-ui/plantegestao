import "server-only";
import { db } from "@/lib/db";

export async function listarLeads() {
  const leads = await db.lead.findMany({
    orderBy: [{ atualizadoEm: "desc" }],
    include: { responsavel: { select: { nome: true } }, cliente: { select: { id: true, nome: true } } },
  });
  return leads.map((l) => ({ ...l, valorEstimado: l.valorEstimado ? Number(l.valorEstimado) : null }));
}

export type LeadView = Awaited<ReturnType<typeof listarLeads>>[number];

export async function obterLead(id: string) {
  const l = await db.lead.findUnique({ where: { id }, include: { cliente: { select: { id: true, nome: true } } } });
  if (!l) return null;
  return { ...l, valorEstimado: l.valorEstimado ? Number(l.valorEstimado) : null };
}
