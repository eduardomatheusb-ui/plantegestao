"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertPapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { rotuloTipoJob } from "@/lib/jobs/tipos";

const TRABALHAR: "OPERADOR" = "OPERADOR";
const GERIR: "GESTOR" = "GESTOR";

export type TemplateFormState = { error?: string };

type TarefaEntrada = { descricao: string; responsavelId?: string | null; prazoRelativoDias?: number | null };

function parseTarefas(raw: string | null | undefined): TarefaEntrada[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as TarefaEntrada[];
    return arr
      .filter((t) => t && typeof t.descricao === "string" && t.descricao.trim())
      .map((t) => ({
        descricao: t.descricao.trim(),
        responsavelId: t.responsavelId || null,
        prazoRelativoDias: Number.isFinite(Number(t.prazoRelativoDias)) && t.prazoRelativoDias != null && `${t.prazoRelativoDias}` !== "" ? Number(t.prazoRelativoDias) : null,
      }));
  } catch {
    return [];
  }
}

export async function salvarTemplate(id: string | null, _prev: TemplateFormState, formData: FormData): Promise<TemplateFormState> {
  let destino = "";
  try {
    const user = await assertPapel(TRABALHAR);
    const nome = formData.get("nome")?.toString().trim();
    if (!nome) return { error: "Informe o nome do template." };
    const tipo = formData.get("tipo")?.toString() || "post_estatico";
    const prioridade = formData.get("prioridade")?.toString() || "normal";
    const responsavelId = formData.get("responsavelId")?.toString() || null;
    const briefing = formData.get("briefing")?.toString().trim() || null;
    const tarefas = parseTarefas(formData.get("tarefas")?.toString());

    const dados = { nome, tipo, prioridade, responsavelId, briefing };
    if (id) {
      await db.jobTemplate.update({ where: { id }, data: dados });
      await db.jobTemplateTarefa.deleteMany({ where: { templateId: id } });
      if (tarefas.length) {
        await db.jobTemplateTarefa.createMany({ data: tarefas.map((t, i) => ({ templateId: id, descricao: t.descricao, ordem: i, responsavelId: t.responsavelId, prazoRelativoDias: t.prazoRelativoDias })) });
      }
      await registrarLog({ entidadeTipo: "job_template", entidadeId: id, usuarioId: user.id, acao: "editou o template" });
      destino = "/jobs/templates";
    } else {
      const criado = await db.jobTemplate.create({
        data: { ...dados, criadoPorId: user.id, tarefas: { create: tarefas.map((t, i) => ({ descricao: t.descricao, ordem: i, responsavelId: t.responsavelId, prazoRelativoDias: t.prazoRelativoDias })) } },
      });
      await registrarLog({ entidadeTipo: "job_template", entidadeId: criado.id, usuarioId: user.id, acao: "criou o template" });
      destino = "/jobs/templates";
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o template." };
  }
  revalidatePath("/jobs/templates");
  redirect(destino);
}

/** Cria um template a partir de um job existente (tipo, prioridade, responsável, briefing, tarefas). */
export async function criarTemplateDeJob(jobId: string) {
  const user = await assertPapel(TRABALHAR);
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { tarefas: { orderBy: { ordem: "asc" } } },
  });
  if (!job) throw new Error("Job não encontrado.");
  const criado = await db.jobTemplate.create({
    data: {
      nome: `Template — ${rotuloTipoJob(job.tipo)}`,
      tipo: job.tipo,
      prioridade: job.prioridade,
      responsavelId: job.responsavelId,
      briefing: job.briefing,
      criadoPorId: user.id,
      tarefas: { create: job.tarefas.map((t, i) => ({ descricao: t.descricao, ordem: i, responsavelId: t.responsavelId })) },
    },
  });
  await registrarLog({ entidadeTipo: "job_template", entidadeId: criado.id, usuarioId: user.id, acao: `criou template a partir do job #${job.numero}` });
  revalidatePath("/jobs/templates");
  redirect(`/jobs/templates/${criado.id}/editar`);
}

export async function duplicarTemplate(id: string) {
  const user = await assertPapel(TRABALHAR);
  const orig = await db.jobTemplate.findUnique({ where: { id }, include: { tarefas: { orderBy: { ordem: "asc" } } } });
  if (!orig) throw new Error("Template não encontrado.");
  const criado = await db.jobTemplate.create({
    data: {
      nome: `${orig.nome} (cópia)`,
      tipo: orig.tipo,
      prioridade: orig.prioridade,
      responsavelId: orig.responsavelId,
      briefing: orig.briefing,
      criadoPorId: user.id,
      tarefas: { create: orig.tarefas.map((t) => ({ descricao: t.descricao, ordem: t.ordem, responsavelId: t.responsavelId, prazoRelativoDias: t.prazoRelativoDias })) },
    },
  });
  await registrarLog({ entidadeTipo: "job_template", entidadeId: criado.id, usuarioId: user.id, acao: "duplicou o template" });
  revalidatePath("/jobs/templates");
  redirect(`/jobs/templates/${criado.id}/editar`);
}

export async function excluirTemplate(id: string) {
  const user = await assertPapel(GERIR);
  await db.jobTemplate.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "job_template", entidadeId: id, usuarioId: user.id, acao: "excluiu o template" });
  revalidatePath("/jobs/templates");
  redirect("/jobs/templates");
}
