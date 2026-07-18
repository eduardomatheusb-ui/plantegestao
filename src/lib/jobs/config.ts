import { db } from "@/lib/db";
import { fluxoDoTipo } from "./fluxos";
import { AREA_PADRAO, funcaoCombina } from "./corresponsaveis";

/**
 * Configuração dos tipos de job editável pela tela (Configurações → Fluxos de
 * trabalho), com queda para o PADRÃO DE FÁBRICA definido no código.
 *
 * Regra de leitura: se existe linha salva para o tipo, ela manda — inclusive
 * quando está vazia (o admin quis "nenhuma etapa"). Só quando NÃO existe linha
 * é que vale o padrão de fábrica. É isso que permite personalizar sem deploy
 * sem perder o comportamento de origem de quem nunca mexeu.
 */

/** Etapas que nascem junto com um job deste tipo. */
export async function etapasDoTipo(tipo: string | null | undefined): Promise<string[]> {
  if (!tipo) return [];
  const cfg = await db.tipoJobFluxo.findUnique({ where: { tipo }, select: { etapas: true } });
  if (cfg) return lerEtapas(cfg.etapas);
  return fluxoDoTipo(tipo);
}

/** Termos de função da área responsável pelo tipo (vazio = sem regra). */
export async function funcoesDaArea(tipo: string | null | undefined): Promise<string[]> {
  if (!tipo) return [];
  const cfg = await db.tipoJobArea.findUnique({ where: { tipo }, select: { funcoes: true } });
  if (cfg) return lerFuncoes(cfg.funcoes);
  return AREA_PADRAO[tipo] ?? [];
}

/** IDs de usuários (login ativo) que entram como corresponsáveis do tipo. */
export async function corresponsaveisDaArea(tipo: string | null | undefined): Promise<string[]> {
  const termos = await funcoesDaArea(tipo);
  if (!termos.length) return [];
  const cols = await db.colaborador.findMany({
    where: { ativo: true, usuarioId: { not: null }, usuario: { is: { ativo: true } } },
    select: { funcao: true, usuarioId: true },
  });
  return cols.filter((c) => funcaoCombina(c.funcao, termos)).map((c) => c.usuarioId as string);
}

/** Quem cairia na regra hoje — usado para a prévia na tela de configuração. */
export async function pessoasDaArea(termos: string[]): Promise<{ nome: string; funcao: string }[]> {
  if (!termos.length) return [];
  const cols = await db.colaborador.findMany({
    where: { ativo: true, usuarioId: { not: null }, usuario: { is: { ativo: true } } },
    select: { nome: true, funcao: true },
    orderBy: { nome: "asc" },
  });
  return cols.filter((c) => funcaoCombina(c.funcao, termos)).map((c) => ({ nome: c.nome, funcao: c.funcao ?? "" }));
}

/** Etapas vindas do banco (JSON) → lista limpa. */
function lerEtapas(bruto: string): string[] {
  try {
    const arr: unknown = JSON.parse(bruto);
    if (!Array.isArray(arr)) return [];
    return arr.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** "videomaker, audiovisual" → ["videomaker", "audiovisual"] */
function lerFuncoes(bruto: string): string[] {
  return bruto.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Salva as etapas de um tipo. Lista vazia é salva de propósito (sem etapas). */
export async function salvarEtapas(tipo: string, etapas: string[]): Promise<void> {
  const limpas = etapas.map((e) => e.trim()).filter(Boolean);
  const dados = JSON.stringify(limpas);
  await db.tipoJobFluxo.upsert({ where: { tipo }, create: { tipo, etapas: dados }, update: { etapas: dados } });
}

/** Salva a regra de área de um tipo. Sem termos = apaga a regra (volta ao padrão). */
export async function salvarArea(tipo: string, termos: string[]): Promise<void> {
  const limpos = termos.map((t) => t.trim()).filter(Boolean);
  if (!limpos.length) {
    await db.tipoJobArea.deleteMany({ where: { tipo } });
    return;
  }
  const funcoes = limpos.join(", ");
  await db.tipoJobArea.upsert({ where: { tipo }, create: { tipo, funcoes }, update: { funcoes } });
}

/** Volta um tipo ao padrão de fábrica (apaga a personalização das etapas). */
export async function restaurarEtapasPadrao(tipo: string): Promise<void> {
  await db.tipoJobFluxo.deleteMany({ where: { tipo } });
}
