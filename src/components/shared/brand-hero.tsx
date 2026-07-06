import type { LucideIcon } from "lucide-react";

/**
 * Cabeçalho branded (identidade Plante) para páginas de detalhe.
 * Faixa em chrome escuro com bloco amarelo (iniciais/ícone), título em
 * Space Grotesk, subtítulo e pill de status. As ações ficam numa barra
 * abaixo (fundo claro), onde os botões normais funcionam bem.
 */
export function BrandHero({
  titulo,
  subtitulo,
  inicial,
  icon: Icon,
  logoUrl,
  statusLabel,
  statusCor,
  acoes,
}: {
  titulo: string;
  subtitulo?: string | null;
  inicial?: string;
  icon?: LucideIcon;
  logoUrl?: string | null;
  statusLabel?: string;
  statusCor?: string;
  acoes?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl bg-chrome text-chrome-foreground shadow-sm">
        <div className="flex items-center gap-4 p-5 sm:p-6">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={titulo} className="size-14 shrink-0 rounded-2xl bg-white object-contain p-1" />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow font-display text-lg font-extrabold text-ink-900">
              {inicial ? inicial : Icon ? <Icon className="size-6" aria-hidden="true" /> : null}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold leading-tight">{titulo}</h1>
              {statusLabel && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${statusCor ?? "#9ca3af"}33`, color: statusCor ?? "#cbd5e1" }}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            {subtitulo && <p className="truncate text-sm text-chrome-foreground/60">{subtitulo}</p>}
          </div>
        </div>
      </section>

      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}
