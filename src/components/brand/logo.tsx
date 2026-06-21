import { cn } from "@/lib/utils";

/**
 * Marca oficial da Plante. Os arquivos ficam em `public/brand/` e são servidos
 * por `/brand/...`. Para trocar o logo, substitua os SVGs naquela pasta.
 *
 * `tom` indica o FUNDO sobre o qual o logo aparece:
 *   - "escuro"  → fundo escuro (chrome) → usa a versão BRANCA
 *   - "claro"   → fundo claro (conteúdo/documento) → usa a versão PRETA
 */
type Tom = "claro" | "escuro";

export function Logo({
  className,
  showWordmark = true,
  tom = "escuro",
}: {
  className?: string;
  showWordmark?: boolean;
  tom?: Tom;
}) {
  if (!showWordmark) {
    return <LogoMark tom={tom} className={className} />;
  }
  const src = tom === "escuro" ? "/brand/logo-branco.svg" : "/brand/logo-preto.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Plante Comunicação"
      className={cn("h-7 w-auto object-contain", className)}
    />
  );
}

export function LogoMark({ className, tom = "claro" }: { className?: string; tom?: Tom }) {
  const src = tom === "escuro" ? "/brand/icone-branco.svg" : "/brand/icone-preto.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Plante"
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
