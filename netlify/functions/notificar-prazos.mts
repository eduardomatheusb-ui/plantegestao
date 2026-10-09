import { PrismaClient } from "@prisma/client";
import { notificarPrazos } from "../../src/lib/rotinas/notificar-prazos";

// Função agendada do Netlify. A lógica fica em src/lib/rotinas/notificar-prazos.ts,
// compartilhada com o cron da Vercel.
export default async () => {
  const db = new PrismaClient();
  try {
    return new Response(JSON.stringify(await notificarPrazos(db)), { headers: { "content-type": "application/json" } });
  } finally {
    await db.$disconnect();
  }
};

// 11:00 UTC ≈ 08:00 (horário de Brasília) todos os dias.
export const config = { schedule: "0 11 * * *" };
