import { db } from "@/lib/db";

/** Tipos de entidade com numeração sequencial própria. */
export type TipoSequencia = "PROJETO" | "JOB" | "PROPOSTA" | "MIDIA" | "LANCAMENTO" | "PRODUCAO";

/**
 * Próximo número sequencial para um tipo de entidade.
 *
 * Atômico e livre de corrida: usa INSERT ... ON CONFLICT DO UPDATE com
 * incremento no próprio banco (uma única instrução), retornando o valor novo.
 */
export async function proximoNumero(tipo: TipoSequencia): Promise<number> {
  const rows = await db.$queryRaw<{ ultimo: number }[]>`
    INSERT INTO "Sequence" ("tipo", "ultimo")
    VALUES (${tipo}, 1)
    ON CONFLICT ("tipo")
    DO UPDATE SET "ultimo" = "Sequence"."ultimo" + 1
    RETURNING "ultimo"
  `;
  return rows[0].ultimo;
}
