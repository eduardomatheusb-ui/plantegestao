/**
 * Regra automática e imutável de "concluído fora do prazo".
 *
 * A flag é carimbada NO MOMENTO da conclusão (comparando a data de conclusão
 * com o prazo daquele instante) e não é recalculada depois — assim ninguém
 * "burla" mudando o prazo após concluir. Comparação por DIA: concluir no
 * próprio dia do prazo conta como no prazo.
 */

function diaLocal(d: Date): number {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
}

/** true se a conclusão caiu em um dia posterior ao prazo. Sem prazo → false. */
export function foraDoPrazo(concluido: Date, prazo: Date | null | undefined): boolean {
  if (!prazo) return false;
  return diaLocal(concluido) > diaLocal(prazo);
}

/**
 * Campos de conclusão a gravar. Preserva a data e a flag se o item já estava
 * concluído (não recarimba em edições posteriores); limpa tudo se reaberto.
 */
export function camposConclusao(
  concluido: boolean,
  jaConcluidoEm: Date | null | undefined,
  jaForaPrazo: boolean | null | undefined,
  prazo: Date | null | undefined,
): { concluidoEm: Date | null; concluidoForaPrazo: boolean | null } {
  if (!concluido) return { concluidoEm: null, concluidoForaPrazo: null };
  if (jaConcluidoEm) return { concluidoEm: jaConcluidoEm, concluidoForaPrazo: jaForaPrazo ?? false };
  const agora = new Date();
  return { concluidoEm: agora, concluidoForaPrazo: foraDoPrazo(agora, prazo) };
}
