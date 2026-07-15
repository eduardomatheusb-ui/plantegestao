import "server-only";
import { db } from "@/lib/db";

export async function listarReunioes(opts: { soDoUsuario?: string } = {}) {
  return db.reuniao.findMany({
    where: opts.soDoUsuario
      ? { OR: [{ criadoPorId: opts.soDoUsuario }, { compromisso: { participantes: { some: { usuarioId: opts.soDoUsuario } } } }] }
      : undefined,
    orderBy: [{ data: "desc" }],
    include: { cliente: { select: { id: true, nome: true } } },
  });
}

export type ReuniaoView = Awaited<ReturnType<typeof listarReunioes>>[number];

export async function obterReuniao(id: string) {
  return db.reuniao.findUnique({
    where: { id },
    include: { cliente: { select: { id: true, nome: true } } },
  });
}
