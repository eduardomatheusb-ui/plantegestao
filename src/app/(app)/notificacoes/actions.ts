"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

export async function marcarLida(id: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.notificacao.updateMany({ where: { id, usuarioId: user.id }, data: { lida: true } });
  revalidatePath("/notificacoes");
}

export async function marcarTodasLidas(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.notificacao.updateMany({ where: { usuarioId: user.id, lida: false }, data: { lida: true } });
  revalidatePath("/notificacoes");
}

/**
 * Remove as notificações já lidas da pessoa, para a lista não acumular.
 * Só apaga as lidas (as não lidas ficam); e só as do próprio usuário.
 * A notificação é um aviso, não um registro: o histórico de verdade vive nas
 * próprias entidades (jobs, comentários, log).
 */
export async function limparLidas(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.notificacao.deleteMany({ where: { usuarioId: user.id, lida: true } });
  revalidatePath("/notificacoes");
}
