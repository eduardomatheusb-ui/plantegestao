import "server-only";
import { db } from "@/lib/db";

export async function listarFeedbacks() {
  return db.feedback.findMany({
    orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
    include: {
      autor: { select: { nome: true } },
      respondidoPor: { select: { nome: true } },
    },
  });
}

export type FeedbackView = Awaited<ReturnType<typeof listarFeedbacks>>[number];
