"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { notificar } from "@/lib/notificacoes";
import { enviarEmail, layoutEmail, baseUrl } from "@/lib/email";

const TRABALHAR: "OPERADOR" = "OPERADOR";

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
