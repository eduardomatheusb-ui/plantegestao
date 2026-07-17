import { db } from "@/lib/db";

/**
 * Corresponsáveis automáticos por ÁREA — não por pessoa.
 *
 * Cada tipo de job pode ter uma área responsável, identificada pela FUNÇÃO da
 * pessoa (Colaborador.funcao, o mesmo texto do cadastro). Quem tem login ativo e
 * função compatível entra sozinho como corresponsável dos jobs daquele tipo — na
 * criação e ao editar. A regra segue a ÁREA: se entrar outro profissional da
 * área, ele já participa; se a pessoa mudar de função, ela sai. Nenhum nome fixo.
 *
 * Hoje: reels → audiovisual. A Larissa é "Videomaker" e, no momento, a única da
 * área — mas é a função que manda, não ela.
 */
export const AREA_POR_TIPO: Record<string, RegExp> = {
  reels: /videomaker|audiovisual|edi[cç][aã]o|\beditor|motion|filmmaker|cinegrafista|c[aâ]mera/i,
};

/** IDs de usuários (login ativo) da área responsável por um tipo. Vazio se não há regra. */
export async function corresponsaveisDaArea(tipo: string | null | undefined): Promise<string[]> {
  const re = AREA_POR_TIPO[tipo ?? ""];
  if (!re) return [];
  const cols = await db.colaborador.findMany({
    where: { ativo: true, usuarioId: { not: null }, usuario: { is: { ativo: true } } },
    select: { funcao: true, usuarioId: true },
  });
  return cols.filter((c) => c.funcao && re.test(c.funcao)).map((c) => c.usuarioId as string);
}
