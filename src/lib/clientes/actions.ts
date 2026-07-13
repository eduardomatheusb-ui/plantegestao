"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";

/** Estação do Cliente: define o responsável pelo atendimento ou pela estratégia. */
export async function definirResponsavelConta(
  clienteId: string,
  papel: "atendimento" | "estrategia",
  usuarioId: string | null,
): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");

  const usuario = usuarioId
    ? await db.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nome: true } })
    : null;

  await db.cliente.update({
    where: { id: clienteId },
    data: papel === "atendimento" ? { atendimentoId: usuario?.id ?? null } : { estrategiaId: usuario?.id ?? null },
  });

  await registrarLog({
    entidadeTipo: "cliente",
    entidadeId: clienteId,
    usuarioId: acesso.id,
    acao: papel === "atendimento" ? "definiu o responsável pelo atendimento" : "definiu o responsável pela estratégia",
    para: usuario?.nome ?? "—",
  });

  revalidatePath(`/clientes/${clienteId}`);
}
