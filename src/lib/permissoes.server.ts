import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { NivelAcesso, Papel } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import {
  type Capacidades,
  type ModuloKey,
  capacidadesDoPapel,
  completarCaps,
  derivarPapel,
  podeModulo,
} from "@/lib/permissoes";

export type AcessoUsuario = {
  caps: Capacidades;
  /** Papel legado derivado do perfil (poder), p/ as checagens já existentes. */
  papel: Papel;
  /** Administra usuários/perfis/empresa. */
  admin: boolean;
};

/**
 * Carrega as capacidades efetivas do usuário (do perfil; com fallback ao papel legado
 * p/ quem ainda não tem perfil). Memoizado por requisição via React cache.
 */
export const carregarAcesso = cache(async (userId: string): Promise<AcessoUsuario> => {
  const u = await db.usuario.findUnique({
    where: { id: userId },
    include: { perfil: { include: { capacidades: true } } },
  });
  if (!u) return { caps: completarCaps({}), papel: "OPERADOR", admin: false };

  if (u.perfil) {
    const parcial: Partial<Capacidades> = {};
    for (const c of u.perfil.capacidades) parcial[c.modulo as ModuloKey] = c.nivel;
    const caps = completarCaps(parcial);
    return {
      caps,
      papel: derivarPapel(caps, u.responsavelConta),
      admin: caps.admin === "ADMIN" || u.responsavelConta,
    };
  }

  // Sem perfil: deriva das capacidades do papel legado.
  const caps = capacidadesDoPapel(u.papel);
  return { caps, papel: u.papel, admin: caps.admin === "ADMIN" };
});

/** Acesso do usuário autenticado da sessão (atalho). */
export async function acessoAtual(): Promise<AcessoUsuario & { id: string }> {
  const user = await requireUser();
  const acesso = await carregarAcesso(user.id);
  return { id: user.id, ...acesso };
}

/**
 * Guarda de PÁGINA: exige nível mínimo num módulo, senão redireciona.
 * Retorna o acesso para reuso na página.
 */
export async function requireModulo(
  modulo: ModuloKey,
  minimo: NivelAcesso = "VER",
): Promise<AcessoUsuario & { id: string }> {
  const acesso = await acessoAtual();
  if (!podeModulo(acesso.caps, modulo, minimo)) redirect("/acesso-negado");
  return acesso;
}

/**
 * Recorte por registro: quem tem ADMIN no módulo vê TUDO; os demais só os
 * próprios registros. Use o `id` do acesso para filtrar as queries.
 */
export function verTudoNoModulo(acesso: AcessoUsuario, modulo: ModuloKey): boolean {
  return podeModulo(acesso.caps, modulo, "ADMIN");
}

/** Guarda de AÇÃO (server action): exige nível mínimo, senão lança. */
export async function assertModulo(
  modulo: ModuloKey,
  minimo: NivelAcesso = "EDITAR",
): Promise<AcessoUsuario & { id: string }> {
  const acesso = await acessoAtual();
  if (!podeModulo(acesso.caps, modulo, minimo)) {
    throw new Error("Você não tem permissão para esta ação.");
  }
  return acesso;
}
