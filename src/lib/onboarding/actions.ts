"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { ONBOARDING_PADRAO } from "./template";

function revalidar(clienteId: string) {
  revalidatePath(`/cadastros/clientes/${clienteId}`);
}

/** Cria o checklist padrão (só se ainda não houver itens). */
export async function iniciarOnboarding(clienteId: string) {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  const existe = await db.onboardingItem.count({ where: { clienteId } });
  if (existe > 0) return;
  await db.onboardingItem.createMany({
    data: ONBOARDING_PADRAO.map((titulo, i) => ({ clienteId, titulo, ordem: i + 1 })),
  });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "iniciou o onboarding" });
  revalidar(clienteId);
}

/** Conclui/reabre um item. Ao concluir o último, ativa o cliente automaticamente. */
export async function toggleOnboardingItem(id: string) {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  const item = await db.onboardingItem.findUnique({ where: { id }, select: { concluido: true, clienteId: true } });
  if (!item) return;
  const novo = !item.concluido;
  await db.onboardingItem.update({
    where: { id },
    data: { concluido: novo, concluidoEm: novo ? new Date() : null },
  });

  // Se todos os itens ficaram concluídos e o cliente está em implantação → ativa.
  if (novo) {
    const restantes = await db.onboardingItem.count({ where: { clienteId: item.clienteId, concluido: false } });
    if (restantes === 0) {
      const cliente = await db.cliente.findUnique({ where: { id: item.clienteId }, select: { status: true } });
      if (cliente?.status === "implantacao") {
        await db.cliente.update({ where: { id: item.clienteId }, data: { status: "ativo" } });
        await registrarLog({ entidadeTipo: "cliente", entidadeId: item.clienteId, usuarioId: user.id, acao: "concluiu o onboarding (cliente ativado)", de: "implantacao", para: "ativo" });
      }
    }
  }
  revalidar(item.clienteId);
}

/** Define responsável e observação de um item. */
export async function atualizarOnboardingItem(id: string, formData: FormData) {
  await assertPapel(CADASTRO_EDITAR_MINIMO);
  const item = await db.onboardingItem.findUnique({ where: { id }, select: { clienteId: true } });
  if (!item) return;
  const responsavelId = formData.get("responsavelId")?.toString() || null;
  const observacao = formData.get("observacao")?.toString().trim() || null;
  await db.onboardingItem.update({ where: { id }, data: { responsavelId, observacao } });
  revalidar(item.clienteId);
}

/** Adiciona um item personalizado ao final do checklist. */
export async function adicionarOnboardingItem(clienteId: string, formData: FormData) {
  await assertPapel(CADASTRO_EDITAR_MINIMO);
  const titulo = formData.get("titulo")?.toString().trim();
  if (!titulo) return;
  const ultima = await db.onboardingItem.findFirst({ where: { clienteId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.onboardingItem.create({ data: { clienteId, titulo, ordem: (ultima?.ordem ?? 0) + 1 } });
  revalidar(clienteId);
}

export async function removerOnboardingItem(id: string) {
  await assertPapel(CADASTRO_EDITAR_MINIMO);
  const item = await db.onboardingItem.findUnique({ where: { id }, select: { clienteId: true } });
  if (!item) return;
  await db.onboardingItem.delete({ where: { id } });
  revalidar(item.clienteId);
}
