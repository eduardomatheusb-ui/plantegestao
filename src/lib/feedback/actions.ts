"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, podePapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { TIPO_KEYS, STATUS_KEYS } from "./constants";

export type FeedbackState = { error?: string; ok?: boolean };

const schema = z.object({
  tipo: z.string().transform((v) => (TIPO_KEYS.includes(v) ? v : "erro")),
  titulo: z.string().trim().min(3, "Resuma em poucas palavras."),
  descricao: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  pagina: z.string().optional().transform((v) => (v?.trim() ? v : null)),
});

/** Qualquer pessoa logada registra erro, dúvida ou sugestão. */
export async function criarFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  const f = await db.feedback.create({ data: { ...parsed.data, autorId: user.id } });
  await registrarLog({ entidadeTipo: "feedback", entidadeId: f.id, usuarioId: user.id, acao: `registrou ${parsed.data.tipo}` });
  revalidatePath("/feedback");
  return { ok: true };
}

/** Gestor+ move o status (aberto → em análise → resolvido). */
export async function mudarStatusFeedback(id: string, status: string) {
  const user = await requireUser();
  if (!podePapel(user.papel, "GESTOR")) throw new Error("Sem permissão.");
  if (!STATUS_KEYS.includes(status)) throw new Error("Status inválido.");
  await db.feedback.update({ where: { id }, data: { status } });
  await registrarLog({ entidadeTipo: "feedback", entidadeId: id, usuarioId: user.id, acao: "mudou status", para: status });
  revalidatePath("/feedback");
}

/** Gestor+ responde e marca como resolvido. */
export async function responderFeedback(id: string, _prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const user = await requireUser();
  if (!podePapel(user.papel, "GESTOR")) return { error: "Sem permissão." };
  const resposta = (formData.get("resposta")?.toString() ?? "").trim();
  if (!resposta) return { error: "Escreva a resposta." };
  await db.feedback.update({ where: { id }, data: { resposta, respondidoPorId: user.id, status: "resolvido" } });
  await registrarLog({ entidadeTipo: "feedback", entidadeId: id, usuarioId: user.id, acao: "respondeu" });
  revalidatePath("/feedback");
  return { ok: true };
}
