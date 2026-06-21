import { db } from "@/lib/db";

type RegistrarLogArgs = {
  entidadeTipo: string;
  entidadeId: string;
  usuarioId?: string | null;
  acao: string;
  de?: string | null;
  para?: string | null;
};

/**
 * Registra uma ação no histórico/auditoria.
 * NUNCA quebra a operação principal — falha de log é engolida (try/catch).
 */
export async function registrarLog(args: RegistrarLogArgs): Promise<void> {
  try {
    await db.log.create({
      data: {
        entidadeTipo: args.entidadeTipo,
        entidadeId: args.entidadeId,
        usuarioId: args.usuarioId ?? null,
        acao: args.acao,
        de: args.de ?? null,
        para: args.para ?? null,
      },
    });
  } catch (err) {
    console.error("[log] falha ao registrar (ignorada):", err);
  }
}
