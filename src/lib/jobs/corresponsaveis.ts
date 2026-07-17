/**
 * Corresponsáveis FIXOS por tipo de job (resolvidos por e-mail em runtime).
 *
 * Regra da agência: quem cuida de um tipo de peça entra automaticamente como
 * corresponsável de todo job daquele tipo — na criação e ao editar. É só ajustar
 * a lista abaixo (por e-mail) para incluir/trocar pessoas por tipo.
 *
 * Hoje: a Larissa edita todos os reels → corresponsável fixa de "reels".
 */
export const CORRESP_FIXO_POR_TIPO: Record<string, string[]> = {
  reels: ["larissa.prudencini@agenciaplante.com.br"],
};

/** E-mails de corresponsáveis fixos para um tipo (vazio se não houver regra). */
export function corresponsaveisFixos(tipo: string | null | undefined): string[] {
  return CORRESP_FIXO_POR_TIPO[tipo ?? ""] ?? [];
}
