import { db } from "@/lib/db";
import type { EntityConfig } from "./registry";

/**
 * Carrega opções de selects que dependem de dados (ex.: categoria-pai).
 * Chave do retorno = FieldDef.dynamicOptions.
 */
export async function carregarOpcoesDinamicas(
  config: EntityConfig,
  excluirId?: string,
): Promise<Record<string, { value: string; label: string }[]>> {
  const out: Record<string, { value: string; label: string }[]> = {};

  if (config.model === "categoria") {
    const categorias = await db.categoria.findMany({
      where: { ativo: true, ...(excluirId ? { id: { not: excluirId } } : {}) },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true },
    });
    out.categoriasPai = categorias.map((c) => ({
      value: c.id,
      label: `${c.nome} (${c.tipo === "RECEITA" ? "Receita" : "Despesa"})`,
    }));
  }

  return out;
}
