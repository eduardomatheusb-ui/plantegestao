"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";

export type FeriadoFormState = { error?: string };

/** Cadastra um feriado (usado no cálculo de prazos em dias úteis). */
export async function salvarFeriado(_prev: FeriadoFormState, formData: FormData): Promise<FeriadoFormState> {
  try {
    const acesso = await assertModulo("cadastros", "EDITAR");
    const nome = formData.get("nome")?.toString().trim();
    const dataStr = formData.get("data")?.toString();
    if (!nome) return { error: "Informe o nome do feriado." };
    if (!dataStr || !/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return { error: "Informe a data." };
    const data = new Date(`${dataStr}T00:00:00`);
    await db.feriado.upsert({
      where: { data },
      create: { data, nome },
      update: { nome },
    });
    await registrarLog({ entidadeTipo: "feriado", entidadeId: dataStr, usuarioId: acesso.id, acao: `cadastrou o feriado ${nome}` });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/cadastros/feriados");
  return {};
}

export async function excluirFeriado(id: string) {
  const acesso = await assertModulo("cadastros", "EDITAR");
  await db.feriado.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "feriado", entidadeId: id, usuarioId: acesso.id, acao: "excluiu um feriado" });
  revalidatePath("/cadastros/feriados");
}
