import { tipoJobSocial } from "./tipos";

/**
 * Qual prazo vale para o alerta de "atrasado", e se está atrasado.
 *
 * Um post tem DUAS datas: prazo de criação (`prazo`) e prazo de postagem
 * (`prazoPostagem`). Antes, o vermelho olhava sempre a de criação, então uma
 * peça já criada mas ainda não publicada (data de postagem remarcada) aparecia
 * atrasada na data de criação. Para quem cuida da postagem, isso é a data errada.
 *
 * Regra: em post (tipo social) com data de postagem, o que vale é a POSTAGEM
 * (atrasado = passou da data e ainda não foi publicado). Nos demais casos, vale
 * o prazo comum. A data de criação continua visível, mas deixa de puxar o
 * alarme quando já se está na fase de postagem.
 */
export type AtrasoInput = {
  tipo: string | null | undefined;
  prazo: Date | null | undefined;
  prazoPostagem: Date | null | undefined;
  publicadoEm: Date | null | undefined;
  isConcluido: boolean;
};

export type AtrasoInfo = {
  /** A data que vale para o alerta (postagem no caso de post, senão o prazo). */
  dataAlvo: Date | null;
  /** True se essa data já passou e o item ainda não está pronto. */
  atrasado: boolean;
  /** True quando a data que vale é a de postagem (post social). */
  ehPostagem: boolean;
};

const FMT_DIA_SP = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric", month: "2-digit", day: "2-digit",
});

/** O dia de calendário de Brasília (como número comparável), para "hoje". */
function diaBrasilia(d: Date): number {
  const [ano, mes, dia] = FMT_DIA_SP.format(d).split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/**
 * O dia guardado numa data "só dia" (lido em UTC).
 *
 * Prazos são guardados em meia-noite UTC do dia escolhido, então o dia deles é o
 * dia UTC. Comparamos por DIA de calendário com o dia de HOJE em Brasília, em vez
 * de comparar instantes. Antes, como o prazo era meia-noite UTC (21h do dia
 * anterior em Brasília), o vermelho acendia na véspera à noite. Agora o alerta
 * acompanha o dia certo: acende a partir do próprio dia do prazo, no fuso daqui.
 */
function diaGuardado(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function atrasoDoJob(job: AtrasoInput, agora: Date = new Date()): AtrasoInfo {
  const social = tipoJobSocial(job.tipo);
  const hoje = diaBrasilia(agora);

  if (social && job.prazoPostagem) {
    const atrasado = !job.publicadoEm && !job.isConcluido && diaGuardado(job.prazoPostagem) <= hoje;
    return { dataAlvo: job.prazoPostagem, atrasado, ehPostagem: true };
  }

  const prazo = job.prazo ?? null;
  const atrasado = !!prazo && !job.isConcluido && diaGuardado(prazo) <= hoje;
  return { dataAlvo: prazo, atrasado, ehPostagem: false };
}
