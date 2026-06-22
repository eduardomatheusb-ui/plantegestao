import "server-only";
import { authenticator } from "otplib";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Tolerância de ±1 passo (30s) para relógios levemente dessincronizados.
authenticator.options = { window: 1 };

const SERVICO = "TREM (Plante)";

export function gerarSecret(): string {
  return authenticator.generateSecret();
}

export function otpauthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, SERVICO, secret);
}

/** Verifica um código TOTP de 6 dígitos. */
export function verificarToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

/** Gera N códigos de recuperação: retorna os textos (mostrar 1x) e os hashes (salvar). */
export async function gerarRecoveryCodes(qtd = 8): Promise<{ codigos: string[]; hashes: string }> {
  const codigos: string[] = [];
  for (let i = 0; i < qtd; i++) {
    // Ex.: "a1b2-c3d4"
    const c = randomBytes(4).toString("hex");
    codigos.push(`${c.slice(0, 4)}-${c.slice(4, 8)}`);
  }
  const hashes = (await Promise.all(codigos.map((c) => bcrypt.hash(c, 10)))).join(",");
  return { codigos, hashes };
}

/**
 * Confere um código de recuperação contra os hashes salvos.
 * Retorna os hashes RESTANTES (sem o usado) se válido, ou null se inválido.
 */
export async function consumirRecovery(codigo: string, hashesSalvos: string | null): Promise<string | null> {
  if (!hashesSalvos) return null;
  const lista = hashesSalvos.split(",").filter(Boolean);
  const alvo = codigo.replace(/\s/g, "").toLowerCase();
  for (const h of lista) {
    if (await bcrypt.compare(alvo, h)) {
      return lista.filter((x) => x !== h).join(",");
    }
  }
  return null;
}
