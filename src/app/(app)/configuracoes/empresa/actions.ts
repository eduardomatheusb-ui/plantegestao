"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";

export type EmpresaState = { ok?: boolean; error?: string };

const opt = (v: FormDataEntryValue | null) => {
  const s = v?.toString().trim();
  return s ? s : null;
};

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
    await assertModulo("admin", "ADMIN");
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

    // Campos fiscais (NFS-e) — todos opcionais.
    const aliqStr = formData.get("aliquotaIss")?.toString().trim().replace(",", ".");
    const aliquotaIss = aliqStr ? Number(aliqStr) : null;
    if (aliqStr && (Number.isNaN(aliquotaIss) || aliquotaIss! < 0)) {
      return { error: "Alíquota de ISS inválida (use número, ex.: 2 ou 2.5)." };
    }

    const metaStr = formData.get("metaFaturamentoMensal")?.toString().trim().replace(/\./g, "").replace(",", ".");
    const metaFaturamentoMensal = metaStr ? Number(metaStr) : null;
    if (metaStr && (Number.isNaN(metaFaturamentoMensal) || metaFaturamentoMensal! < 0)) {
      return { error: "Meta de faturamento inválida (use número, ex.: 50000)." };
    }
    const fiscal = {
      inscricaoMunicipal: opt(formData.get("inscricaoMunicipal")),
      codigoMunicipioIbge: opt(formData.get("codigoMunicipioIbge")),
      itemListaServico: opt(formData.get("itemListaServico")),
      codigoTributarioMunicipio: opt(formData.get("codigoTributarioMunicipio")),
      aliquotaIss,
      regimeTributario: opt(formData.get("regimeTributario")),
      optanteSimplesNacional: formData.get("optanteSimplesNacional") === "on",
      incentivadorCultural: formData.get("incentivadorCultural") === "on",
      urlEmissaoNfse: opt(formData.get("urlEmissaoNfse")),
      metaFaturamentoMensal,
    };

    const d = { ...parsed.data, ...fiscal };
    await db.empresa.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...d }, update: d });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/configuracoes/empresa");
  return { ok: true };
}
