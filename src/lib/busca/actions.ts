"use server";

import { db } from "@/lib/db";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";

export type BuscaItem = { id: string; titulo: string; sub: string | null; url: string };
export type BuscaGrupo = { modulo: string; label: string; itens: BuscaItem[] };

const LIMITE = 6;

/** Busca unificada nos módulos que o usuário pode ver. Texto livre ou nº. */
export async function buscarGlobal(termo: string): Promise<BuscaGrupo[]> {
  const q = termo.trim();
  if (q.length < 2) return [];

  const { caps } = await acessoAtual();
  const num = /^\d+$/.test(q) ? Number(q) : undefined;
  const texto = { contains: q, mode: "insensitive" as const };
  const grupos: BuscaGrupo[] = [];

  const ver = (m: Parameters<typeof podeModulo>[1]) => podeModulo(caps, m, "VER");

  if (ver("projetos")) {
    const r = await db.projeto.findMany({
      where: { arquivado: false, OR: [{ nome: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, nome: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { atualizadoEm: "desc" },
    });
    if (r.length) grupos.push({ modulo: "projetos", label: "Projetos", itens: r.map((p) => ({ id: p.id, titulo: `#${p.numero} · ${p.nome}`, sub: p.cliente?.nomeFantasia || p.cliente?.nome || null, url: `/projetos/${p.id}` })) });
  }

  if (ver("jobs")) {
    const r = await db.job.findMany({
      where: { arquivado: false, OR: [{ titulo: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { atualizadoEm: "desc" },
    });
    if (r.length) grupos.push({ modulo: "jobs", label: "Jobs", itens: r.map((j) => ({ id: j.id, titulo: `#${j.numero} · ${j.titulo}`, sub: j.cliente?.nomeFantasia || j.cliente?.nome || null, url: `/jobs/${j.id}` })) });
  }

  if (ver("propostas")) {
    const r = await db.proposta.findMany({
      where: { OR: [{ titulo: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, versao: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { atualizadoEm: "desc" },
    });
    if (r.length) grupos.push({ modulo: "propostas", label: "Propostas", itens: r.map((p) => ({ id: p.id, titulo: `#${p.numero}.${p.versao} · ${p.titulo}`, sub: p.cliente?.nomeFantasia || p.cliente?.nome || null, url: `/propostas/${p.id}` })) });
  }

  if (ver("midia")) {
    const r = await db.midiaPlano.findMany({
      where: { OR: [{ titulo: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { atualizadoEm: "desc" },
    });
    if (r.length) grupos.push({ modulo: "midia", label: "Mídia", itens: r.map((m) => ({ id: m.id, titulo: `#${m.numero} · ${m.titulo}`, sub: m.cliente?.nomeFantasia || m.cliente?.nome || null, url: `/midia/${m.id}` })) });
  }

  if (ver("producao")) {
    const r = await db.producaoOrdem.findMany({
      where: { OR: [{ titulo: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { atualizadoEm: "desc" },
    });
    if (r.length) grupos.push({ modulo: "producao", label: "Produção", itens: r.map((o) => ({ id: o.id, titulo: `#${o.numero} · ${o.titulo}`, sub: o.cliente?.nomeFantasia || o.cliente?.nome || null, url: `/producao/${o.id}` })) });
  }

  if (ver("os")) {
    const r = await db.ordemServico.findMany({
      where: { OR: [{ titulo: texto }, ...(num ? [{ numero: num }] : [])] },
      select: { id: true, numero: true, titulo: true, cliente: { select: { nome: true, nomeFantasia: true } } },
      take: LIMITE, orderBy: { dataEmissao: "desc" },
    });
    if (r.length) grupos.push({ modulo: "os", label: "Serviços / OS", itens: r.map((o) => ({ id: o.id, titulo: `OS #${o.numero} · ${o.titulo}`, sub: o.cliente?.nomeFantasia || o.cliente?.nome || null, url: `/os/${o.id}` })) });
  }

  if (ver("cadastros")) {
    const r = await db.cliente.findMany({
      where: { arquivado: false, OR: [{ nome: texto }, { nomeFantasia: texto }, { documento: texto }] },
      select: { id: true, nome: true, nomeFantasia: true },
      take: LIMITE, orderBy: { nome: "asc" },
    });
    if (r.length) grupos.push({ modulo: "cadastros", label: "Clientes", itens: r.map((c) => ({ id: c.id, titulo: c.nomeFantasia || c.nome, sub: c.nomeFantasia ? c.nome : null, url: `/cadastros/clientes/${c.id}` })) });
  }

  return grupos;
}
