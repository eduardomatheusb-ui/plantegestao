"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { gerarSecret, otpauthUrl, verificarToken, gerarRecoveryCodes } from "@/lib/totp";

export type TotpState = { error?: string; qr?: string; codigos?: string[]; ok?: boolean };

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
