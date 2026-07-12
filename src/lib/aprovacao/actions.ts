"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { notificar } from "@/lib/notificacoes";
import { enviarEmail, layoutEmail, baseUrl } from "@/lib/email";

const TRABALHAR: "OPERADOR" = "OPERADOR";
const MAX_ARQUIVO = 4 * 1024 * 1024; // 4 MB, mesmo limite do upload comum

function novoToken() {
  return randomBytes(24).toString("hex"); // 48 chars, inadivinhável
}

/** Interno: gera/renova o link público e marca a peça como enviada para aprovação. */
export async function enviarParaAprovacao(jobId: string, formData?: FormData): Promise<void> {
  const user = await assertPapel(TRABALHAR);
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { aprovacaoToken: true, aprovacaoStatus: true, titulo: true, cliente: { select: { email: true, nome: true } } },
  });
  if (!job) throw new Error("Job não encontrado.");

  const token = job.aprovacaoToken ?? novoToken();
  const reenvio = job.aprovacaoStatus !== "rascunho";

  await db.job.update({
    where: { id: jobId },
    data: { aprovacaoToken: token, aprovacaoStatus: "enviado", aprovacaoEm: new Date() },
  });
  await db.aprovacaoEvento.create({
    data: { jobId, acao: reenvio ? "reenviado" : "enviado", autor: user.name ?? "Equipe" },
  });
  await registrarLog({ entidadeTipo: "job", entidadeId: jobId, usuarioId: user.id, acao: reenvio ? "reenviou para aprovação" : "enviou para aprovação" });

  // E-mail opcional para o cliente (se informado no form ou cadastrado).
  const emailDestino = formData?.get("emailCliente")?.toString().trim() || job.cliente?.email || null;
  if (emailDestino) {
    const link = `${baseUrl()}/aprovar/${token}`;
    await enviarEmail({
      to: emailDestino,
      subject: `Aprovação de peça — ${job.titulo}`,
      html: layoutEmail({
        titulo: "Uma peça aguarda sua aprovação",
        corpo: `Olá! A Plante preparou <strong>${job.titulo}</strong> e gostaria da sua aprovação. Abra o link, confira a arte e a legenda, e aprove ou peça ajustes.`,
        linkUrl: link,
        linkTexto: "Ver e aprovar a peça",
        rodape: "Link exclusivo de aprovação. Não é necessário login.",
      }),
    });
  }

  revalidatePath(`/jobs/${jobId}`);
}

/** Interno: cancela a aprovação (volta para rascunho e invalida o link). */
export async function cancelarAprovacao(jobId: string) {
  const user = await assertPapel(TRABALHAR);
  await db.job.update({ where: { id: jobId }, data: { aprovacaoStatus: "rascunho", aprovacaoToken: null, aprovacaoEm: null } });
  await registrarLog({ entidadeTipo: "job", entidadeId: jobId, usuarioId: user.id, acao: "cancelou a aprovação" });
  revalidatePath(`/jobs/${jobId}`);
}

export type NovaVersaoState = { ok?: boolean; error?: string };

/**
 * Interno: rebaixa os anexos atuais do job para `atual=false`, sobe os novos
 * arquivos/links como versão seguinte, e reenvia a peça para aprovação.
 * O cliente reabre o mesmo link e vê a nova arte; as versões anteriores
 * ficam disponíveis num expansor no fim da página.
 */
export async function enviarNovaVersaoParaAprovacao(
  jobId: string,
  _prev: NovaVersaoState,
  formData: FormData,
): Promise<NovaVersaoState> {
  const user = await assertPapel(TRABALHAR);

  const arquivos = formData.getAll("arquivos").filter((f): f is File => f instanceof File && f.size > 0);
  const linksBrutos = formData
    .getAll("links")
    .map((v) => v.toString().trim())
    .filter(Boolean);

  if (arquivos.length === 0 && linksBrutos.length === 0) {
    return { error: "Selecione ao menos um arquivo ou informe um link." };
  }
  for (const f of arquivos) {
    if (f.size > MAX_ARQUIVO) return { error: `Arquivo "${f.name}" acima de 4 MB.` };
  }

  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { aprovacaoToken: true, aprovacaoStatus: true, titulo: true, cliente: { select: { email: true, nome: true } } },
  });
  if (!job) return { error: "Job não encontrado." };

  const versaoMaxAtual = await db.anexo.aggregate({
    where: { entidadeTipo: "job", entidadeId: jobId },
    _max: { versao: true },
  });
  const proximaVersao = (versaoMaxAtual._max.versao ?? 0) + 1;

  // Sobe os arquivos primeiro (falha antes de mexer no schema do job).
  const novos: { nome: string; tipo: "arquivo" | "link"; blobKey?: string; url?: string; tamanho?: number; contentType?: string }[] = [];
  try {
    if (arquivos.length > 0) {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("anexos");
      for (const file of arquivos) {
        const key = `job/${jobId}/${crypto.randomUUID()}`;
        await store.set(key, await file.arrayBuffer());
        novos.push({
          nome: file.name || "arquivo",
          tipo: "arquivo",
          blobKey: key,
          tamanho: file.size,
          contentType: file.type || "application/octet-stream",
        });
      }
    }
    for (const url of linksBrutos) {
      const nome = url.split("/").pop() || "link";
      novos.push({ nome, tipo: "link", url });
    }
  } catch (e) {
    return { error: `Falha ao subir a nova versão: ${e instanceof Error ? e.message : String(e)}` };
  }

  const token = job.aprovacaoToken ?? novoToken();

  await db.$transaction([
    db.anexo.updateMany({
      where: { entidadeTipo: "job", entidadeId: jobId, atual: true },
      data: { atual: false },
    }),
    db.anexo.createMany({
      data: novos.map((n) => ({
        entidadeTipo: "job",
        entidadeId: jobId,
        nome: n.nome,
        tipo: n.tipo,
        blobKey: n.blobKey,
        url: n.url,
        tamanho: n.tamanho,
        contentType: n.contentType,
        versao: proximaVersao,
        atual: true,
        criadoPorId: user.id,
      })),
    }),
    db.job.update({
      where: { id: jobId },
      data: { aprovacaoToken: token, aprovacaoStatus: "enviado", aprovacaoEm: new Date() },
    }),
    db.aprovacaoEvento.create({
      data: { jobId, acao: "reenviado", autor: user.name ?? "Equipe", comentario: `Nova versão (v${proximaVersao}) enviada.` },
    }),
  ]);

  await registrarLog({ entidadeTipo: "job", entidadeId: jobId, usuarioId: user.id, acao: `enviou v${proximaVersao} para aprovação` });

  const emailDestino = job.cliente?.email || null;
  if (emailDestino) {
    const link = `${baseUrl()}/aprovar/${token}`;
    await enviarEmail({
      to: emailDestino,
      subject: `Nova versão para aprovação — ${job.titulo}`,
      html: layoutEmail({
        titulo: "Ajustes aplicados — confira a nova versão",
        corpo: `Olá! Ajustamos <strong>${job.titulo}</strong> conforme sua solicitação. Abra o link para conferir e aprovar.`,
        linkUrl: link,
        linkTexto: "Ver a nova versão",
        rodape: "Link exclusivo de aprovação. Não é necessário login.",
      }),
    });
  }

  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export type RespostaState = { ok?: boolean; error?: string };

/**
 * PÚBLICO (sem login): cliente aprova ou solicita ajustes pelo link.
 * Valida o token e o estado atual; notifica o responsável interno.
 */
export async function responderAprovacao(token: string, _prev: RespostaState, formData: FormData): Promise<RespostaState> {
  try {
    const job = await db.job.findUnique({
      where: { aprovacaoToken: token },
      select: { id: true, titulo: true, aprovacaoStatus: true, responsavelId: true },
    });
    if (!job) return { error: "Link inválido ou expirado." };
    if (job.aprovacaoStatus !== "enviado") {
      return { error: "Esta peça já foi respondida. Recarregue a página para ver o status." };
    }

    const decisao = formData.get("decisao")?.toString();
    const autor = formData.get("autor")?.toString().trim() || "Cliente";
    const comentario = formData.get("comentario")?.toString().trim() || null;
    if (decisao !== "aprovado" && decisao !== "ajustes") return { error: "Escolha aprovar ou solicitar ajustes." };
    if (decisao === "ajustes" && !comentario) return { error: "Descreva os ajustes desejados." };

    await db.job.update({ where: { id: job.id }, data: { aprovacaoStatus: decisao } });
    await db.aprovacaoEvento.create({ data: { jobId: job.id, acao: decisao, autor, comentario } });
    await registrarLog({
      entidadeTipo: "job", entidadeId: job.id, usuarioId: null,
      acao: decisao === "aprovado" ? "cliente aprovou a peça" : "cliente solicitou ajustes",
      para: autor,
    });

    if (job.responsavelId) {
      await notificar({
        usuarioId: job.responsavelId,
        tipo: "status",
        titulo: decisao === "aprovado" ? `✅ Cliente aprovou "${job.titulo}"` : `✏️ Cliente pediu ajustes em "${job.titulo}"`,
        descricao: comentario ?? undefined,
        entidadeTipo: "job",
        entidadeId: job.id,
        url: `/jobs/${job.id}`,
      });
    }

    revalidatePath(`/jobs/${job.id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível registrar sua resposta." };
  }
}
