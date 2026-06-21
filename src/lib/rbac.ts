import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Papel } from "@prisma/client";

/**
 * Controle de acesso por papel — checado SEMPRE no servidor.
 * Hierarquia: SOCIO_DIRETOR > GESTOR > OPERADOR.
 */
export const PAPEL_PESO: Record<Papel, number> = {
  OPERADOR: 1,
  GESTOR: 2,
  SOCIO_DIRETOR: 3,
};

export const PAPEL_LABEL: Record<Papel, string> = {
  SOCIO_DIRETOR: "Sócio-diretor",
  GESTOR: "Gestor",
  OPERADOR: "Operador",
};

export type SessionUser = {
  id: string;
  papel: Papel;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/** Usuário da sessão atual, ou null se não autenticado. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Garante autenticação em páginas (redireciona ao login se necessário). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** True se `papel` atende ao mínimo exigido. */
export function podePapel(papel: Papel, minimo: Papel): boolean {
  return PAPEL_PESO[papel] >= PAPEL_PESO[minimo];
}

/** Garante papel mínimo em páginas (redireciona a /acesso-negado se insuficiente). */
export async function requirePapel(minimo: Papel): Promise<SessionUser> {
  const user = await requireUser();
  if (!podePapel(user.papel, minimo)) redirect("/acesso-negado");
  return user;
}

/**
 * Garante papel mínimo em server actions — LANÇA erro (não redireciona).
 * Use no início de toda mutação sensível.
 */
export async function assertPapel(minimo: Papel): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Não autenticado.");
  if (!podePapel(user.papel, minimo)) {
    throw new Error("Você não tem permissão para esta ação.");
  }
  return user;
}

/**
 * Capacidades por área. Política dos Cadastros (Fase 2):
 * - OPERADOR: somente leitura.
 * - GESTOR+: criar, editar e arquivar.
 * - SOCIO_DIRETOR: também excluir definitivamente.
 */
export const CADASTRO_EDITAR_MINIMO: Papel = "GESTOR";
export const CADASTRO_EXCLUIR_MINIMO: Papel = "SOCIO_DIRETOR";
