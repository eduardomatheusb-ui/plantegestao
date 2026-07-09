import "server-only";
import { db } from "@/lib/db";

export async function listarTemplates() {
  return db.jobTemplate.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { tarefas: true } } },
  });
}

export async function obterTemplate(id: string) {
  return db.jobTemplate.findUnique({
    where: { id },
    include: { tarefas: { orderBy: { ordem: "asc" } } },
  });
}

/** Usuários ativos (para os selects de responsável). */
export async function opcoesTemplate() {
  return db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
