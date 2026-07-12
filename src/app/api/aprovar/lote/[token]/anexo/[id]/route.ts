import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Serve um anexo de uma peça que pertence a uma RODADA de aprovação pública, sem login.
 * Só libera se o anexo pertence a um job que está entre os itens do lote cujo token bate.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;

  const lote = await db.aprovacaoLote.findUnique({
    where: { token },
    select: { itens: { select: { jobId: true } } },
  });
  if (!lote) return new Response("Não encontrado", { status: 404 });

  const jobIds = new Set(lote.itens.map((i) => i.jobId));

  const a = await db.anexo.findUnique({ where: { id } });
  if (!a || a.entidadeTipo !== "job" || !jobIds.has(a.entidadeId)) {
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
    console.error("[aprovar/lote/anexo] download falhou:", e);
    return new Response("Falha ao baixar", { status: 500 });
  }
}
