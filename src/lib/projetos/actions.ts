"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertPapel, getSessionUser, podePapel } from "@/lib/rbac";
import { STATUS_LABEL } from "./situacao";
import type { ProjetoStatus } from "@prisma/client";

const EDITAR: "GESTOR" = "GESTOR";

export type ProjetoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const STATUS_VALUES = [
  "SEM_STATUS",
  "EM_ANDAMENTO",
  "PAUSADO",
  "CONCLUIDO",
  "CANCELADO",
] as const;

const dataOpcional = z
  .string()
  .optional()
  // Datas só-dia: interpretar como meia-noite LOCAL (evita off-by-one por fuso).
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null));

const projetoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do projeto."),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  responsavelId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(STATUS_VALUES).default("SEM_STATUS"),
  prazoDesejado: dataOpcional,
  prazoEstimado: dataOpcional,
  budget: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Number(v) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), { message: "Budget inválido." }),
  tempoEstimadoHoras: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? Math.round(Number(v) * 60) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), { message: "Tempo inválido." }),
  briefing: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v : null)),
  projetoPaiId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function salvarProjeto(
  id: string | null,
  _prev: ProjetoFormState,
  formData: FormData,
): Promise<ProjetoFormState> {
  let destino = "";
  try {
    const user = await assertPapel(EDITAR);
    const parsed = projetoSchema.safeParse({
      nome: formData.get("nome")?.toString(),
      clienteId: formData.get("clienteId")?.toString(),
      responsavelId: formData.get("responsavelId")?.toString(),
      status: formData.get("status")?.toString() || "SEM_STATUS",
      prazoDesejado: formData.get("prazoDesejado")?.toString(),
      prazoEstimado: formData.get("prazoEstimado")?.toString(),
      budget: formData.get("budget")?.toString(),
      tempoEstimadoHoras: formData.get("tempoEstimadoHoras")?.toString(),
      briefing: formData.get("briefing")?.toString(),
      projetoPaiId: formData.get("projetoPaiId")?.toString(),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      return { error: "Confira os campos destacados.", fieldErrors };
    }

    const d = parsed.data;
    const data = {
      nome: d.nome,
      clienteId: d.clienteId,
      responsavelId: d.responsavelId,
      status: d.status as ProjetoStatus,
      prazoDesejado: d.prazoDesejado,
      prazoEstimado: d.prazoEstimado,
      budget: d.budget,
      tempoEstimadoMin: d.tempoEstimadoHoras,
      briefing: d.briefing,
    };

    if (id) {
      await db.projeto.update({ where: { id }, data });
      await registrarLog({ entidadeTipo: "projeto", entidadeId: id, usuarioId: user.id, acao: "editou o projeto" });
      destino = `/projetos/${id}`;
    } else {
      const numero = await proximoNumero("PROJETO");
      const criado = await db.projeto.create({
        data: { ...data, numero, projetoPaiId: d.projetoPaiId, criadoPorId: user.id },
      });
      await registrarLog({ entidadeTipo: "projeto", entidadeId: criado.id, usuarioId: user.id, acao: `criou o projeto #${numero}` });
      destino = `/projetos/${criado.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o projeto." };
  }

  revalidatePath("/projetos");
  redirect(destino);
}

export async function alterarStatusProjeto(id: string, status: ProjetoStatus) {
  const user = await assertPapel(EDITAR);
  if (!STATUS_VALUES.includes(status)) throw new Error("Status inválido.");
  const atual = await db.projeto.findUnique({ where: { id }, select: { status: true } });
  await db.projeto.update({ where: { id }, data: { status } });
  await registrarLog({
    entidadeTipo: "projeto",
    entidadeId: id,
    usuarioId: user.id,
    acao: "mudou o status",
    de: atual ? STATUS_LABEL[atual.status] : null,
    para: STATUS_LABEL[status],
  });
  revalidatePath(`/projetos/${id}`);
  revalidatePath("/projetos");
}

export async function toggleFavoritoProjeto(id: string) {
  await getSessionUserOrThrow();
  const atual = await db.projeto.findUnique({ where: { id }, select: { favorito: true } });
  await db.projeto.update({ where: { id }, data: { favorito: !atual?.favorito } });
  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
}

export async function arquivarProjeto(id: string, arquivar: boolean) {
  const user = await assertPapel(EDITAR);
  await db.projeto.update({ where: { id }, data: { arquivado: arquivar } });
  await registrarLog({
    entidadeTipo: "projeto",
    entidadeId: id,
    usuarioId: user.id,
    acao: arquivar ? "arquivou o projeto" : "reativou o projeto",
  });
  revalidatePath("/projetos");
  revalidatePath(`/projetos/${id}`);
}

export async function excluirProjeto(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  await db.projeto.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "projeto", entidadeId: id, usuarioId: user.id, acao: "excluiu o projeto" });
  revalidatePath("/projetos");
  redirect("/projetos");
}

export async function adicionarEnvolvido(projetoId: string, formData: FormData) {
  await assertPapel(EDITAR);
  const usuarioId = formData.get("usuarioId")?.toString();
  if (!usuarioId) return;
  await db.projetoEnvolvido.upsert({
    where: { projetoId_usuarioId: { projetoId, usuarioId } },
    create: { projetoId, usuarioId },
    update: {},
  });
  revalidatePath(`/projetos/${projetoId}`);
}

export async function removerEnvolvido(projetoId: string, usuarioId: string) {
  await assertPapel(EDITAR);
  await db.projetoEnvolvido
    .delete({ where: { projetoId_usuarioId: { projetoId, usuarioId } } })
    .catch(() => {});
  revalidatePath(`/projetos/${projetoId}`);
}

// ── Comentários / Anexos / Timesheet (reutilizáveis) ──────────────────

async function getSessionUserOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

function caminhoEntidade(entidadeTipo: string, entidadeId: string): string | null {
  if (entidadeTipo === "projeto") return `/projetos/${entidadeId}`;
  if (entidadeTipo === "job") return `/jobs/${entidadeId}`;
  if (entidadeTipo === "proposta") return `/propostas/${entidadeId}`;
  return null;
}

export async function adicionarComentario(
  entidadeTipo: string,
  entidadeId: string,
  formData: FormData,
) {
  const user = await getSessionUserOrThrow();
  const texto = formData.get("texto")?.toString().trim();
  if (!texto) return;
  await db.comentario.create({ data: { entidadeTipo, entidadeId, autorId: user.id, texto } });
  const path = caminhoEntidade(entidadeTipo, entidadeId);
  if (path) revalidatePath(path);
}

export async function removerComentario(id: string) {
  const user = await getSessionUserOrThrow();
  const c = await db.comentario.findUnique({ where: { id } });
  if (!c) return;
  if (c.autorId !== user.id && !podePapel(user.papel, EDITAR)) {
    throw new Error("Você só pode remover seus próprios comentários.");
  }
  await db.comentario.delete({ where: { id } });
  const path = caminhoEntidade(c.entidadeTipo, c.entidadeId);
  if (path) revalidatePath(path);
}

const urlSchema = z.string().url("Informe um link válido (http/https).");

export async function adicionarAnexo(
  entidadeTipo: string,
  entidadeId: string,
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getSessionUserOrThrow();
  const nome = formData.get("nome")?.toString().trim();
  const url = formData.get("url")?.toString().trim();
  if (!nome || !url) return { error: "Informe nome e link." };
  if (!urlSchema.safeParse(url).success) return { error: "Link inválido (use http/https)." };
  await db.anexo.create({ data: { entidadeTipo, entidadeId, nome, url, criadoPorId: user.id } });
  const path = caminhoEntidade(entidadeTipo, entidadeId);
  if (path) revalidatePath(path);
  return {};
}

export async function removerAnexo(id: string) {
  const user = await getSessionUserOrThrow();
  const a = await db.anexo.findUnique({ where: { id } });
  if (!a) return;
  if (a.criadoPorId !== user.id && !podePapel(user.papel, EDITAR)) {
    throw new Error("Você só pode remover seus próprios anexos.");
  }
  await db.anexo.delete({ where: { id } });
  const path = caminhoEntidade(a.entidadeTipo, a.entidadeId);
  if (path) revalidatePath(path);
}

export async function apontarTempo(
  entidadeTipo: "projeto" | "job",
  entidadeId: string,
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await getSessionUserOrThrow();
  const dataStr = formData.get("data")?.toString();
  const horas = Number(formData.get("horas")?.toString() || "0");
  const minutos = Number(formData.get("minutos")?.toString() || "0");
  const descricao = formData.get("descricao")?.toString().trim() || null;

  const totalMin = Math.round(horas * 60 + minutos);
  if (!Number.isFinite(totalMin) || totalMin <= 0) return { error: "Informe um tempo maior que zero." };

  await db.apontamento.create({
    data: {
      usuarioId: user.id,
      projetoId: entidadeTipo === "projeto" ? entidadeId : null,
      jobId: entidadeTipo === "job" ? entidadeId : null,
      data: dataStr ? new Date(`${dataStr}T00:00:00`) : new Date(),
      minutos: totalMin,
      descricao,
    },
  });
  const path = caminhoEntidade(entidadeTipo, entidadeId);
  if (path) revalidatePath(path);
  return {};
}

export async function removerApontamento(id: string) {
  const user = await getSessionUserOrThrow();
  const ap = await db.apontamento.findUnique({ where: { id } });
  if (!ap) return;
  if (ap.usuarioId !== user.id && !podePapel(user.papel, EDITAR)) {
    throw new Error("Você só pode remover seus próprios apontamentos.");
  }
  await db.apontamento.delete({ where: { id } });
  if (ap.projetoId) revalidatePath(`/projetos/${ap.projetoId}`);
  if (ap.jobId) revalidatePath(`/jobs/${ap.jobId}`);
}
