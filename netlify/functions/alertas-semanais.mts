import { PrismaClient } from "@prisma/client";
import { alertasSemanais } from "../../src/lib/rotinas/alertas-semanais";

// Função agendada do Netlify. A lógica fica em src/lib/rotinas/alertas-semanais.ts,
// compartilhada com o cron da Vercel.
export default async () => {
  const db = new PrismaClient();
  try {
    return new Response(JSON.stringify(await alertasSemanais(db)), { headers: { "content-type": "application/json" } });
  } finally {
    await db.$disconnect();
  }
};

// 11:00 UTC ≈ 08:00 (Brasília) toda segunda-feira.
export const config = { schedule: "0 11 * * 1" };
