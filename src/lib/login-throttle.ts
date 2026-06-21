import "server-only";
import { db } from "@/lib/db";

// Anti-brute-force por e-mail: até LIMITE falhas dentro de JANELA; depois bloqueia BLOQUEIO.
const LIMITE = 5;
const JANELA_MS = 15 * 60 * 1000;
const BLOQUEIO_MS = 15 * 60 * 1000;

const norm = (email: string) => email.toLowerCase().trim();

/** Minutos restantes de bloqueio (0 = liberado). Nunca quebra o login (fail-open). */
export async function loginBloqueadoMin(email: string): Promise<number> {
  try {
    const r = await db.loginAttempt.findUnique({ where: { email: norm(email) } });
    if (r?.bloqueadoAte && r.bloqueadoAte > new Date()) {
      return Math.max(1, Math.ceil((r.bloqueadoAte.getTime() - Date.now()) / 60000));
    }
  } catch (e) {
    console.error("[throttle] falha ao checar bloqueio (ignorada):", e);
  }
  return 0;
}

/** Registra uma falha de login; bloqueia ao atingir o limite na janela. */
export async function registrarFalhaLogin(email: string): Promise<void> {
  try {
    const e = norm(email);
    const r = await db.loginAttempt.findUnique({ where: { email: e } });
    const dentroDaJanela = r && Date.now() - r.atualizadoEm.getTime() < JANELA_MS;
    const tentativas = dentroDaJanela ? r.tentativas + 1 : 1;
    const bloqueadoAte = tentativas >= LIMITE ? new Date(Date.now() + BLOQUEIO_MS) : null;
    await db.loginAttempt.upsert({
      where: { email: e },
      create: { email: e, tentativas, bloqueadoAte },
      update: { tentativas, bloqueadoAte },
    });
  } catch (e) {
    console.error("[throttle] falha ao registrar tentativa (ignorada):", e);
  }
}

/** Zera as falhas após login bem-sucedido. */
export async function limparFalhasLogin(email: string): Promise<void> {
  try {
    await db.loginAttempt.deleteMany({ where: { email: norm(email) } });
  } catch (e) {
    console.error("[throttle] falha ao limpar tentativas (ignorada):", e);
  }
}
