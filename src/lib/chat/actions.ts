"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { notificar, notificarMuitos } from "@/lib/notificacoes";
import { listarMensagens, listarConversas, contarChatNaoLidas, podeAcessarCanal, participantesDM, CANAL_GERAL, type ChatMensagemView, type ConversaView } from "./queries";

async function userOrThrow() {
  const u = await getSessionUser();
  if (!u) throw new Error("Não autenticado.");
  return u;
}

/** Envia uma mensagem ao canal (geral ou DM). Notifica o destinatário em DM. */
export async function enviarMensagem(canal: string, corpo: string): Promise<void> {
  const user = await userOrThrow();
  const texto = corpo.trim();
  if (!texto) return;
  if (!podeAcessarCanal(canal, user.id)) throw new Error("Canal indisponível.");

  await db.chatMensagem.create({ data: { canal, autorId: user.id, corpo: texto.slice(0, 4000) } });
  // Quem enviou já leu o que enviou.
  await marcarCanalLido(canal);

  // DM: avisa o outro participante (notificação + e-mail).
  const p = participantesDM(canal);
  if (p) {
    const outro = p.find((id) => id !== user.id);
    if (outro) {
      await notificar({
        usuarioId: outro,
        atorId: user.id,
        tipo: "chat",
        titulo: `Nova mensagem de ${user.name ?? "um colega"}`,
        descricao: texto.slice(0, 140),
        entidadeTipo: "chat",
        entidadeId: canal,
        url: `/chat?c=${encodeURIComponent(canal)}`,
      });
    }
  } else if (canal === CANAL_GERAL) {
    // Geral: avisa o time no sino (sem e-mail, pra não floodar).
    const equipe = await db.usuario.findMany({ where: { ativo: true, id: { not: user.id } }, select: { id: true } });
    await notificarMuitos(equipe.map((u) => u.id), {
      atorId: user.id,
      tipo: "chat",
      titulo: `${user.name ?? "Um colega"} no chat Geral`,
      descricao: texto.slice(0, 140),
      entidadeTipo: "chat",
      entidadeId: canal,
      url: `/chat?c=${encodeURIComponent(canal)}`,
      semEmail: true,
    });
  }
}

/** Edita uma mensagem própria. */
export async function editarMensagem(id: string, corpo: string): Promise<void> {
  const user = await userOrThrow();
  const texto = corpo.trim();
  if (!texto) return;
  const m = await db.chatMensagem.findUnique({ where: { id }, select: { autorId: true } });
  if (!m || m.autorId !== user.id) throw new Error("Você só pode editar suas próprias mensagens.");
  await db.chatMensagem.update({ where: { id }, data: { corpo: texto.slice(0, 4000), editadoEm: new Date() } });
}

/** Exclui uma mensagem própria. */
export async function excluirMensagem(id: string): Promise<void> {
  const user = await userOrThrow();
  const m = await db.chatMensagem.findUnique({ where: { id }, select: { autorId: true } });
  if (!m || m.autorId !== user.id) throw new Error("Você só pode excluir suas próprias mensagens.");
  await db.chatMensagem.delete({ where: { id } });
}

/** Conversas do usuário (para o widget flutuante). */
export async function buscarConversas(): Promise<ConversaView[]> {
  const user = await userOrThrow();
  return listarConversas(user.id);
}

/** Total de mensagens não lidas (badge do widget). */
export async function buscarChatNaoLidas(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;
  return contarChatNaoLidas(user.id);
}

/** Marca o canal como lido até agora (zera o não lido). */
export async function marcarCanalLido(canal: string): Promise<void> {
  const user = await userOrThrow();
  if (!podeAcessarCanal(canal, user.id)) return;
  try {
    await db.chatLeitura.upsert({
      where: { usuarioId_canal: { usuarioId: user.id, canal } },
      create: { usuarioId: user.id, canal },
      update: { ultimaLidaEm: new Date() },
    });
  } catch (err) {
    console.error("[chat] marcarCanalLido falhou (ignorado):", err);
  }
}

/** Usada pelo polling do cliente para recarregar as mensagens do canal. */
export async function buscarMensagens(canal: string): Promise<ChatMensagemView[]> {
  const user = await userOrThrow();
  return listarMensagens(canal, user.id);
}
