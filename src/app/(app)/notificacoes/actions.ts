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
