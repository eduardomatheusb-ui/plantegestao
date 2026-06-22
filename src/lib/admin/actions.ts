"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { NivelAcesso } from "@prisma/client";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";
import { assertModulo, acessoAtual } from "@/lib/permissoes.server";
import {
  MODULOS,
  completarCaps,
  derivarPapel,
  type Capacidades,
  type ModuloKey,
} from "@/lib/permissoes";

export type AdminFormState = { error?: string; ok?: boolean; conviteUrl?: string };

const NIVEIS_VALIDOS: NivelAcesso[] = ["NENHUM", "VER", "EDITAR", "ADMIN"];
const EXPIRA_DIAS = 7;

function lerCaps(formData: FormData): Capacidades {
  const parcial: Partial<Capacidades> = {};
  for (const m of MODULOS) {
    const raw = String(formData.get(`nivel_${m.key}`) ?? "NENHUM");
    parcial[m.key] = (NIVEIS_VALIDOS.includes(raw as NivelAcesso) ? raw : "NENHUM") as NivelAcesso;
  }
  return completarCaps(parcial);
}

/** Recalcula e persiste o papel legado de todos os usuários de um perfil. */
async function recomputarPapeis(perfilId: string, caps: Capacidades) {
  const usuarios = await db.usuario.findMany({ where: { perfilId }, select: { id: true, responsavelConta: true } });
  for (const u of usuarios) {
    await db.usuario.update({ where: { id: u.id }, data: { papel: derivarPapel(caps, u.responsavelConta) } });
  }
}

// ─────────────────────────────── Perfis ───────────────────────────────

export async function salvarPerfil(
  id: string | null,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const acesso = await assertModulo("admin", "ADMIN");
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  if (!nome) return { error: "Informe o nome do perfil." };

  const caps = lerCaps(formData);

  try {
    if (id) {
      await db.perfilAcesso.update({ where: { id }, data: { nome, descricao } });
      for (const m of MODULOS) {
        await db.perfilCapacidade.upsert({
          where: { perfilId_modulo: { perfilId: id, modulo: m.key } },
          update: { nivel: caps[m.key] },
          create: { perfilId: id, modulo: m.key, nivel: caps[m.key] },
        });
      }
      await recomputarPapeis(id, caps);
      await registrarLog({ entidadeTipo: "perfil", entidadeId: id, usuarioId: acesso.id, acao: "atualizou", para: nome });
    } else {
      const novo = await db.perfilAcesso.create({
        data: {
          nome,
          descricao,
          sistema: false,
          capacidades: { create: MODULOS.map((m) => ({ modulo: m.key, nivel: caps[m.key] })) },
        },
      });
      await registrarLog({ entidadeTipo: "perfil", entidadeId: novo.id, usuarioId: acesso.id, acao: "criou", para: nome });
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) return { error: "Já existe um perfil com esse nome." };
    return { error: "Não foi possível salvar o perfil." };
  }

  revalidatePath("/configuracoes/perfis");
  return { ok: true };
}

export async function duplicarPerfil(id: string): Promise<void> {
  const acesso = await assertModulo("admin", "ADMIN");
  const orig = await db.perfilAcesso.findUnique({ where: { id }, include: { capacidades: true } });
  if (!orig) throw new Error("Perfil não encontrado.");
  let nome = `${orig.nome} (cópia)`;
  let i = 2;
  while (await db.perfilAcesso.findUnique({ where: { nome } })) nome = `${orig.nome} (cópia ${i++})`;
  const novo = await db.perfilAcesso.create({
    data: {
      nome,
      descricao: orig.descricao,
      sistema: false,
      capacidades: { create: orig.capacidades.map((c) => ({ modulo: c.modulo, nivel: c.nivel })) },
    },
  });
  await registrarLog({ entidadeTipo: "perfil", entidadeId: novo.id, usuarioId: acesso.id, acao: "duplicou", de: orig.nome, para: nome });
  revalidatePath("/configuracoes/perfis");
}

export async function excluirPerfil(id: string): Promise<void> {
  const acesso = await assertModulo("admin", "ADMIN");
  const perfil = await db.perfilAcesso.findUnique({ where: { id }, include: { _count: { select: { usuarios: true } } } });
  if (!perfil) throw new Error("Perfil não encontrado.");
  if (perfil.sistema) throw new Error("Perfis do sistema não podem ser excluídos (apenas editados).");
  if (perfil._count.usuarios > 0) throw new Error("Há usuários com este perfil. Reatribua-os antes de excluir.");
  await db.perfilAcesso.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "perfil", entidadeId: id, usuarioId: acesso.id, acao: "excluiu", de: perfil.nome });
  revalidatePath("/configuracoes/perfis");
}

// ─────────────────────────────── Usuários ───────────────────────────────

async function capsDoPerfilId(perfilId: string): Promise<Capacidades> {
  const caps = await db.perfilCapacidade.findMany({ where: { perfilId } });
  const parcial: Partial<Capacidades> = {};
  for (const c of caps) parcial[c.modulo as ModuloKey] = c.nivel;
  return completarCaps(parcial);
}

function novoToken() {
  const expira = new Date();
  expira.setDate(expira.getDate() + EXPIRA_DIAS);
  return { token: randomUUID(), expira };
}

export async function convidarUsuario(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const acesso = await assertModulo("admin", "ADMIN");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const perfilId = String(formData.get("perfilId") ?? "").trim();
  const colaboradorId = String(formData.get("colaboradorId") ?? "").trim() || null;

  if (!nome) return { error: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };
  if (!perfilId) return { error: "Escolha um perfil de acesso." };

  if (await db.usuario.findUnique({ where: { email } })) return { error: "Já existe um usuário com este e-mail." };

  const caps = await capsDoPerfilId(perfilId);
  const { token, expira } = novoToken();

  const usuario = await db.usuario.create({
    data: {
      nome, email, perfilId,
      papel: derivarPapel(caps, false),
      senhaHash: null,
      conviteToken: token,
      conviteExpira: expira,
    },
  });
  if (colaboradorId) {
    await db.colaborador.update({ where: { id: colaboradorId }, data: { usuarioId: usuario.id } });
  }
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuario.id, usuarioId: acesso.id, acao: "convidou", para: email });

  revalidatePath("/configuracoes/usuarios");
  return { ok: true, conviteUrl: `/definir-senha?token=${token}` };
}

export async function alterarPerfilUsuario(usuarioId: string, perfilId: string): Promise<void> {
  await assertModulo("admin", "ADMIN");
  const alvo = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!alvo) throw new Error("Usuário não encontrado.");

  const caps = await capsDoPerfilId(perfilId);
  // Não permitir remover o último administrador.
  if (alvo.responsavelConta === false) {
    const viraAdmin = caps.admin === "ADMIN";
    if (!viraAdmin && (await ehUltimoAdmin(usuarioId))) {
      throw new Error("Este é o último administrador ativo — defina outro antes de rebaixá-lo.");
    }
  }
  await db.usuario.update({ where: { id: usuarioId }, data: { perfilId, papel: derivarPapel(caps, alvo.responsavelConta) } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: (await acessoAtual()).id, acao: "alterou perfil" });
  revalidatePath("/configuracoes/usuarios");
}

export async function definirAtivoUsuario(usuarioId: string, ativo: boolean): Promise<void> {
  const acesso = await assertModulo("admin", "ADMIN");
  if (!ativo) {
    if (usuarioId === acesso.id) throw new Error("Você não pode desativar a si mesmo.");
    const alvo = await db.usuario.findUnique({ where: { id: usuarioId } });
    if (alvo?.responsavelConta) throw new Error("O responsável da conta não pode ser desativado.");
    if (await ehUltimoAdmin(usuarioId)) throw new Error("Este é o último administrador ativo — não pode ser desativado.");
  }
  await db.usuario.update({ where: { id: usuarioId }, data: { ativo } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: acesso.id, acao: ativo ? "ativou" : "desativou" });
  revalidatePath("/configuracoes/usuarios");
}

/** Admin edita nome e e-mail do usuário. */
export async function editarUsuario(usuarioId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const acesso = await assertModulo("admin", "ADMIN");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!nome) return { error: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };

  const jaUsado = await db.usuario.findUnique({ where: { email } });
  if (jaUsado && jaUsado.id !== usuarioId) return { error: "Já existe outro usuário com este e-mail." };

  try {
    await db.usuario.update({ where: { id: usuarioId }, data: { nome, email } });
    await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: acesso.id, acao: "editou dados", para: email });
  } catch {
    return { error: "Não foi possível salvar." };
  }
  revalidatePath("/configuracoes/usuarios");
  return { ok: true };
}

/** Admin define/redefine a senha do usuário diretamente (sem link de convite). */
export async function definirSenhaUsuario(usuarioId: string, _prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const acesso = await assertModulo("admin", "ADMIN");
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  if (senha.length < 8) return { error: "A senha deve ter ao menos 8 caracteres." };
  if (senha !== confirmar) return { error: "As senhas não conferem." };

  try {
    await db.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash: bcrypt.hashSync(senha, 10), conviteToken: null, conviteExpira: null, ativo: true },
    });
    await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: acesso.id, acao: "redefiniu a senha" });
  } catch {
    return { error: "Não foi possível definir a senha." };
  }
  revalidatePath("/configuracoes/usuarios");
  return { ok: true };
}

/** Admin vincula (ou desvincula, colaboradorId vazio) o usuário a um colaborador. */
export async function vincularColaborador(usuarioId: string, colaboradorId: string | null): Promise<void> {
  const acesso = await assertModulo("admin", "ADMIN");
  // Mantém o 1:1: solta o colaborador atualmente ligado a este usuário.
  await db.colaborador.updateMany({ where: { usuarioId }, data: { usuarioId: null } });
  if (colaboradorId) {
    await db.colaborador.update({ where: { id: colaboradorId }, data: { usuarioId } });
  }
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: acesso.id, acao: colaboradorId ? "vinculou a colaborador" : "desvinculou do colaborador" });
  revalidatePath("/configuracoes/usuarios");
}

/** Exclusão definitiva do usuário (Administrador). Apaga apontamentos/chat dele;
 *  autoria em jobs/projetos/comentários vira nula (conteúdo preservado). */
export async function excluirUsuario(usuarioId: string): Promise<void> {
  const acesso = await assertModulo("admin", "ADMIN");
  if (usuarioId === acesso.id) throw new Error("Você não pode excluir a si mesmo.");
  const alvo = await db.usuario.findUnique({ where: { id: usuarioId }, select: { responsavelConta: true, email: true } });
  if (!alvo) throw new Error("Usuário não encontrado.");
  if (alvo.responsavelConta) throw new Error("O responsável da conta não pode ser excluído.");
  if (await ehUltimoAdmin(usuarioId)) throw new Error("Este é o último administrador — não pode ser excluído.");

  await db.usuario.delete({ where: { id: usuarioId } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuarioId, usuarioId: acesso.id, acao: "excluiu o usuário", de: alvo.email });
  revalidatePath("/configuracoes/usuarios");
}

export async function reenviarConvite(usuarioId: string): Promise<{ conviteUrl?: string; error?: string }> {
  await assertModulo("admin", "ADMIN");
  const { token, expira } = novoToken();
  await db.usuario.update({ where: { id: usuarioId }, data: { conviteToken: token, conviteExpira: expira } });
  revalidatePath("/configuracoes/usuarios");
  return { conviteUrl: `/definir-senha?token=${token}` };
}

/** True se desativar/rebaixar `usuarioId` deixaria o sistema sem nenhum administrador ativo. */
async function ehUltimoAdmin(usuarioId: string): Promise<boolean> {
  const ativos = await db.usuario.findMany({
    where: { ativo: true },
    include: { perfil: { include: { capacidades: true } } },
  });
  const admins = ativos.filter(
    (u) => u.responsavelConta || u.perfil?.capacidades.some((c) => c.modulo === "admin" && c.nivel === "ADMIN"),
  );
  return admins.length === 1 && admins[0].id === usuarioId;
}

// ─────────────────────────── Definir senha (público, via token) ───────────────────────────

export async function definirSenhaPorToken(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const token = String(formData.get("token") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  if (senha.length < 8) return { error: "A senha deve ter ao menos 8 caracteres." };
  if (senha !== confirmar) return { error: "As senhas não conferem." };

  const usuario = await db.usuario.findUnique({ where: { conviteToken: token } });
  if (!usuario || !usuario.conviteExpira || usuario.conviteExpira < new Date()) {
    return { error: "Convite inválido ou expirado. Peça um novo ao administrador." };
  }

  await db.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash: bcrypt.hashSync(senha, 10), conviteToken: null, conviteExpira: null, ativo: true },
  });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: usuario.id, usuarioId: usuario.id, acao: "definiu senha" });
  return { ok: true };
}
