"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

/**
 * Notificação "some ao ler": abrir uma notificação a REMOVE (a pessoa já viu,
 * não precisa mais). O histórico de verdade vive nas próprias entidades (jobs,
 * comentários, log), então descartar o aviso não perde nada.
 */
export async function descartarNotificacao(id: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.notificacao.deleteMany({ where: { id, usuarioId: user.id } });
  revalidatePath("/notificacoes");
}

/** Limpa TODAS as notificações da pessoa de uma vez. Só as do próprio usuário. */
export async function limparTodas(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.notificacao.deleteMany({ where: { usuarioId: user.id } });
  revalidatePath("/notificacoes");
}
