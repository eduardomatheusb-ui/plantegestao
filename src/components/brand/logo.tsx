import { cn } from "@/lib/utils";

/**
 * Marca oficial da Plante. Os arquivos ficam em `public/brand/` e são servidos
 * por `/brand/...`. Para trocar o logo, substitua os SVGs naquela pasta.
 *
 * `tom` indica o FUNDO/variante:
 *   - "escuro" → fundo escuro (chrome) → versão BRANCA
 *   - "claro"  → fundo claro (conteúdo) → versão PRETA
 *   - "badge"  → selo autocontido (quadrado escuro + ícone amarelo); usado nos PDFs
 */
type Tom = "claro" | "escuro" | "badge";

export function Logo({
  className,
  showWordmark = true,
  tom = "escuro",
  sub,
}: {
  className?: string;
  showWordmark?: boolean;
  tom?: Tom;
  /** Rótulo do sistema ao lado do logo, ex.: "Gestão" */
  sub?: string;
}) {
  if (!showWordmark) {
    return <LogoMark tom={tom} className={className} />;
  }
  const src = tom === "escuro" ? "/brand/logo-branco.svg" : "/brand/logo-preto.svg";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Plante Comunicação" className="h-7 w-auto object-contain" />
      {sub && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "h-5 w-px",
              tom === "escuro" ? "bg-chrome-foreground/25" : "bg-border",
            )}
          />
          <span
            className={cn(
              "font-display text-sm font-semibold tracking-wide",
              tom === "escuro" ? "text-chrome-foreground/75" : "text-muted-foreground",
            )}
          >
            {sub}
          </span>
        </>
      )}
    </span>
  );
}

export function LogoMark({ className, tom = "claro" }: { className?: string; tom?: Tom }) {
  const src =
    tom === "badge"
      ? "/brand/icone-badge.svg"
      : tom === "escuro"
        ? "/brand/icone-branco.svg"
        : "/brand/icone-preto.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Plante" className={cn("h-8 w-auto object-contain", className)} />
  );
}
