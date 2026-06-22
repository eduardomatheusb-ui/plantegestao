import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Baixa um anexo do tipo arquivo (Netlify Blobs). Exige usuário autenticado. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });

  const { id } = await params;
  const a = await db.anexo.findUnique({ where: { id } });
  if (!a || a.tipo !== "arquivo" || !a.blobKey) return new Response("Não encontrado", { status: 404 });

  try {
    const { getStore } = await import("@netlify/blobs");
    const data = await getStore("anexos").get(a.blobKey, { type: "arrayBuffer" });
    if (!data) return new Response("Arquivo indisponível", { status: 404 });
    return new Response(data, {
      headers: {
        "Content-Type": a.contentType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${(a.nome ?? "arquivo").replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (e) {
    console.error("[anexo] download falhou:", e);
    return new Response("Falha ao baixar", { status: 500 });
  }
}
