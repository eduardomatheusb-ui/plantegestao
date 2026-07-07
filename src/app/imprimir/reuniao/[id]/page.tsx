import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterReuniao } from "@/lib/reunioes/queries";
import { getEmpresa } from "@/lib/empresa";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";
import { RichTextView } from "@/components/shared/rich-text-view";

export const metadata = { title: "Ata de reunião — impressão" };

function Secao({ titulo, texto }: { titulo: string; texto: string | null | undefined }) {
  if (!texto) return null;
  return (
    <section className="mt-5">
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{titulo}</h2>
      <RichTextView texto={texto} className="mt-1" />
    </section>
  );
}

export default async function ImprimirReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("projetos", "VER");
  const { id } = await params;

  const [r, empresa] = await Promise.all([obterReuniao(id), getEmpresa()]);
  if (!r) notFound();

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 16mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-end justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div>
            {/* logo completo oficial da Plante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-14 w-auto object-contain" />
            <p className="mt-2 text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">ATA DE REUNIÃO</p>
            <p className="text-sm text-neutral-500">{formatDate(r.data)}</p>
          </div>
        </header>

        {/* corpo do documento: fonte 11pt, entrelinha 1,5 */}
        <div className="mt-6 text-[11pt] leading-[1.5]">
          <h1 className="font-display text-xl font-bold">{r.titulo}</h1>
          <section className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-[10pt] text-neutral-600 sm:grid-cols-2">
            <p><span className="text-neutral-500">Cliente:</span> {r.cliente?.nome ?? "Reunião interna"}</p>
            <p><span className="text-neutral-500">Data:</span> {formatDate(r.data)}</p>
            {r.participantes && <p className="sm:col-span-2"><span className="text-neutral-500">Participantes:</span> {r.participantes}</p>}
          </section>

          {r.ata && (
            <section className="mt-5">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Ata</h2>
              <RichTextView texto={r.ata} className="mt-1" />
            </section>
          )}
          <Secao titulo="Pauta" texto={r.pauta} />
          <Secao titulo="Decisões" texto={r.decisoes} />
          <Secao titulo="Próximos passos" texto={r.proximosPassos} />

          {!r.ata && !r.pauta && !r.decisoes && !r.proximosPassos && (
            <p className="mt-6 text-neutral-400">Esta ata ainda não tem conteúdo registrado.</p>
          )}
        </div>

        <footer className="mt-10 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Documento interno gerado pelo sistema.
        </footer>
      </article>
    </div>
  );
}
