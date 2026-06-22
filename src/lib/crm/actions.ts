"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { ETAPAS_LEAD } from "./etapas";

const ETAPA_KEYS = ETAPAS_LEAD.map((e) => e.key);

export type LeadFormState = { error?: string };

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome/contato."),
  empresa: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  origem: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  email: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  telefone: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  valorEstimado: z.string().optional().transform((v) => (v ? Number(v.replace(",", ".")) : null)),
  etapa: z.string().optional().transform((v) => (v && ETAPA_KEYS.includes(v) ? v : "novo")),
  responsavelId: z.string().optional().transform((v) => (v ? v : null)),
  observacao: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  motivoPerda: z.string().optional().transform((v) => (v?.trim() ? v : null)),
});

export async function salvarLead(id: string | null, _prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  let destino = "";
  try {
    const acesso = await assertModulo("propostas", "EDITAR");
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
    const d = parsed.data;
    if (id) {
      await db.lead.update({ where: { id }, data: d });
      await registrarLog({ entidadeTipo: "lead", entidadeId: id, usuarioId: acesso.id, acao: "editou o lead" });
      destino = `/crm/${id}`;
    } else {
      const criado = await db.lead.create({ data: { ...d, criadoPorId: acesso.id } });
      await registrarLog({ entidadeTipo: "lead", entidadeId: criado.id, usuarioId: acesso.id, acao: "criou o lead" });
      destino = `/crm/${criado.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/crm");
  redirect(destino);
}

export async function moverEtapaLead(id: string, etapa: string) {
  const acesso = await assertModulo("propostas", "EDITAR");
  if (!ETAPA_KEYS.includes(etapa)) throw new Error("Etapa inválida.");
  const atual = await db.lead.findUnique({ where: { id }, select: { etapa: true } });
  await db.lead.update({ where: { id }, data: { etapa } });
  await registrarLog({ entidadeTipo: "lead", entidadeId: id, usuarioId: acesso.id, acao: "moveu etapa", de: atual?.etapa, para: etapa });
  revalidatePath("/crm");
}

/** Converte o lead em Cliente (e marca o lead como ganho/vinculado). */
export async function converterLeadEmCliente(id: string): Promise<{ ok: boolean; erro?: string; clienteId?: string }> {
  const acesso = await assertModulo("propostas", "EDITAR");
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return { ok: false, erro: "Lead não encontrado." };
  if (lead.clienteId) return { ok: true, clienteId: lead.clienteId };
  const cliente = await db.cliente.create({
    data: {
      nome: lead.empresa || lead.nome,
      nomeFantasia: lead.empresa ? lead.nome : null,
      email: lead.email,
      telefone: lead.telefone,
      status: "implantacao",
    },
  });
  await db.lead.update({ where: { id }, data: { clienteId: cliente.id, etapa: "ganho" } });
  await registrarLog({ entidadeTipo: "lead", entidadeId: id, usuarioId: acesso.id, acao: "converteu em cliente", para: cliente.nome });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: cliente.id, usuarioId: acesso.id, acao: "criado a partir de lead" });
  revalidatePath("/crm");
  return { ok: true, clienteId: cliente.id };
}

export async function excluirLead(id: string) {
  const acesso = await assertModulo("propostas", "ADMIN");
  await db.lead.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "lead", entidadeId: id, usuarioId: acesso.id, acao: "excluiu o lead" });
  revalidatePath("/crm");
  redirect("/crm");
}
