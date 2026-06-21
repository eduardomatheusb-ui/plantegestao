import { db } from "@/lib/db";

// Diagnóstico TEMPORÁRIO de conexão com o banco (remover depois).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const usuarios = await db.usuario.count();
    return Response.json({ ok: true, usuarios });
  } catch (e) {
    return Response.json(
      {
        ok: false,
        erro: e instanceof Error ? e.message : String(e),
        tipo: e?.constructor?.name ?? null,
      },
      { status: 500 },
    );
  }
}
