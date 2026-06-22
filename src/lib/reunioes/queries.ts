import "server-only";
import { db } from "@/lib/db";

export async function listarReunioes() {
  return db.reuniao.findMany({
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
