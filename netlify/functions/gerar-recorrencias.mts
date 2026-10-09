import { PrismaClient } from "@prisma/client";
import { gerarRecorrencias } from "../../src/lib/rotinas/gerar-recorrencias";

// Função agendada do Netlify. A lógica fica em src/lib/rotinas/gerar-recorrencias.ts,
// compartilhada com o cron da Vercel.
export default async () => {
  const db = new PrismaClient();
  try {
    return new Response(JSON.stringify(await gerarRecorrencias(db)), { headers: { "content-type": "application/json" } });
  } finally {
    await db.$disconnect();
  }
};

// 11:30 UTC ≈ 08:30 (Brasília).
export const config = { schedule: "30 11 * * *" };
