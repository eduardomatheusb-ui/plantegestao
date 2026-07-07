"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";

export type CampanhaFormState = { error?: string };

const dataOpt = (v: string | undefined) => (v ? new Date(`${v}T12:00:00`) : null);
const numOpt = (v: string | undefined) => {
  const s = v?.trim().replace(/\./g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
};

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da campanha."),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  plataforma: z.string().optional().transform((v) => (v && v.trim() ? v : "meta")),
  objetivo: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  status: z.string().optional().transform((v) => (v && v.trim() ? v : "ativa")),
  observacao: z.string().optional().transform((v) => (v?.trim() ? v : null)),
});

export async function salvarCampanha(id: string | null, _prev: CampanhaFormState, formData: FormData): Promise<CampanhaFormState> {
  let destino = "";
  try {
    const acesso = await assertModulo("midia", "EDITAR");
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
    const d = parsed.data;
    const metaLeadsRaw = numOpt(formData.get("metaLeads")?.toString());
    const data = {
      ...d,
      verba: numOpt(formData.get("verba")?.toString()),
      metaLeads: metaLeadsRaw != null ? Math.max(0, Math.trunc(metaLeadsRaw)) : null,
      metaCpl: numOpt(formData.get("metaCpl")?.toString()),
      dataInicio: dataOpt(formData.get("dataInicio")?.toString()),
      dataFim: dataOpt(formData.get("dataFim")?.toString()),
    };

    if (id) {
      await db.campanha.update({ where: { id }, data });
      await registrarLog({ entidadeTipo: "campanha", entidadeId: id, usuarioId: acesso.id, acao: "editou a campanha" });
      destino = `/trafego/${id}`;
    } else {
      const criada = await db.campanha.create({ data: { ...data, criadoPorId: acesso.id } });
      await registrarLog({ entidadeTipo: "campanha", entidadeId: criada.id, usuarioId: acesso.id, acao: "criou a campanha" });
      destino = `/trafego/${criada.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar a campanha." };
  }
  revalidatePath("/trafego");
  redirect(destino);
}

export async function excluirCampanha(id: string) {
  const acesso = await assertModulo("midia", "ADMIN");
  await db.campanha.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "campanha", entidadeId: id, usuarioId: acesso.id, acao: "excluiu a campanha" });
  revalidatePath("/trafego");
  redirect("/trafego");
}

export async function adicionarResultado(campanhaId: string, formData: FormData) {
  const acesso = await assertModulo("midia", "EDITAR");
  const dataStr = formData.get("data")?.toString();
  if (!dataStr) return;
  const inteiro = (k: string) => Math.max(0, Math.trunc(Number(formData.get(k)?.toString() || "0")) || 0);
  await db.campanhaResultado.create({
    data: {
      campanhaId,
      data: new Date(`${dataStr}T12:00:00`),
      investido: numOpt(formData.get("investido")?.toString()) ?? 0,
      alcance: inteiro("alcance"),
      cliques: inteiro("cliques"),
      conversoes: inteiro("conversoes"),
      leads: inteiro("leads"),
      observacao: formData.get("observacao")?.toString().trim() || null,
    },
  });
  await registrarLog({ entidadeTipo: "campanha", entidadeId: campanhaId, usuarioId: acesso.id, acao: "lançou resultado" });
  revalidatePath(`/trafego/${campanhaId}`);
}

export async function removerResultado(id: string) {
  await assertModulo("midia", "EDITAR");
  const r = await db.campanhaResultado.findUnique({ where: { id }, select: { campanhaId: true } });
  if (!r) return;
  await db.campanhaResultado.delete({ where: { id } });
  revalidatePath(`/trafego/${r.campanhaId}`);
}
