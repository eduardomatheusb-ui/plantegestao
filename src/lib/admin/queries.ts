import { db } from "@/lib/db";
import { completarCaps, type Capacidades, type ModuloKey } from "@/lib/permissoes";

/** Converte as linhas de PerfilCapacidade num mapa completo módulo→nível. */
function capsDoPerfil(capacidades: { modulo: string; nivel: Capacidades[ModuloKey] }[]): Capacidades {
  const parcial: Partial<Capacidades> = {};
  for (const c of capacidades) parcial[c.modulo as ModuloKey] = c.nivel;
  return completarCaps(parcial);
}

export type PerfilLista = {
  id: string;
  nome: string;
  descricao: string | null;
  sistema: boolean;
  caps: Capacidades;
  totalUsuarios: number;
};

export async function listarPerfis(): Promise<PerfilLista[]> {
  const perfis = await db.perfilAcesso.findMany({
    orderBy: { nome: "asc" },
    include: { capacidades: true, _count: { select: { usuarios: true } } },
  });
  return perfis.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    sistema: p.sistema,
    caps: capsDoPerfil(p.capacidades),
    totalUsuarios: p._count.usuarios,
  }));
}

export async function obterPerfil(id: string): Promise<PerfilLista | null> {
  const p = await db.perfilAcesso.findUnique({
    where: { id },
    include: { capacidades: true, _count: { select: { usuarios: true } } },
  });
  if (!p) return null;
  return {
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    sistema: p.sistema,
    caps: capsDoPerfil(p.capacidades),
    totalUsuarios: p._count.usuarios,
  };
}

export async function perfisParaSelect(): Promise<{ id: string; nome: string }[]> {
  return db.perfilAcesso.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}

export type UsuarioLista = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  responsavelConta: boolean;
  temSenha: boolean;
  convitePendente: boolean;
  perfilId: string | null;
  perfilNome: string | null;
  funcao: string | null;
  colaboradorId: string | null;
  colaboradorNome: string | null;
};

export async function listarUsuarios(): Promise<UsuarioLista[]> {
  const usuarios = await db.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: { perfil: { select: { nome: true } }, colaborador: { select: { id: true, nome: true, funcao: true } } },
  });
  return usuarios.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    ativo: u.ativo,
    responsavelConta: u.responsavelConta,
    temSenha: !!u.senhaHash,
    convitePendente: !u.senhaHash,
    perfilId: u.perfilId,
    perfilNome: u.perfil?.nome ?? null,
    funcao: u.colaborador?.funcao ?? null,
    colaboradorId: u.colaborador?.id ?? null,
    colaboradorNome: u.colaborador?.nome ?? null,
  }));
}

/** Colaboradores ativos que ainda não têm acesso (para o form de convite). */
export async function colaboradoresSemUsuario(): Promise<
  { id: string; nome: string; email: string | null; funcao: string | null }[]
> {
  return db.colaborador.findMany({
    where: { ativo: true, usuarioId: null },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, funcao: true },
  });
}

/** Colaboradores ativos para o seletor de vínculo (livres + o já ligado a cada usuário). */
export async function colaboradoresVinculaveis(): Promise<
  { id: string; nome: string; funcao: string | null; usuarioId: string | null }[]
> {
  return db.colaborador.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, funcao: true, usuarioId: true },
  });
}
