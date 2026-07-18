/**
 * Regra de ÁREA por tipo de job — quem entra sozinho como corresponsável.
 *
 * A área é identificada pela FUNÇÃO da pessoa (Colaborador.funcao, o mesmo texto
 * do cadastro): se a função contiver algum dos termos da área, a pessoa entra.
 * A regra segue a área, nunca uma pessoa — se entrar outro profissional com a
 * mesma função, ele já participa; se alguém mudar de função, sai.
 *
 * Os valores aqui são o PADRÃO DE FÁBRICA. O que estiver salvo em
 * Configurações → Fluxos de trabalho tem prioridade (ver lib/jobs/config.ts).
 */

/** Termos de função por tipo de job. Hoje: reels → audiovisual. */
export const AREA_PADRAO: Record<string, string[]> = {
  reels: ["videomaker", "audiovisual", "edição", "editor", "motion", "filmmaker", "cinegrafista", "câmera"],
};

/** Minúsculas e sem acento — para comparar "Edição" com "edicao". */
export function normalizarFuncao(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** A função da pessoa pertence à área? (basta conter um dos termos) */
export function funcaoCombina(funcao: string | null | undefined, termos: string[]): boolean {
  if (!funcao) return false;
  const f = normalizarFuncao(funcao);
  return termos.some((t) => {
    const termo = normalizarFuncao(t);
    return termo.length > 0 && f.includes(termo);
  });
}
