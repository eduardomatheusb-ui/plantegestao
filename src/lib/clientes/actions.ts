"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { CAMPOS_DOSSIE } from "@/lib/clientes/dossie";

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

/** Estação do Cliente: salva (upsert) o dossiê estratégico e volta para a aba. */
export async function salvarDossie(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");

  const data: Record<string, string | null> = {};
  for (const campo of CAMPOS_DOSSIE) {
    const v = formData.get(campo.name)?.toString().trim();
    data[campo.name] = v ? v : null;
  }

  await db.clienteDossie.upsert({
    where: { clienteId },
    create: { clienteId, ...data },
    update: data,
  });

  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "atualizou o dossiê estratégico" });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?aba=dossie`);
}

/** Estação: adiciona um item de escopo contratado (quadro contratado × utilizado). */
export async function salvarEscopoItem(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const rotulo = formData.get("rotulo")?.toString().trim();
  const bucket = formData.get("bucket")?.toString() ?? "outro";
  const qtd = parseInt(formData.get("quantidadeMensal")?.toString() ?? "", 10);
  const { BUCKETS_ESCOPO } = await import("@/lib/clientes/escopo");
  const def = BUCKETS_ESCOPO.find((b) => b.key === bucket);
  if (!rotulo || !def || !Number.isFinite(qtd) || qtd < 0) return;

  await db.escopoItem.create({
    data: { clienteId, rotulo, bucket, quantidadeMensal: qtd, unidade: def.unidade },
  });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "adicionou item de escopo", para: `${rotulo} (${qtd}/mês)` });
  revalidatePath(`/clientes/${clienteId}`);
}

/** Estação: remove um item de escopo contratado. */
export async function removerEscopoItem(id: string): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const item = await db.escopoItem.findUnique({ where: { id }, select: { clienteId: true, rotulo: true } });
  if (!item) return;
  await db.escopoItem.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: item.clienteId, usuarioId: acesso.id, acao: "removeu item de escopo", de: item.rotulo });
  revalidatePath(`/clientes/${item.clienteId}`);
}
