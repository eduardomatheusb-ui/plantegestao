import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { relatorioCliente } from "@/lib/clientes/queries";
import { getEmpresa } from "@/lib/empresa";
import { rotuloTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloPlataforma } from "@/lib/trafego/constantes";
import { formatBRL } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/propostas/print-button";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "—";
}

export default async function ImprimirRelatorioClientePage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  await requireUser();

  const agora = new Date();
  const ano = sp.ano ? parseInt(sp.ano, 10) : agora.getFullYear();
  const mes = sp.mes ? parseInt(sp.mes, 10) : agora.getMonth() + 1;

  const [rel, empresa] = await Promise.all([relatorioCliente(id, ano, mes), getEmpresa()]);
  if (!rel) notFound();

  const nome = rel.cliente.nomeFantasia || rel.cliente.nome;
  const totalTrafego = rel.trafego.reduce((s, t) => s + t.investido, 0);

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-10 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            <LogoMark tom="badge" className="h-11 w-auto shrink-0" />
            <div className="space-y-0.5">
              <p className="font-display text-xl font-bold leading-none">{empresa.marca}</p>
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
              <p className="text-xs text-neutral-500">{empresa.email} · {empresa.telefone}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">RELATÓRIO DO MÊS</p>
            <p className="text-sm text-neutral-500">{MESES[mes - 1]} / {ano}</p>
          </div>
        </header>

        <section className="mt-6 flex items-center gap-4">
          {rel.cliente.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rel.cliente.logoUrl} alt={nome} className="h-14 w-14 shrink-0 rounded-lg object-contain" />
          ) : null}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Cliente</p>
            <p className="font-display text-2xl font-bold leading-tight">{nome}</p>
          </div>
        </section>

        {/* Postagens do mês */}
        <section className="mt-8">
          <h2 className="mb-3 border-b border-neutral-300 pb-1 font-display text-base font-bold">Postagens do mês ({rel.postagens.length})</h2>
          {rel.postagens.length === 0 ? (
            <p className="text-xs text-neutral-500">Nenhuma postagem programada neste mês.</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-neutral-500"><th className="py-1 font-semibold">Data</th><th className="py-1 font-semibold">Peça</th><th className="py-1 font-semibold">Formato(s)</th></tr></thead>
              <tbody>
                {rel.postagens.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100">
                    <td className="py-1 pr-2 tabular-nums">{dataBR(p.prazoPostagem)}</td>
                    <td className="py-1 pr-2">{p.titulo}</td>
                    <td className="py-1 text-neutral-600">{rotulosFormatos(p.formatos).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Jobs entregues */}
        <section className="mt-8">
          <h2 className="mb-3 border-b border-neutral-300 pb-1 font-display text-base font-bold">Entregas concluídas ({rel.entregues.length})</h2>
          {rel.entregues.length === 0 ? (
            <p className="text-xs text-neutral-500">Nenhuma entrega concluída neste mês.</p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-neutral-500"><th className="py-1 font-semibold">Concluído</th><th className="py-1 font-semibold">Trabalho</th><th className="py-1 font-semibold">Tipo</th></tr></thead>
              <tbody>
                {rel.entregues.map((j) => (
                  <tr key={j.id} className="border-t border-neutral-100">
                    <td className="py-1 pr-2 tabular-nums">{dataBR(j.concluidoEm)}</td>
                    <td className="py-1 pr-2"><span className="text-neutral-500">#{j.numero}</span> {j.titulo}</td>
                    <td className="py-1 text-neutral-600">{rotuloTipoJob(j.tipo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Tráfego */}
        {rel.trafego.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 border-b border-neutral-300 pb-1 font-display text-base font-bold">Tráfego pago · investido {formatBRL(totalTrafego)}</h2>
            <table className="w-full text-xs">
              <thead><tr className="text-left text-neutral-500"><th className="py-1 font-semibold">Campanha</th><th className="py-1 font-semibold">Plataforma</th><th className="py-1 text-right font-semibold">Investido</th><th className="py-1 text-right font-semibold">Alcance</th><th className="py-1 text-right font-semibold">Cliques</th><th className="py-1 text-right font-semibold">Leads</th><th className="py-1 text-right font-semibold">CPL</th></tr></thead>
              <tbody>
                {rel.trafego.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100">
                    <td className="py-1 pr-2">{t.nome}</td>
                    <td className="py-1 pr-2 text-neutral-600">{rotuloPlataforma(t.plataforma)}</td>
                    <td className="py-1 text-right tabular-nums">{formatBRL(t.investido)}</td>
                    <td className="py-1 text-right tabular-nums">{t.alcance.toLocaleString("pt-BR")}</td>
                    <td className="py-1 text-right tabular-nums">{t.cliques.toLocaleString("pt-BR")}</td>
                    <td className="py-1 text-right tabular-nums">{t.leads.toLocaleString("pt-BR")}</td>
                    <td className="py-1 text-right tabular-nums">{t.cpl != null ? formatBRL(t.cpl) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[10px] text-neutral-400">
          Relatório gerado por {empresa.marca} · {MESES[mes - 1]}/{ano}
        </footer>
      </article>
    </div>
  );
}
