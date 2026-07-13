"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";

export type ContratoFormState = { error?: string };

const dataOpt = (v: string | undefined) => (v ? new Date(`${v}T12:00:00`) : null);
const numBR = (v: string | undefined) => {
  const s = v?.trim().replace(/\./g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};

const schema = z.object({
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  descricao: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  status: z.string().optional().transform((v) => (v && v.trim() ? v : "ativo")),
});

export async function salvarContrato(id: string | null, _prev: ContratoFormState, formData: FormData): Promise<ContratoFormState> {
  let destino = "";
  try {
    const acesso = await assertModulo("financeiro", "EDITAR");
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };

    const valorMensal = numBR(formData.get("valorMensal")?.toString());
    if (valorMensal == null || valorMensal <= 0) return { error: "Informe o valor mensal (ex.: 3000)." };

    const dataInicio = dataOpt(formData.get("dataInicio")?.toString());
    if (!dataInicio) return { error: "Informe a data de início." };

    const diaStr = formData.get("diaVencimento")?.toString().trim();
    let diaVencimento: number | null = null;
    if (diaStr) {
      const dia = Math.trunc(Number(diaStr));
      if (Number.isNaN(dia) || dia < 1 || dia > 31) return { error: "Dia de vencimento deve ser entre 1 e 31." };
      diaVencimento = dia;
    }

    const data = {
      ...parsed.data,
      valorMensal,
      dataInicio,
      dataFim: dataOpt(formData.get("dataFim")?.toString()),
      diaVencimento,
      reajusteEm: dataOpt(formData.get("reajusteEm")?.toString()),
      reajusteObs: formData.get("reajusteObs")?.toString().trim() || null,
    };

    if (id) {
      await db.contrato.update({ where: { id }, data });
      await registrarLog({ entidadeTipo: "contrato", entidadeId: id, usuarioId: acesso.id, acao: "editou o contrato" });
      destino = `/contratos/${id}`;
    } else {
      const criado = await db.contrato.create({ data: { ...data, criadoPorId: acesso.id } });
      await registrarLog({ entidadeTipo: "contrato", entidadeId: criado.id, usuarioId: acesso.id, acao: "criou o contrato" });
      destino = `/contratos/${criado.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o contrato." };
  }
  revalidatePath("/contratos");
  redirect(destino);
}

export async function excluirContrato(id: string) {
  const acesso = await assertModulo("financeiro", "ADMIN");
  await db.contrato.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "contrato", entidadeId: id, usuarioId: acesso.id, acao: "excluiu o contrato" });
  revalidatePath("/contratos");
  redirect("/contratos");
}
