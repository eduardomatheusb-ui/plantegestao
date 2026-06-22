import "server-only";
import { db } from "@/lib/db";

export async function listarOnboarding(clienteId: string) {
  return db.onboardingItem.findMany({
    where: { clienteId },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    include: { responsavel: { select: { id: true, nome: true } } },
  });
}

export type OnboardingItemView = Awaited<ReturnType<typeof listarOnboarding>>[number];

/** Progresso (concluídos / total) do checklist de um cliente. */
export async function progressoOnboarding(clienteId: string) {
  const itens = await db.onboardingItem.findMany({ where: { clienteId }, select: { concluido: true } });
  const total = itens.length;
  const feitos = itens.filter((i) => i.concluido).length;
  return { total, feitos, pct: total ? Math.round((feitos / total) * 100) : 0 };
}
