import { notFound } from "next/navigation";
import { CheckCircle2, PenLine, Clock } from "lucide-react";
import { obterParaAprovacao } from "@/lib/aprovacao/queries";
import { rotulosFormatos, rotuloFormato } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { RespostaForm } from "@/components/aprovacao/resposta-form";
import { PostPreview } from "@/components/postagens/post-preview/PostPreview";
import { driveEmbedInfo, aspectoPeca } from "@/lib/anexos/embed";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aprovação de peça — Plante" };

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function ehImagem(ct: string | null | undefined) {
  return !!ct && ct.startsWith("image/");
}

function urlPareceImagem(url: string | null | undefined) {
  if (!url) return false;
  if (/\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url)) return true;
  // CDNs (Unsplash, Cloudinary…) marcam formato via query string.
  if (/[?&](fm|format)=(png|jpe?g|webp|gif|avif)\b/i.test(url)) return true;
  // Hosts de imagem conhecidos sem extensão no path.
  return /(?:images\.unsplash\.com|res\.cloudinary\.com|picsum\.photos)/i.test(url);
}

export default async function AprovarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await obterParaAprovacao(token);
  if (!dados) notFound();

  const { job, anexos, anexosAnteriores, eventos } = dados;
  const formatos = (job.formatos || "").split(",").map((k) => k.trim()).filter(Boolean);
  const formatosRotulos = rotulosFormatos(job.formatos);
  const cliente = job.cliente?.nomeFantasia || job.cliente?.nome || "";
  const respondido = job.aprovacaoStatus === "aprovado" || job.aprovacaoStatus === "ajustes";

  const imagensAtuais = anexos
    .filter((a) => (a.tipo === "arquivo" && ehImagem(a.contentType)) || (a.tipo === "link" && urlPareceImagem(a.url)))
    .map((a) => ({
      id: a.id,
      src: a.tipo === "arquivo" ? `/api/aprovar/${token}/anexo/${a.id}` : a.url ?? "",
      alt: a.nome,
      contentType: a.contentType,
    }));

  const anexosNaoImagem = anexos.filter(
    (a) => !((a.tipo === "arquivo" && ehImagem(a.contentType)) || (a.tipo === "link" && urlPareceImagem(a.url)))
  );

  const formatosParaPreview = formatos.length > 0 ? formatos : ["outro"];

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-[#050505] px-4 py-2 text-xl font-extrabold tracking-wide text-[#F7FF19]">Plante</div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: `${corAprovacao(job.aprovacaoStatus)}22`, color: corAprovacao(job.aprovacaoStatus) }}
        >
          {rotuloAprovacao(job.aprovacaoStatus)}
        </span>
      </header>

      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold leading-tight">{job.titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {cliente}
          {job.prazoPostagem && <> · vai ao ar em {dataBR(job.prazoPostagem)}</>}
        </p>
      </div>

      {formatosRotulos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {formatosRotulos.map((f) => (
            <span key={f} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Pré-visualização por rede */}
      {imagensAtuais.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pré-visualização</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {formatosParaPreview.map((f) => (
              <div key={f} className="space-y-2">
                <p className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {rotuloFormato(f)}
                </p>
                <PostPreview
                  formato={f}
                  cliente={{ nome: job.cliente?.nome ?? "", nomeFantasia: job.cliente?.nomeFantasia ?? null, logoUrl: job.cliente?.logoUrl ?? null }}
                  imagens={imagensAtuais.map((i) => ({ id: i.id, src: i.src, alt: i.alt }))}
                  legenda={job.legenda}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vídeo (Google Drive) e outros arquivos/links */}
      {anexosNaoImagem.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Vídeo e arquivos</h2>
          <div className="grid grid-cols-1 gap-3">
            {anexosNaoImagem.map((a) => {
              const emb = a.tipo === "link" ? driveEmbedInfo(a.url) : null;
              if (emb) {
                const pasta = emb.tipo === "pasta";
                return (
                  <div key={a.id} className={`mx-auto w-full ${pasta ? "max-w-[520px]" : "max-w-[360px]"}`}>
                    <div className="overflow-hidden rounded-xl border border-border bg-black" style={{ aspectRatio: pasta ? "4 / 3" : aspectoPeca(job.tipo, job.formatos) }}>
                      <iframe src={emb.src} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen title={a.nome} loading="lazy" />
                    </div>
                    <p className="mt-1.5 text-center text-xs text-muted-foreground">{pasta ? "📁 " : ""}{a.nome}</p>
                  </div>
                );
              }
              const src = a.tipo === "arquivo" ? `/api/aprovar/${token}/anexo/${a.id}` : a.url ?? "#";
              return (
                <a
                  key={a.id}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border p-3 text-sm font-medium text-foreground hover:bg-muted"
                >
                  📎 {a.nome}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Versões anteriores (histórico) */}
      {anexosAnteriores.length > 0 && (
        <details className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Ver versões anteriores ({anexosAnteriores.length})
          </summary>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {anexosAnteriores.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">v{a.versao}</span>
                <span className="line-through">{a.nome}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Legenda */}
      {job.legenda && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Legenda</h2>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm">{job.legenda}</p>
        </section>
      )}

      {/* Ação ou resultado */}
      <section className="rounded-xl border border-border bg-card p-5">
        {respondido ? (
          <div className="flex items-start gap-3 text-sm">
            {job.aprovacaoStatus === "aprovado" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <PenLine className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">
                {job.aprovacaoStatus === "aprovado" ? "Peça aprovada." : "Ajustes solicitados."}
              </p>
              {eventos[0]?.comentario && <p className="mt-1 text-muted-foreground">&ldquo;{eventos[0].comentario}&rdquo;</p>}
              {eventos[0]?.autor && <p className="mt-1 text-xs text-muted-foreground">— {eventos[0].autor}</p>}
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-4 font-display text-lg font-semibold">Sua aprovação</h2>
            <RespostaForm token={token} />
          </>
        )}
      </section>

      {/* Histórico */}
      {eventos.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Histórico</h2>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {eventos.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {dataBR(e.criadoEm)} — {rotuloAcao(e.acao)}
                  {e.autor ? ` · ${e.autor}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        Link exclusivo de aprovação · Plante Comunicação
      </footer>
    </main>
  );
}

function rotuloAcao(acao: string) {
  return (
    { enviado: "enviado para aprovação", reenviado: "reenviado para aprovação", aprovado: "aprovado", ajustes: "ajustes solicitados" }[acao] ??
    acao
  );
}
