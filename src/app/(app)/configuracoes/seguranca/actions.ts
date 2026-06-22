"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { gerarSecret, otpauthUrl, verificarToken, gerarRecoveryCodes } from "@/lib/totp";

export type TotpState = { error?: string; qr?: string; codigos?: string[]; ok?: boolean };

export type SenhaState = { error?: string; ok?: boolean };

/** O próprio usuário troca a senha (confere a senha atual). */
export async function alterarMinhaSenha(_prev: SenhaState, formData: FormData): Promise<SenhaState> {
  const user = await requireUser();
  const atual = String(formData.get("atual") ?? "");
  const nova = String(formData.get("nova") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  if (nova.length < 8) return { error: "A nova senha deve ter ao menos 8 caracteres." };
  if (nova !== confirmar) return { error: "A confirmação não confere." };

  const u = await db.usuario.findUnique({ where: { id: user.id }, select: { senhaHash: true } });
  if (!u?.senhaHash || !bcrypt.compareSync(atual, u.senhaHash)) {
    return { error: "Senha atual incorreta." };
  }
  if (bcrypt.compareSync(nova, u.senhaHash)) {
    return { error: "A nova senha deve ser diferente da atual." };
  }

  await db.usuario.update({ where: { id: user.id }, data: { senhaHash: bcrypt.hashSync(nova, 10) } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: user.id, usuarioId: user.id, acao: "alterou a própria senha" });
  revalidatePath("/configuracoes/seguranca");
  return { ok: true };
}

/** Passo 1: gera um segredo (ainda inativo) e o QR para escanear. */
export async function iniciarTotp(): Promise<TotpState> {
  const user = await requireUser();
  const secret = gerarSecret();
  await db.usuario.update({ where: { id: user.id }, data: { totpSecret: secret, totpAtivo: false } });
  const qr = await QRCode.toDataURL(otpauthUrl(user.email ?? "usuario", secret));
  return { qr };
}

/** Passo 2: confirma o código do app, ativa o 2FA e devolve os códigos de recuperação. */
export async function confirmarTotp(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const user = await requireUser();
  const codigo = (formData.get("codigo")?.toString() ?? "").trim();
  const u = await db.usuario.findUnique({ where: { id: user.id }, select: { totpSecret: true } });
  if (!u?.totpSecret) return { error: "Reinicie a ativação do 2FA." };
  if (!verificarToken(u.totpSecret, codigo)) return { error: "Código inválido. Confira o app e tente de novo." };

  const { codigos, hashes } = await gerarRecoveryCodes();
  await db.usuario.update({ where: { id: user.id }, data: { totpAtivo: true, totpRecoveryCodes: hashes } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: user.id, usuarioId: user.id, acao: "ativou 2FA" });
  revalidatePath("/configuracoes/seguranca");
  return { ok: true, codigos };
}

/** Desativa o 2FA (exige um código válido do app). */
export async function desativarTotp(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const user = await requireUser();
  const codigo = (formData.get("codigo")?.toString() ?? "").trim();
  const u = await db.usuario.findUnique({ where: { id: user.id }, select: { totpSecret: true } });
  if (!u?.totpSecret || !verificarToken(u.totpSecret, codigo)) {
    return { error: "Código inválido — não foi possível desativar." };
  }
  await db.usuario.update({ where: { id: user.id }, data: { totpAtivo: false, totpSecret: null, totpRecoveryCodes: null } });
  await registrarLog({ entidadeTipo: "usuario", entidadeId: user.id, usuarioId: user.id, acao: "desativou 2FA" });
  revalidatePath("/configuracoes/seguranca");
  return { ok: true };
}
