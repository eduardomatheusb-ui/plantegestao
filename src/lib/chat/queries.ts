import "server-only";
import { db } from "@/lib/db";

export const CANAL_GERAL = "geral";

/** Canal de conversa direta entre dois usuários (ids ordenados → estável). */
export function canalDM(a: string, b: string): string {
  return "dm:" + [a, b].sort().join(":");
}

export function participantesDM(canal: string): [string, string] | null {
  if (!canal.startsWith("dm:")) return null;
  const p = canal.slice(3).split(":");
  return p.length === 2 ? [p[0], p[1]] : null;
}

/** O usuário pode ver/escrever no canal? Geral = todos; DM = só os dois. */
export function podeAcessarCanal(canal: string, userId: string): boolean {
  if (canal === CANAL_GERAL) return true;
  const p = participantesDM(canal);
  return !!p && p.includes(userId);
}

export type ChatMensagemView = {
  id: string;
  autorId: string;
  autorNome: string;
  autorAvatar: string | null;
  corpo: string;
  criadoEm: Date;
};

export async function listarMensagens(canal: string, userId: string, limite = 150): Promise<ChatMensagemView[]> {
  if (!podeAcessarCanal(canal, userId)) return [];
  const msgs = await db.chatMensagem.findMany({
    where: { canal },
    orderBy: { criadoEm: "desc" },
    take: limite,
    select: { id: true, autorId: true, corpo: true, criadoEm: true, autor: { select: { nome: true, avatarUrl: true } } },
  });
  return msgs
    .reverse()
    .map((m) => ({ id: m.id, autorId: m.autorId, autorNome: m.autor.nome, autorAvatar: m.autor.avatarUrl, corpo: m.corpo, criadoEm: m.criadoEm }));
}

export type ConversaView = {
  canal: string;
  tipo: "geral" | "dm";
  titulo: string;
  outroId: string | null;
  avatar: string | null;
  ultimaMsg: string | null;
  ultimaEm: Date | null;
  naoLidas: number;
};

/** Lista de conversas para a barra lateral do chat: Geral + uma por colega. */
export async function listarConversas(userId: string): Promise<ConversaView[]> {
  const [usuarios, leituras, msgsGeral, dmMsgs] = await Promise.all([
    db.usuario.findMany({ where: { ativo: true, id: { not: userId } }, select: { id: true, nome: true, avatarUrl: true }, orderBy: { nome: "asc" } }),
    db.chatLeitura.findMany({ where: { usuarioId: userId }, select: { canal: true, ultimaLidaEm: true } }),
    db.chatMensagem.findMany({ where: { canal: CANAL_GERAL }, orderBy: { criadoEm: "desc" }, take: 1, select: { corpo: true, criadoEm: true } }),
    db.chatMensagem.findMany({ where: { canal: { startsWith: "dm:", contains: userId } }, orderBy: { criadoEm: "desc" }, select: { canal: true, corpo: true, criadoEm: true, autorId: true } }),
  ]);

  const lido = new Map(leituras.map((l) => [l.canal, l.ultimaLidaEm]));
  const epoch = new Date(0);

  // Geral
  const geralUlt = msgsGeral[0] ?? null;
  const geralLido = lido.get(CANAL_GERAL) ?? epoch;
  const geralNaoLidas = await db.chatMensagem.count({ where: { canal: CANAL_GERAL, autorId: { not: userId }, criadoEm: { gt: geralLido } } });

  const conversas: ConversaView[] = [
    { canal: CANAL_GERAL, tipo: "geral", titulo: "Geral", outroId: null, avatar: null, ultimaMsg: geralUlt?.corpo ?? null, ultimaEm: geralUlt?.criadoEm ?? null, naoLidas: geralNaoLidas },
  ];

  // Agrupa DMs por canal (já vêm desc, então o 1º de cada canal é o mais recente)
  const ultimaPorCanal = new Map<string, { corpo: string; criadoEm: Date }>();
  const naoLidasPorCanal = new Map<string, number>();
  for (const m of dmMsgs) {
    if (!ultimaPorCanal.has(m.canal)) ultimaPorCanal.set(m.canal, { corpo: m.corpo, criadoEm: m.criadoEm });
    const lim = lido.get(m.canal) ?? epoch;
    if (m.autorId !== userId && m.criadoEm > lim) naoLidasPorCanal.set(m.canal, (naoLidasPorCanal.get(m.canal) ?? 0) + 1);
  }

  for (const u of usuarios) {
    const canal = canalDM(userId, u.id);
    const ult = ultimaPorCanal.get(canal) ?? null;
    conversas.push({
      canal, tipo: "dm", titulo: u.nome, outroId: u.id, avatar: u.avatarUrl,
      ultimaMsg: ult?.corpo ?? null, ultimaEm: ult?.criadoEm ?? null,
      naoLidas: naoLidasPorCanal.get(canal) ?? 0,
    });
  }

  // Ordena: conversas com mensagem primeiro (mais recente no topo), depois o resto por nome
  return conversas.sort((a, b) => {
    if (a.tipo === "geral") return -1;
    if (b.tipo === "geral") return 1;
    if (a.ultimaEm && b.ultimaEm) return b.ultimaEm.getTime() - a.ultimaEm.getTime();
    if (a.ultimaEm) return -1;
    if (b.ultimaEm) return 1;
    return a.titulo.localeCompare(b.titulo);
  });
}

/** Total de mensagens não lidas (badge da navegação). */
export async function contarChatNaoLidas(userId: string): Promise<number> {
  try {
    const leituras = await db.chatLeitura.findMany({ where: { usuarioId: userId }, select: { canal: true, ultimaLidaEm: true } });
    const lido = new Map(leituras.map((l) => [l.canal, l.ultimaLidaEm]));
    const epoch = new Date(0);

    const geral = await db.chatMensagem.count({ where: { canal: CANAL_GERAL, autorId: { not: userId }, criadoEm: { gt: lido.get(CANAL_GERAL) ?? epoch } } });

    const dms = await db.chatMensagem.findMany({
      where: { canal: { startsWith: "dm:", contains: userId }, autorId: { not: userId } },
      select: { canal: true, criadoEm: true },
    });
    let dmTotal = 0;
    for (const m of dms) if (m.criadoEm > (lido.get(m.canal) ?? epoch)) dmTotal++;

    return geral + dmTotal;
  } catch {
    return 0;
  }
}
