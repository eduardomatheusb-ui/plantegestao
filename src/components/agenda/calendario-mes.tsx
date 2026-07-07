import Link from "next/link";
import { corTipo } from "@/lib/agenda/constants";
import type { CompromissoDetalhe } from "@/lib/agenda/queries";
import { cn } from "@/lib/utils";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function hora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}
function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Grade mensal (6 semanas, começando no domingo). */
export function CalendarioMes({ ano, mes, compromissos }: { ano: number; mes: number; compromissos: CompromissoDetalhe[] }) {
  const primeiro = new Date(ano, mes - 1, 1);
  const inicioGrade = new Date(primeiro);
  inicioGrade.setDate(1 - primeiro.getDay()); // volta até o domingo
  const hoje = new Date();

  const dias = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicioGrade);
    d.setDate(inicioGrade.getDate() + i);
    return d;
  });

  const doDia = (dia: Date) =>
    compromissos
      .filter((c) => {
        const ini = new Date(c.inicio);
        const fim = c.fim ? new Date(c.fim) : ini;
        // evento cobre este dia (entre início e fim, por data)
        const d0 = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
        const i0 = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
        const f0 = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
        return d0 >= i0 && d0 <= f0;
      })
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {DIAS.map((d) => (<div key={d} className="py-2">{d}</div>))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, i) => {
          const foraMes = dia.getMonth() !== mes - 1;
          const eventos = doDia(dia);
          return (
            <div key={i} className={cn("min-h-24 border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0", foraMes && "bg-muted/30")}>
              <div className="mb-1 flex items-center justify-between">
                <span className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  mesmoDia(dia, hoje) ? "bg-brand-yellow font-bold text-ink-900" : foraMes ? "text-muted-foreground/60" : "text-foreground",
                )}>
                  {dia.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {eventos.map((c) => (
                  <Link
                    key={c.id}
                    href={`/agenda/${c.id}/editar`}
                    title={`${c.titulo}${c.cliente ? ` · ${c.cliente.nome}` : ""}`}
                    className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] leading-tight hover:opacity-80"
                    style={{ backgroundColor: `${corTipo(c.tipo)}22` }}
                  >
                    <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: corTipo(c.tipo) }} aria-hidden="true" />
                    <span className="truncate">
                      {!c.diaInteiro && <span className="tabular-nums text-muted-foreground">{hora(c.inicio)} </span>}
                      {c.titulo}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
