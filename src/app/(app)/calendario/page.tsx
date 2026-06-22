import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarPostagensDoMes } from "@/lib/aprovacao/queries";
import { corAprovacao, rotuloAprovacao } from "@/lib/aprovacao/status";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string }> }) {
  await requireModulo("jobs", "VER");
  const sp = await searchParams;

  const hoje = new Date();
  const ano = sp.ano ? parseInt(sp.ano, 10) : hoje.getFullYear();
  const mes0 = sp.mes ? parseInt(sp.mes, 10) - 1 : hoje.getMonth();

  const posts = await listarPostagensDoMes(ano, mes0);

  // Agrupa por dia do mês.
  const porDia = new Map<number, typeof posts>();
  for (const p of posts) {
    if (!p.prazoPostagem) continue;
    const dia = new Date(p.prazoPostagem).getDate();
    const arr = porDia.get(dia) ?? [];
    arr.push(p);
    porDia.set(dia, arr);
  }

  const primeiroDiaSemana = new Date(ano, mes0, 1).getDay();
  const totalDias = new Date(ano, mes0 + 1, 0).getDate();
  const hojeNoMes = hoje.getFullYear() === ano && hoje.getMonth() === mes0 ? hoje.getDate() : -1;

  // Células: padding inicial + dias.
  const celulas: (number | null)[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDias; d++) celulas.push(d);

  const mesAnt = mes0 === 0 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes0 };
  const mesProx = mes0 === 11 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes0 + 2 };

  return (
    <div className="space-y-6">
      <PageHeader titulo="Calendário editorial" descricao="Postagens programadas por data de publicação." />

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{MESES[mes0]} {ano}</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link href={`/calendario?ano=${mesAnt.ano}&mes=${mesAnt.mes}`} aria-label="Mês anterior"><ChevronLeft className="size-4" /></Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/calendario">Hoje</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/calendario?ano=${mesProx.ano}&mes=${mesProx.mes}`} aria-label="Próximo mês"><ChevronRight className="size-4" /></Link></Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-lg border border-border bg-border">
          {DIAS.map((d) => (
            <div key={d} className="bg-muted px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
          {celulas.map((dia, i) => {
            const lista = dia ? porDia.get(dia) ?? [] : [];
            return (
              <div key={i} className={`min-h-24 bg-card p-1.5 ${dia === hojeNoMes ? "ring-2 ring-inset ring-primary" : ""}`}>
                {dia && <p className={`mb-1 text-xs font-medium ${dia === hojeNoMes ? "text-primary" : "text-muted-foreground"}`}>{dia}</p>}
                <div className="space-y-1">
                  {lista.map((p) => (
                    <Link key={p.id} href={`/jobs/${p.id}`} className="block rounded border-l-2 bg-muted/50 px-1.5 py-1 text-[11px] leading-tight hover:bg-muted" style={{ borderColor: corAprovacao(p.aprovacaoStatus) }} title={`${rotuloAprovacao(p.aprovacaoStatus)} — ${p.cliente?.nomeFantasia || p.cliente?.nome || ""}`}>
                      <span className="block truncate font-medium">{p.titulo}</span>
                      <span className="block truncate text-muted-foreground">{p.cliente?.nomeFantasia || p.cliente?.nome}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda de status */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {["rascunho", "enviado", "aprovado", "ajustes"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ backgroundColor: corAprovacao(s) }} aria-hidden="true" />
            {rotuloAprovacao(s)}
          </span>
        ))}
      </div>
    </div>
  );
}
