import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterReuniao } from "@/lib/reunioes/queries";
import { getEmpresa } from "@/lib/empresa";
import { formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/propostas/print-button";

export const metadata = { title: "Ata de reunião — impressão" };

function Secao({ titulo, texto }: { titulo: string; texto: string | null | undefined }) {
  if (!texto) return null;
  return (
    <section className="mt-5">
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">{titulo}</h2>
      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">{texto}</p>
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

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            <LogoMark tom="badge" className="h-11 w-auto shrink-0" />
            <div className="space-y-0.5">
              <p className="font-display text-xl font-bold leading-none">{empresa.marca}</p>
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">ATA DE REUNIÃO</p>
            <p className="text-sm text-neutral-500">{formatDate(r.data)}</p>
          </div>
        </header>

        <h1 className="mt-6 font-display text-xl font-bold">{r.titulo}</h1>
        <section className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
          <p><span className="text-neutral-500">Cliente:</span> {r.cliente?.nome ?? "Reunião interna"}</p>
          <p><span className="text-neutral-500">Data:</span> {formatDate(r.data)}</p>
          {r.participantes && <p className="sm:col-span-2"><span className="text-neutral-500">Participantes:</span> {r.participantes}</p>}
        </section>

        <Secao titulo="Ata" texto={r.ata} />
        <Secao titulo="Pauta" texto={r.pauta} />
        <Secao titulo="Decisões" texto={r.decisoes} />
        <Secao titulo="Próximos passos" texto={r.proximosPassos} />

        {!r.ata && !r.pauta && !r.decisoes && !r.proximosPassos && (
          <p className="mt-6 text-sm text-neutral-400">Esta ata ainda não tem conteúdo registrado.</p>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Documento interno gerado pelo sistema.
        </footer>
      </article>
    </div>
  );
}
