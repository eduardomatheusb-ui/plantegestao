import { formatBRL } from "@/lib/utils";

type Ponto = { label: string; receitas: number; despesas: number };

/** Gráfico de barras receitas × despesas dos últimos meses (SVG, sem libs). */
export function FinanceiroChart({ serie }: { serie: Ponto[] }) {
  const max = Math.max(1, ...serie.flatMap((p) => [p.receitas, p.despesas]));
  const larguraGrupo = 90;
  const larguraBarra = 30;
  const altura = 220;
  const base = altura - 28;
  const width = serie.length * larguraGrupo + 20;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-success" /> Receitas</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-destructive" /> Despesas</span>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={altura} role="img" aria-label="Receitas e despesas por mês">
          {serie.map((p, i) => {
            const x = i * larguraGrupo + 20;
            const hR = Math.round((p.receitas / max) * base);
            const hD = Math.round((p.despesas / max) * base);
            return (
              <g key={i}>
                <rect x={x} y={base - hR} width={larguraBarra} height={hR} rx={3} className="fill-success" />
                <rect x={x + larguraBarra + 6} y={base - hD} width={larguraBarra} height={hD} rx={3} className="fill-destructive" />
                <text x={x + larguraBarra} y={altura - 8} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[11px] capitalize">
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {serie.slice(-2).map((p, i) => (
          <div key={i} className="rounded-md border border-border p-2">
            <p className="text-xs capitalize text-muted-foreground">{p.label}</p>
            <p className="text-success">{formatBRL(p.receitas)}</p>
            <p className="text-destructive">−{formatBRL(p.despesas)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
