"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginBloqueadoMin, registrarFalhaLogin, limparFalhasLogin } from "@/lib/login-throttle";
import { verificarToken, consumirRecovery } from "@/lib/totp";
import { COOKIE_DISPOSITIVO_CONFIAVEL, MAX_AGE_CONFIAVEL, criarTokenDispositivo, validarTokenDispositivo } from "@/lib/trusted-device";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
  codigo: z.string().optional(),
});

export type LoginState = { error?: string; need2fa?: boolean };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email") ?? "",
    senha: formData.get("senha") ?? "",
    codigo: formData.get("codigo") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const { email, senha } = parsed.data;
  const codigo = parsed.data.codigo?.trim() ?? "";

  // Anti-brute-force.
  const bloqueio = await loginBloqueadoMin(email);
  if (bloqueio > 0) {
    return { error: `Muitas tentativas. Tente novamente em ${bloqueio} ${bloqueio === 1 ? "minuto" : "minutos"}.` };
  }

  // Verifica senha manualmente (para orquestrar o 2FA antes de abrir sessão).
  const u = await db.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, ativo: true, senhaHash: true, totpAtivo: true, totpSecret: true, totpRecoveryCodes: true },
  }).catch(() => null);

  const senhaOk = !!u && u.ativo && !!u.senhaHash && (await bcrypt.compare(senha, u.senhaHash));
  if (!senhaOk) {
    await registrarFalhaLogin(email);
    return { error: "E-mail ou senha inválidos." };
  }

  // 2FA (se ativo): exige código TOTP ou de recuperação — a menos que este
  // dispositivo já tenha sido confiado nos últimos 30 dias.
  let gravarConfianca = false;
  if (u!.totpAtivo) {
    const jar = await cookies();
    const dispositivoConfiavel = validarTokenDispositivo(jar.get(COOKIE_DISPOSITIVO_CONFIAVEL)?.value, u!.id, u!.totpSecret);
    if (dispositivoConfiavel) {
      gravarConfianca = true; // pula o código e renova a validade (janela deslizante)
    } else {
      if (!codigo) return { need2fa: true };
      const totpOk = u!.totpSecret ? verificarToken(u!.totpSecret, codigo) : false;
      if (!totpOk) {
        const restantes = await consumirRecovery(codigo, u!.totpRecoveryCodes);
        if (restantes === null) {
          await registrarFalhaLogin(email);
          return { error: "Código de verificação inválido.", need2fa: true };
        }
        await db.usuario.update({ where: { id: u!.id }, data: { totpRecoveryCodes: restantes } });
      }
      gravarConfianca = formData.get("lembrar") === "on"; // só se o usuário marcou
    }
  }

  // Tudo ok → abre a sessão (authorize confere a senha de novo).
  try {
    await signIn("credentials", { email, senha, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
  await limparFalhasLogin(email);

  if (gravarConfianca && u!.totpSecret) {
    const jar = await cookies();
    jar.set(COOKIE_DISPOSITIVO_CONFIAVEL, criarTokenDispositivo(u!.id, u!.totpSecret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_CONFIAVEL,
    });
  }
  redirect("/dashboard");
}
