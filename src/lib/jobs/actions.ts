"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { notificar, notificarMuitos } from "@/lib/notificacoes";
import { TIPO_JOB_PADRAO, tipoJobSocial } from "./tipos";
import { assertPapel, getSessionUser } from "@/lib/rbac";

// Qualquer usuário autenticado trabalha em jobs (rotina diária da equipe).
const TRABALHAR: "OPERADOR" = "OPERADOR";
const GERIR: "GESTOR" = "GESTOR";

export type JobFormState = { error?: string; fieldErrors?: Record<string, string> };

async function userOrThrow() {
  const u = await getSessionUser();
  if (!u) throw new Error("Não autenticado.");
  return u;
}

const dataOpt = (v: string | undefined) => (v ? new Date(`${v}T00:00:00`) : null);
function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const jobSchema = z.object({
  tipo: z.string().optional().transform((v) => (v && v.trim() ? v : TIPO_JOB_PADRAO)),
  prioridade: z.string().optional().transform((v) => (v && v.trim() ? v : "normal")),
  titulo: z.string().trim().min(1, "Informe o título."),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  projetoId: z.string().optional().transform((v) => (v ? v : null)),
  responsavelId: z.string().optional().transform((v) => (v ? v : null)),
  statusId: z.string().optional().transform((v) => (v ? v : null)),
  prazo: z.string().optional().transform(dataOpt),
  prazoPostagem: z.string().optional().transform(dataOpt),
  recorrenciaFreq: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  recorrenciaProxima: z.string().optional().transform(dataOpt),
  bloqueadoPorId: z.string().optional().transform((v) => (v ? v : null)),
  legenda: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  briefing: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
});

export async function salvarJob(
  id: string | null,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  let destino = "";
  try {
    const user = await assertPapel(TRABALHAR);
    const parsed = jobSchema.safeParse({
      tipo: formData.get("tipo")?.toString(),
      prioridade: formData.get("prioridade")?.toString(),
      titulo: formData.get("titulo")?.toString(),
      clienteId: formData.get("clienteId")?.toString(),
      projetoId: formData.get("projetoId")?.toString(),
      responsavelId: formData.get("responsavelId")?.toString(),
      statusId: formData.get("statusId")?.toString(),
      prazo: formData.get("prazo")?.toString(),
      prazoPostagem: formData.get("prazoPostagem")?.toString(),
      recorrenciaFreq: formData.get("recorrenciaFreq")?.toString(),
      recorrenciaProxima: formData.get("recorrenciaProxima")?.toString(),
      bloqueadoPorId: formData.get("bloqueadoPorId")?.toString(),
      legenda: formData.get("legenda")?.toString(),
      briefing: formData.get("briefing")?.toString(),
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

    // Status padrão = primeiro da ordem; responsável padrão = usuário logado.
    let statusId = d.statusId;
    if (!statusId) {
      const primeiro = await db.jobStatus.findFirst({ where: { ativo: true }, orderBy: { ordem: "asc" } });
      if (!primeiro) return { error: "Nenhum status de job configurado." };
      statusId = primeiro.id;
    }
    const statusAlvo = await db.jobStatus.findUnique({ where: { id: statusId } });
    const concluidoEm = statusAlvo?.isConcluido ? new Date() : null;

    const ehSocial = tipoJobSocial(d.tipo);
    const formatos = ehSocial ? formData.getAll("formatos").map(String).filter(Boolean).join(",") || null : null;
    const envolvidos = [...new Set(formData.getAll("envolvidos").map(String).filter(Boolean))];

    const data = {
      tipo: d.tipo,
      prioridade: d.prioridade,
      titulo: d.titulo,
      clienteId: d.clienteId,
      projetoId: d.projetoId,
      responsavelId: d.responsavelId ?? user.id,
      statusId,
      prazo: d.prazo,
      prazoPostagem: ehSocial ? d.prazoPostagem : null,
      recorrenciaFreq: d.recorrenciaFreq,
      recorrenciaProxima: d.recorrenciaFreq ? d.recorrenciaProxima : null,
      bloqueadoPorId: d.bloqueadoPorId && d.bloqueadoPorId !== id ? d.bloqueadoPorId : null,
      legenda: ehSocial ? d.legenda : null,
      formatos,
      briefing: d.briefing,
    };

    let jobId: string;
    if (id) {
      const anterior = await db.job.findUnique({ where: { id }, select: { responsavelId: true, prazoPostagem: true, prazoPostagemOriginal: true, remarcacoesPostagem: true } });
      // Aderência ao calendário: conta remarcação quando a data de postagem muda de dia.
      const novoPP = data.prazoPostagem;
      const remarc: { remarcacoesPostagem?: number; prazoPostagemOriginal?: Date } = {};
      if (ehSocial && novoPP) {
        if (anterior?.prazoPostagem && !mesmoDia(novoPP, anterior.prazoPostagem)) {
          remarc.remarcacoesPostagem = (anterior.remarcacoesPostagem ?? 0) + 1;
          remarc.prazoPostagemOriginal = anterior.prazoPostagemOriginal ?? anterior.prazoPostagem;
        } else if (!anterior?.prazoPostagemOriginal) {
          remarc.prazoPostagemOriginal = novoPP;
        }
      }
      await db.job.update({ where: { id }, data: { ...data, ...remarc } });
      jobId = id;
      await registrarLog({ entidadeTipo: "job", entidadeId: id, usuarioId: user.id, acao: "editou o job" });
      if (data.responsavelId && data.responsavelId !== anterior?.responsavelId) {
        await notificar({ usuarioId: data.responsavelId, atorId: user.id, tipo: "atribuicao", titulo: `Você é responsável por "${d.titulo}"`, entidadeTipo: "job", entidadeId: id, url: `/jobs/${id}` });
      }
      destino = `/jobs/${id}`;
    } else {
      const numero = await proximoNumero("JOB");
      const criado = await db.job.create({ data: { ...data, numero, concluidoEm, prazoPostagemOriginal: ehSocial ? data.prazoPostagem : null, criadoPorId: user.id } });
      jobId = criado.id;
      await registrarLog({ entidadeTipo: "job", entidadeId: criado.id, usuarioId: user.id, acao: `criou o job #${numero}` });
      await notificar({ usuarioId: data.responsavelId, atorId: user.id, tipo: "atribuicao", titulo: `Você é responsável por "${d.titulo}"`, entidadeTipo: "job", entidadeId: criado.id, url: `/jobs/${criado.id}` });
      destino = `/jobs/${criado.id}`;
    }

    // Envolvidos: substitui o conjunto + avisa os novos.
    const antigos = (await db.jobEnvolvido.findMany({ where: { jobId }, select: { usuarioId: true } })).map((e) => e.usuarioId);
    await db.jobEnvolvido.deleteMany({ where: { jobId } });
    if (envolvidos.length) {
      await db.jobEnvolvido.createMany({ data: envolvidos.map((usuarioId) => ({ jobId, usuarioId })), skipDuplicates: true });
      const novos = envolvidos.filter((u) => !antigos.includes(u) && u !== user.id);
      await notificarMuitos(novos, { atorId: user.id, tipo: "atribuicao", titulo: `Você foi incluído no job "${d.titulo}"`, entidadeTipo: "job", entidadeId: jobId, url: `/jobs/${jobId}` });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o job." };
  }
  revalidatePath("/jobs");
  redirect(destino);
}

export async function moverJobStatus(id: string, statusId: string) {
  const user = await assertPapel(TRABALHAR);
  const [job, status] = await Promise.all([
    db.job.findUnique({ where: { id }, select: { statusId: true, concluidoEm: true, responsavelId: true, titulo: true, prazoPostagem: true, publicadoEm: true, status: { select: { nome: true } } } }),
    db.jobStatus.findUnique({ where: { id: statusId } }),
  ]);
  if (!status) throw new Error("Status inválido.");

  const concluidoEm = status.isConcluido ? (job?.concluidoEm ?? new Date()) : null;
  // Peça de postagem concluída sem data de publicação: assume publicada agora (pode ser ajustado no job).
  const publicadoEm = status.isConcluido && job?.prazoPostagem && !job.publicadoEm ? concluidoEm : undefined;

  await db.job.update({ where: { id }, data: { statusId, concluidoEm, ...(publicadoEm !== undefined ? { publicadoEm } : {}) } });
  await registrarLog({
    entidadeTipo: "job",
    entidadeId: id,
    usuarioId: user.id,
    acao: "moveu o status",
    de: job?.status?.nome ?? null,
    para: status.nome,
  });
  if (job?.responsavelId) {
    await notificar({
      usuarioId: job.responsavelId,
      atorId: user.id,
      tipo: "status",
      titulo: `Status do job "${job.titulo}" mudou`,
      descricao: `${job.status?.nome ?? ""} → ${status.nome}`,
      entidadeTipo: "job",
      entidadeId: id,
      url: `/jobs/${id}`,
    });
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
}

export async function arquivarJob(id: string, arquivar: boolean) {
  const user = await assertPapel(GERIR);
  await db.job.update({ where: { id }, data: { arquivado: arquivar } });
  await registrarLog({ entidadeTipo: "job", entidadeId: id, usuarioId: user.id, acao: arquivar ? "arquivou o job" : "reativou o job" });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
}

export async function excluirJob(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  await db.job.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "job", entidadeId: id, usuarioId: user.id, acao: "excluiu o job" });
  revalidatePath("/jobs");
  redirect("/jobs");
}

/** Duplica um job/postagem: novo número, "(cópia)", status reiniciado, copia subtarefas e envolvidos. */
export async function duplicarJob(id: string) {
  const user = await assertPapel(TRABALHAR);
  const orig = await db.job.findUnique({
    where: { id },
    include: { tarefas: { orderBy: { ordem: "asc" } }, envolvidos: { select: { usuarioId: true } } },
  });
  if (!orig) throw new Error("Job não encontrado.");

  const primeiro = await db.jobStatus.findFirst({ where: { ativo: true }, orderBy: { ordem: "asc" } });
  const numero = await proximoNumero("JOB");
  const novo = await db.job.create({
    data: {
      numero,
      tipo: orig.tipo,
      titulo: `${orig.titulo} (cópia)`,
      clienteId: orig.clienteId,
      projetoId: orig.projetoId,
      responsavelId: orig.responsavelId,
      statusId: primeiro?.id ?? orig.statusId,
      prazo: orig.prazo,
      prazoPostagem: orig.prazoPostagem,
      legenda: orig.legenda,
      formatos: orig.formatos,
      briefing: orig.briefing,
      criadoPorId: user.id,
      tarefas: { create: orig.tarefas.map((t) => ({ descricao: t.descricao, responsavelId: t.responsavelId, ordem: t.ordem, concluida: false })) },
      envolvidos: { create: orig.envolvidos.map((e) => ({ usuarioId: e.usuarioId })) },
    },
  });
  await registrarLog({ entidadeTipo: "job", entidadeId: novo.id, usuarioId: user.id, acao: `duplicou de #${orig.numero}` });
  revalidatePath("/jobs");
  redirect(`/jobs/${novo.id}`);
}

/** Marca (ou desmarca) a data em que a peça de postagem foi publicada — alimenta a aderência ao calendário. */
export async function marcarPublicada(id: string, publicada: boolean) {
  const user = await assertPapel(TRABALHAR);
  await db.job.update({ where: { id }, data: { publicadoEm: publicada ? new Date() : null } });
  await registrarLog({ entidadeTipo: "job", entidadeId: id, usuarioId: user.id, acao: publicada ? "marcou como publicada" : "desmarcou a publicação" });
  revalidatePath(`/jobs/${id}`);
}

// ── Subtarefas ────────────────────────────────────────────────────────

export async function adicionarTarefa(jobId: string, formData: FormData) {
  const user = await userOrThrow();
  const descricao = formData.get("descricao")?.toString().trim();
  const responsavelId = formData.get("responsavelId")?.toString() || null;
  if (!descricao) return;
  const ultima = await db.jobTarefa.findFirst({ where: { jobId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.jobTarefa.create({
    data: { jobId, descricao, responsavelId, ordem: (ultima?.ordem ?? 0) + 1 },
  });
  if (responsavelId) {
    await notificar({ usuarioId: responsavelId, atorId: user.id, tipo: "atribuicao", titulo: "Nova subtarefa atribuída a você", descricao, entidadeTipo: "job", entidadeId: jobId, url: `/jobs/${jobId}` });
  }
  revalidatePath(`/jobs/${jobId}`);
}

export async function toggleTarefa(id: string) {
  await userOrThrow();
  const t = await db.jobTarefa.findUnique({ where: { id }, select: { concluida: true, jobId: true } });
  if (!t) return;
  await db.jobTarefa.update({ where: { id }, data: { concluida: !t.concluida } });
  revalidatePath(`/jobs/${t.jobId}`);
}

export async function removerTarefa(id: string) {
  await userOrThrow();
  const t = await db.jobTarefa.findUnique({ where: { id }, select: { jobId: true } });
  if (!t) return;
  await db.jobTarefa.delete({ where: { id } });
  revalidatePath(`/jobs/${t.jobId}`);
}

// ── Gestão de status (kanban configurável) ────────────────────────────

const statusSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  cor: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  isConcluido: z.boolean(),
});

export async function salvarJobStatus(
  id: string | null,
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  try {
    await assertPapel(GERIR);
    const parsed = statusSchema.safeParse({
      nome: formData.get("nome")?.toString(),
      cor: formData.get("cor")?.toString(),
      isConcluido: formData.get("isConcluido") === "on",
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }
    const d = parsed.data;
    if (id) {
      await db.jobStatus.update({ where: { id }, data: { nome: d.nome, cor: d.cor, isConcluido: d.isConcluido } });
    } else {
      const ultima = await db.jobStatus.findFirst({ orderBy: { ordem: "desc" }, select: { ordem: true } });
      await db.jobStatus.create({ data: { nome: d.nome, cor: d.cor, isConcluido: d.isConcluido, ordem: (ultima?.ordem ?? 0) + 1 } });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o status." };
  }
  revalidatePath("/jobs/status");
  revalidatePath("/jobs");
  return {};
}

export async function moverOrdemStatus(id: string, direcao: "cima" | "baixo") {
  await assertPapel(GERIR);
  const lista = await db.jobStatus.findMany({ orderBy: { ordem: "asc" } });
  const idx = lista.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const alvoIdx = direcao === "cima" ? idx - 1 : idx + 1;
  if (alvoIdx < 0 || alvoIdx >= lista.length) return;
  const a = lista[idx];
  const b = lista[alvoIdx];
  await db.$transaction([
    db.jobStatus.update({ where: { id: a.id }, data: { ordem: b.ordem } }),
    db.jobStatus.update({ where: { id: b.id }, data: { ordem: a.ordem } }),
  ]);
  revalidatePath("/jobs/status");
  revalidatePath("/jobs");
}

export async function excluirJobStatus(id: string) {
  await assertPapel(GERIR);
  const usados = await db.job.count({ where: { statusId: id } });
  if (usados > 0) throw new Error(`Há ${usados} job(s) neste status. Mova-os antes de excluir.`);
  await db.jobStatus.delete({ where: { id } });
  revalidatePath("/jobs/status");
  revalidatePath("/jobs");
}
