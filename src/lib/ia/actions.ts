"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { iaConfigurada, gerarTextoIA } from "@/lib/ia";

export type IaResultado = { texto?: string; error?: string };

/** Remove tags HTML (campos rich-text) para mandar texto limpo à IA. */
function semHtml(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const INDISPONIVEL = "Assistente de IA não está configurado. Peça ao administrador para definir a chave da API (ANTHROPIC_API_KEY).";

const SYSTEM_ATA =
  "Você é assistente de uma agência de publicidade. Escreva atas de reunião claras e objetivas em português do Brasil, " +
  "em tópicos, sem inventar informações. Use apenas o que for fornecido. Estruture em: Resumo, Decisões e Próximos passos " +
  "(com responsável quando houver). O texto é uma SUGESTÃO que será revisada por uma pessoa.";

const SYSTEM_BRIEFING =
  "Você é assistente de uma agência de publicidade. Escreva briefings de job/criação claros e acionáveis em português do Brasil, " +
  "sem inventar dados. A partir das informações fornecidas, organize: Objetivo, Mensagem-chave, Requisitos/entregáveis e " +
  "Observações. O texto é uma SUGESTÃO para revisão humana.";

/** Gera um rascunho de ata a partir dos dados da reunião. */
export async function gerarAtaIA(reuniaoId: string): Promise<IaResultado> {
  await requireUser();
  if (!iaConfigurada()) return { error: INDISPONIVEL };
  const r = await db.reuniao.findUnique({
    where: { id: reuniaoId },
    include: { cliente: { select: { nome: true } } },
  });
  if (!r) return { error: "Reunião não encontrada." };

  const ctx = [
    `Título: ${r.titulo}`,
    r.cliente?.nome ? `Cliente: ${r.cliente.nome}` : "Reunião interna",
    r.participantes ? `Participantes: ${semHtml(r.participantes)}` : "",
    semHtml(r.pauta) ? `Pauta/discussão:\n${semHtml(r.pauta)}` : "",
    semHtml(r.decisoes) ? `Decisões (rascunho):\n${semHtml(r.decisoes)}` : "",
    semHtml(r.proximosPassos) ? `Próximos passos (rascunho):\n${semHtml(r.proximosPassos)}` : "",
  ].filter(Boolean).join("\n\n");

  const texto = await gerarTextoIA(SYSTEM_ATA, `Monte a ata desta reunião a partir das anotações:\n\n${ctx}`, 1200);
  if (!texto) return { error: "Não foi possível gerar agora. Tente novamente." };
  return { texto };
}

/** Gera/expande um briefing a partir do job. */
export async function gerarBriefingIA(jobId: string): Promise<IaResultado> {
  await requireUser();
  if (!iaConfigurada()) return { error: INDISPONIVEL };
  const j = await db.job.findUnique({
    where: { id: jobId },
    include: { cliente: { select: { nome: true } } },
  });
  if (!j) return { error: "Job não encontrado." };

  const ctx = [
    `Título: ${j.titulo}`,
    `Tipo: ${j.tipo}`,
    j.cliente?.nome ? `Cliente: ${j.cliente.nome}` : "",
    j.legenda ? `Legenda/texto:\n${j.legenda}` : "",
    j.briefing ? `Briefing atual (rascunho):\n${j.briefing}` : "",
  ].filter(Boolean).join("\n\n");

  const texto = await gerarTextoIA(SYSTEM_BRIEFING, `Organize/expanda o briefing deste job a partir das informações:\n\n${ctx}`, 1000);
  if (!texto) return { error: "Não foi possível gerar agora. Tente novamente." };
  return { texto };
}
