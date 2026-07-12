"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertPapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { notificar } from "@/lib/notificacoes";
import { enviarEmail, layoutEmail, baseUrl } from "@/lib/email";

const TRABALHAR: "OPERADOR" = "OPERADOR";

function novoToken() {
  return randomBytes(24).toString("hex");
}

export type CriarLoteState = { error?: string };

/**
 * Interno: cria uma rodada de aprovação agrupando N jobs de um cliente num único
 * link público. Marca cada job como "enviado" e dispara UM e-mail ao cliente.
 * Redireciona para o detalhe do lote ao concluir.
 */
export async function criarLoteAprovacao(_prev: CriarLoteState, formData: FormData): Promise<CriarLoteState> {
  const user = await assertPapel(TRABALHAR);

  const clienteId = formData.get("clienteId")?.toString();
  const titulo = formData.get("titulo")?.toString().trim() || null;
  const jobIds = formData.getAll("jobIds").map((v) => v.toString()).filter(Boolean);

  if (!clienteId) return { error: "Selecione um cliente." };
  if (jobIds.length === 0) return { error: "Selecione ao menos uma peça." };

  const cliente = await db.cliente.findUnique({ where: { id: clienteId }, select: { id: true, nome: true, email: true } });
  if (!cliente) return { error: "Cliente não encontrado." };

  // Só aceita jobs que realmente pertencem ao cliente (evita adulteração do form).
  const jobs = await db.job.findMany({
    where: { id: { in: jobIds }, clienteId, arquivado: false },
    select: { id: true, titulo: true, responsavelId: true, aprovacaoToken: true },
  });
  if (jobs.length === 0) return { error: "Nenhuma peça válida para este cliente." };

  const token = novoToken();
  const agora = new Date();

  const lote = await db.aprovacaoLote.create({
    data: {
      clienteId,
      token,
      titulo,
      criadoPorId: user.id,
      itens: {
        create: jobs.map((j, i) => ({ jobId: j.id, ordem: i })),
      },
    },
    select: { id: true },
  });

  // Cada job entra em "enviado"; garante um aprovacaoToken individual também (fallback).
  await db.$transaction([
    ...jobs.map((j) =>
      db.job.update({
        where: { id: j.id },
        data: {
          aprovacaoStatus: "enviado",
          aprovacaoEm: agora,
          aprovacaoToken: j.aprovacaoToken ?? novoToken(),
        },
      }),
    ),
    ...jobs.map((j) =>
      db.aprovacaoEvento.create({
        data: { jobId: j.id, acao: "enviado", autor: user.name ?? "Equipe", comentario: `Rodada de aprovação${titulo ? ` — ${titulo}` : ""}.` },
      }),
    ),
  ]);

  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: `criou rodada de aprovação com ${jobs.length} peça(s)` });

  if (cliente.email) {
    const link = `${baseUrl()}/aprovar/lote/${token}`;
    await enviarEmail({
      to: cliente.email,
      subject: `Aprovação de conteúdo${titulo ? ` — ${titulo}` : ""} · Plante`,
      html: layoutEmail({
        titulo: titulo || "Novas peças para sua aprovação",
        corpo: `Olá! Preparamos <strong>${jobs.length} peça(s)</strong> para sua aprovação. Abra o link, confira cada uma e aprove ou peça ajustes — tudo em um só lugar.`,
        linkUrl: link,
        linkTexto: "Ver e aprovar as peças",
        rodape: "Link exclusivo de aprovação. Não é necessário login.",
      }),
    });
  }

  redirect(`/jobs/aprovacao-lote/${lote.id}`);
}

export type RespostaLoteState = { ok?: boolean; error?: string };

/**
 * PÚBLICO (sem login): cliente responde uma rodada inteira de uma vez.
 * Cada item recebe decisao_<jobId> (aprovado|ajustes) e comentario_<jobId>.
 * Grava as decisões, atualiza cada job, cria eventos e notifica responsáveis.
 */
export async function responderLoteAprovacao(token: string, _prev: RespostaLoteState, formData: FormData): Promise<RespostaLoteState> {
  try {
    const lote = await db.aprovacaoLote.findUnique({
      where: { token },
      select: {
        id: true,
        status: true,
        titulo: true,
        itens: { select: { jobId: true, decisao: true, job: { select: { id: true, titulo: true, responsavelId: true, aprovacaoStatus: true } } } },
      },
    });
    if (!lote) return { error: "Link inválido ou expirado." };

    const autor = formData.get("autor")?.toString().trim() || "Cliente";

    // Coleta as decisões enviadas neste POST (só as respondidas agora).
    const respostas: { jobId: string; decisao: "aprovado" | "ajustes"; comentario: string | null }[] = [];
    for (const item of lote.itens) {
      const d = formData.get(`decisao_${item.jobId}`)?.toString();
      if (d !== "aprovado" && d !== "ajustes") continue; // não respondido nesta rodada
      const comentario = formData.get(`comentario_${item.jobId}`)?.toString().trim() || null;
      if (d === "ajustes" && !comentario) {
        return { error: "Descreva os ajustes em todas as peças marcadas como 'Solicitar ajustes'." };
      }
      respostas.push({ jobId: item.jobId, decisao: d, comentario });
    }

    if (respostas.length === 0) return { error: "Marque ao menos uma peça como aprovada ou com ajustes." };

    const agora = new Date();
    const jobById = new Map(lote.itens.map((i) => [i.jobId, i.job]));

    for (const r of respostas) {
      await db.$transaction([
        db.aprovacaoLoteItem.update({
          where: { loteId_jobId: { loteId: lote.id, jobId: r.jobId } },
          data: { decisao: r.decisao, comentario: r.comentario, autorNome: autor, respondidoEm: agora },
        }),
        db.job.update({ where: { id: r.jobId }, data: { aprovacaoStatus: r.decisao } }),
        db.aprovacaoEvento.create({ data: { jobId: r.jobId, acao: r.decisao, autor, comentario: r.comentario } }),
      ]);

      const job = jobById.get(r.jobId);
      if (job?.responsavelId) {
        await notificar({
          usuarioId: job.responsavelId,
          tipo: "status",
          titulo: r.decisao === "aprovado" ? `✅ Cliente aprovou "${job.titulo}"` : `✏️ Cliente pediu ajustes em "${job.titulo}"`,
          descricao: r.comentario ?? undefined,
          entidadeTipo: "job",
          entidadeId: r.jobId,
          url: `/jobs/${r.jobId}`,
        });
      }
    }

    // Encerra o lote quando todos os itens têm decisão.
    const pendentes = await db.aprovacaoLoteItem.count({ where: { loteId: lote.id, decisao: null } });
    if (pendentes === 0) {
      await db.aprovacaoLote.update({ where: { id: lote.id }, data: { status: "encerrado", encerradoEm: agora } });
    }

    await registrarLog({
      entidadeTipo: "aprovacaoLote",
      entidadeId: lote.id,
      usuarioId: null,
      acao: `cliente respondeu ${respostas.length} peça(s) da rodada`,
      para: autor,
    });

    revalidatePath(`/jobs/aprovacao-lote/${lote.id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível registrar suas respostas." };
  }
}
