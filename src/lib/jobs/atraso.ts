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

export function atrasoDoJob(job: AtrasoInput, agora: Date = new Date()): AtrasoInfo {
  const social = tipoJobSocial(job.tipo);

  if (social && job.prazoPostagem) {
    const atrasado = !job.publicadoEm && !job.isConcluido && job.prazoPostagem.getTime() < agora.getTime();
    return { dataAlvo: job.prazoPostagem, atrasado, ehPostagem: true };
  }

  const prazo = job.prazo ?? null;
  const atrasado = !!prazo && !job.isConcluido && prazo.getTime() < agora.getTime();
  return { dataAlvo: prazo, atrasado, ehPostagem: false };
}
