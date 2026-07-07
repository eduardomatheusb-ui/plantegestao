import { Donut } from "@/components/dashboard/donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bloco } from "@/lib/painel/queries";
import { IndicadorCard } from "./indicador-card";

export function BlocoCard({ bloco }: { bloco: Bloco }) {
  const semDados = bloco.indicadores.every((i) => i.valor == null) && !(bloco.barras && bloco.barras.length);
  const maxBarra = bloco.barras?.reduce((m, b) => Math.max(m, b.valor), 0) ?? 0;

  return (
    <Card id={`bloco-${bloco.chave}`} className="scroll-mt-24">
      <CardHeader>
        <CardTitle>{bloco.titulo}</CardTitle>
        <p className="text-sm text-muted-foreground">{bloco.descricao}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {semDados ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bloco.indicadores.map((i) => <IndicadorCard key={i.chave} i={i} />)}
            </div>

            {bloco.donuts && bloco.donuts.length > 0 && (
              <div className="flex flex-wrap gap-6">
                {bloco.donuts.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <Donut pct={d.pct} size={96} stroke={11} />
                    <span className="text-xs text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            )}

            {bloco.barras && bloco.barras.length > 0 && (
              <div className="space-y-2">
                {bloco.barras.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-40 shrink-0 truncate" title={b.label}>{b.label}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded bg-brand-yellow" style={{ width: `${maxBarra ? (b.valor / maxBarra) * 100 : 0}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{b.valor}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
