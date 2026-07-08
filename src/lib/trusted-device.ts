import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * "Confiar neste dispositivo por 30 dias" — após validar o 2FA uma vez, o
 * dispositivo recebe um cookie assinado e pula o código TOTP nos próximos
 * logins (a SENHA continua sendo exigida sempre). A assinatura usa o segredo
 * TOTP do usuário na chave, então desativar/regerar o 2FA invalida todos os
 * dispositivos confiáveis automaticamente.
 */
const DIAS = 30;
export const COOKIE_DISPOSITIVO_CONFIAVEL = "trem_td";
export const MAX_AGE_CONFIAVEL = DIAS * 24 * 3600; // segundos

function chave(totpSecret: string): string {
  return `${process.env.AUTH_SECRET ?? ""}:${totpSecret}`;
}
function assinar(payload: string, totpSecret: string): string {
  return createHmac("sha256", chave(totpSecret)).update(payload).digest("base64url");
}

/** Cria o valor do cookie de dispositivo confiável (válido por 30 dias). */
export function criarTokenDispositivo(uid: string, totpSecret: string): string {
  const exp = Date.now() + MAX_AGE_CONFIAVEL * 1000;
  const payload = `${uid}.${exp}`;
  return `${Buffer.from(payload).toString("base64url")}.${assinar(payload, totpSecret)}`;
}

/** Valida o cookie: pertence a este usuário, não expirou e a assinatura confere. */
export function validarTokenDispositivo(valor: string | undefined, uid: string, totpSecret: string | null): boolean {
  if (!valor || !totpSecret) return false;
  const partes = valor.split(".");
  if (partes.length !== 2) return false;
  const [payloadB64, sig] = partes;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString();
  } catch {
    return false;
  }
  const esperado = assinar(payload, totpSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const [tuid, expStr] = payload.split(".");
  const exp = Number(expStr);
  return tuid === uid && Number.isFinite(exp) && exp > Date.now();
}
