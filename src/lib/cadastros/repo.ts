import { db } from "@/lib/db";
import type { EntityConfig } from "./registry";

/**
 * Camada de repositório dos Cadastros — único ponto que fala com o Prisma para
 * estas entidades. Acesso por delegate dinâmico (db[model]) isolado aqui.
 */
type Delegate = {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  create: (args: unknown) => Promise<{ id: string }>;
  update: (args: unknown) => Promise<{ id: string }>;
  delete: (args: unknown) => Promise<{ id: string }>;
  count: (args?: unknown) => Promise<number>;
};

function delegate(config: EntityConfig): Delegate {
  const d = (db as unknown as Record<string, Delegate>)[config.model];
  if (!d) throw new Error(`Modelo desconhecido: ${config.model}`);
  return d;
}

export async function listar(
  config: EntityConfig,
  opts: { q?: string; incluirArquivados?: boolean } = {},
) {
  const where: Record<string, unknown> = {};

  if (config.softDelete && !opts.incluirArquivados) {
    // "ativos" = campo no valor oposto ao de arquivado
    where[config.softDelete.field] = !config.softDelete.arquivadoValue;
  }

  if (opts.q && config.buscaFields.length > 0) {
    where.OR = config.buscaFields.map((f) => ({
      [f]: { contains: opts.q, mode: "insensitive" },
    }));
  }

  const include = config.model === "categoria" ? { pai: { select: { nome: true } } } : undefined;

  return delegate(config).findMany({
    where,
    orderBy: { [config.ordenarPor]: "asc" },
    ...(include ? { include } : {}),
  });
}

export async function obter(config: EntityConfig, id: string) {
  return delegate(config).findUnique({ where: { id } });
}

export async function criar(config: EntityConfig, data: Record<string, unknown>) {
  return delegate(config).create({ data });
}

export async function atualizar(config: EntityConfig, id: string, data: Record<string, unknown>) {
  return delegate(config).update({ where: { id }, data });
}

/** Arquiva (ou desarquiva) ajustando o campo de soft-delete da entidade. */
export async function definirArquivado(config: EntityConfig, id: string, arquivar: boolean) {
  if (!config.softDelete) throw new Error("Entidade sem arquivamento.");
  const value = arquivar
    ? config.softDelete.arquivadoValue
    : !config.softDelete.arquivadoValue;
  return delegate(config).update({
    where: { id },
    data: { [config.softDelete.field]: value },
  });
}

export async function excluir(config: EntityConfig, id: string) {
  return delegate(config).delete({ where: { id } });
}
