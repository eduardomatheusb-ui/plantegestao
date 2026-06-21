"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPapel } from "@/lib/rbac";

export type EmpresaState = { ok?: boolean; error?: string };

const schema = z.object({
  marca: z.string().trim().min(1, "Informe a marca."),
  razaoSocial: z.string().trim().min(1, "Informe a razão social."),
  cnpj: z.string().trim().min(1, "Informe o CNPJ."),
  email: z.string().trim().email("E-mail comercial inválido."),
  emailFinanceiro: z.string().trim().email("E-mail financeiro inválido."),
  telefone: z.string().trim().min(1, "Informe o telefone."),
  cep: z.string().trim().min(1, "Informe o CEP."),
  endereco: z.string().trim().min(1, "Informe o endereço."),
});

export async function salvarEmpresa(_prev: EmpresaState, formData: FormData): Promise<EmpresaState> {
  try {
    await assertPapel("GESTOR");
    const parsed = schema.safeParse({
      marca: formData.get("marca")?.toString(),
      razaoSocial: formData.get("razaoSocial")?.toString(),
      cnpj: formData.get("cnpj")?.toString(),
      email: formData.get("email")?.toString(),
      emailFinanceiro: formData.get("emailFinanceiro")?.toString(),
      telefone: formData.get("telefone")?.toString(),
      cep: formData.get("cep")?.toString(),
      endereco: formData.get("endereco")?.toString(),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
    }
    const d = parsed.data;
    await db.empresa.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...d }, update: d });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/configuracoes/empresa");
  return { ok: true };
}
