import { notFound } from "next/navigation";
import { obterLoteParaAprovacao } from "@/lib/aprovacao/lote.queries";
import { RespostaLoteForm, type LoteItemView } from "@/components/aprovacao/resposta-lote-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aprovação de conteúdo — Plante" };

function ehImagem(ct: string | null | undefined) {
  return !!ct && ct.startsWith("image/");
}
function urlPareceImagem(url: string | null | undefined) {
  if (!url) return false;
  if (/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url)) return true;
  if (/[?&](fm|format)=(png|jpe?g|webp|gif|avif)\b/i.test(url)) return true;
  return /(?:images\.unsplash\.com|res\.cloudinary\.com|picsum\.photos)/i.test(url);
}

export default async function AprovarLotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await obterLoteParaAprovacao(token);
  if (!dados) notFound();

  const { lote, anexosPorJob } = dados;
  const cliente = {
    nome: lote.cliente?.nome ?? "",
    nomeFantasia: lote.cliente?.nomeFantasia ?? null,
    logoUrl: lote.cliente?.logoUrl ?? null,
  };

  const itens: LoteItemView[] = lote.itens.map((it) => {
    const anexos = anexosPorJob.get(it.jobId) ?? [];
    const imagens = anexos
      .filter((a) => (a.tipo === "arquivo" && ehImagem(a.contentType)) || (a.tipo === "link" && urlPareceImagem(a.url)))
      .map((a) => ({
        id: a.id,
        src: a.tipo === "arquivo" ? `/api/aprovar/lote/${token}/anexo/${a.id}` : a.url ?? "",
        alt: a.nome,
        contentType: a.contentType,
      }));
    return {
      jobId: it.jobId,
      numero: it.job.numero,
      titulo: it.job.titulo,
      legenda: it.job.legenda,
      formatos: (it.job.formatos || "").split(",").map((s) => s.trim()).filter(Boolean),
      imagens,
      jaRespondido: it.decisao ? { decisao: it.decisao, comentario: it.comentario } : null,
    };
  });

  const encerrado = lote.status === "encerrado";
  const totalRespondidos = itens.filter((i) => i.jaRespondido).length;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-[#050505] px-4 py-2 text-xl font-extrabold tracking-wide text-[#F7FF19]">Plante</div>
        {encerrado && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Rodada concluída
          </span>
        )}
      </header>

      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold leading-tight">{lote.titulo || "Aprovação de conteúdo"}</h1>
        <p className="text-sm text-muted-foreground">
          {cliente.nomeFantasia || cliente.nome} · {itens.length} peça{itens.length === 1 ? "" : "s"}
          {totalRespondidos > 0 && !encerrado && <> · {totalRespondidos} já respondida{totalRespondidos === 1 ? "" : "s"}</>}
        </p>
      </div>

      <RespostaLoteForm token={token} cliente={cliente} itens={itens} encerrado={encerrado} />

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        Link exclusivo de aprovação · Plante Comunicação
      </footer>
    </main>
  );
}
