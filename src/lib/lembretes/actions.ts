"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

/**
 * Marca o lembrete diário como visto — e, junto, dá as novidades por lidas.
 * Chamado ao fechar o popup; sem isto ele reapareceria a cada navegação.
 */
export async function marcarLembreteVisto(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.usuario.update({
    where: { id: user.id },
    data: { lembreteVistoEm: new Date(), novidadesVistasEm: new Date() },
  });
}

/** Registra que a pessoa abriu a Bíblia Operacional. */
export async function registrarLeituraManual(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  await db.usuario.update({ where: { id: user.id }, data: { manualLidoEm: new Date() } });
}
