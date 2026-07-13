import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function ehImagem(ct: string | null, nome: string | null, url: string | null) {
  return (ct ?? "").startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(nome || url || "");
}

/**
 * Miniatura da timeline do portal — pública, mas checada pelo token: só serve
 * imagem de um anexo que pertence a um job do cliente dono daquele token/slug.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; anexoId: string }> }) {
  const { token, anexoId } = await params;

  const cliente = await db.cliente.findFirst({
    where: { OR: [{ portalSlug: token }, { portalToken: token }] },
    select: { id: true },
  });
  if (!cliente) return new Response("Não encontrado", { status: 404 });

  const anexo = await db.anexo.findUnique({ where: { id: anexoId } });
  if (!anexo || anexo.entidadeTipo !== "job" || !ehImagem(anexo.contentType, anexo.nome, anexo.url)) {
    return new Response("Não encontrado", { status: 404 });
  }

  // A peça precisa ser deste cliente (não vaza imagem de outro cliente pelo token).
  const job = await db.job.findUnique({ where: { id: anexo.entidadeId }, select: { clienteId: true } });
  if (!job || job.clienteId !== cliente.id) return new Response("Não encontrado", { status: 404 });

  if (anexo.tipo === "link" && anexo.url) return Response.redirect(anexo.url, 302);

  if (anexo.tipo === "arquivo" && anexo.blobKey) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const data = await getStore("anexos").get(anexo.blobKey, { type: "arrayBuffer" });
      if (!data) return new Response("Indisponível", { status: 404 });
      return new Response(data, {
        headers: {
          "Content-Type": anexo.contentType ?? "image/jpeg",
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch {
      return new Response("Falha", { status: 500 });
    }
  }
  return new Response("Não encontrado", { status: 404 });
}
