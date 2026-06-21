"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { loginBloqueadoMin, registrarFalhaLogin, limparFalhasLogin } from "@/lib/login-throttle";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }
  const { email, senha } = parsed.data;

  // Anti-brute-force: bloqueio temporário após muitas falhas.
  const bloqueio = await loginBloqueadoMin(email);
  if (bloqueio > 0) {
    return { error: `Muitas tentativas. Tente novamente em ${bloqueio} ${bloqueio === 1 ? "minuto" : "minutos"}.` };
  }

  try {
    await signIn("credentials", { email, senha, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      await registrarFalhaLogin(email);
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }

  // Sucesso: zera as tentativas e redireciona.
  await limparFalhasLogin(email);
  redirect("/dashboard");
}
