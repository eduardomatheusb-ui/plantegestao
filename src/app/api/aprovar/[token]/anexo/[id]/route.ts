import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serve um anexo (arquivo) de uma peça PÚBLICA de aprovação, sem login.
 * Só libera se o anexo pertence ao job cujo aprovacaoToken bate com o da URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;

  const job = await db.job.findUnique({ where: { aprovacaoToken: token }, select: { id: true } });
  if (!job) return new Response("Não encontrado", { status: 404 });

  const a = await db.anexo.findUnique({ where: { id } });
  if (!a || a.entidadeTipo !== "job" || a.entidadeId !== job.id) {
    return new Response("Não encontrado", { status: 404 });
  }
  if (a.tipo !== "arquivo" || !a.blobKey) return new Response("Não encontrado", { status: 404 });

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
    console.error("[aprovar/anexo] download falhou:", e);
    return new Response("Falha ao baixar", { status: 500 });
  }
}
