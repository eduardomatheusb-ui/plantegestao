"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";

/** Gera (ou mantém) o token público do portal do cliente. */
export async function gerarPortal(clienteId: string): Promise<void> {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  const c = await db.cliente.findUnique({ where: { id: clienteId }, select: { portalToken: true } });
  if (!c) throw new Error("Cliente não encontrado.");
  if (!c.portalToken) {
    await db.cliente.update({ where: { id: clienteId }, data: { portalToken: randomBytes(24).toString("hex") } });
    await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "ativou o portal do cliente" });
  }
  revalidatePath(`/cadastros/clientes/${clienteId}`);
}

/** Desativa o portal (invalida o link). */
export async function desativarPortal(clienteId: string): Promise<void> {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  await db.cliente.update({ where: { id: clienteId }, data: { portalToken: null } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "desativou o portal do cliente" });
  revalidatePath(`/cadastros/clientes/${clienteId}`);
}
