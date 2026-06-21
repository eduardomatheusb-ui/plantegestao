import { cn } from "@/lib/utils";

/**
 * Marca da Plante. Símbolo (lâmpada/broto estilizado) desenhado em SVG próprio
 * + wordmark. Para usar o asset oficial, troque o <svg> por <img src="/brand/..." />.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7 shrink-0" />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          Plante<span className="text-brand-yellow"> Gestão</span>
        </span>
      )}
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  // Broto/lâmpada estilizado em amarelo de marca. Asset configurável.
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Plante">
      <rect width="32" height="32" rx="8" fill="var(--ink-900)" />
      <path
        d="M16 24v-6.5M16 17.5c0-3 2.2-4.4 4.4-4.6 .3 0 .5.2.5.5C20.7 16 18.8 17.6 16 17.5Zm0 0c0-3-2.2-4.4-4.4-4.6-.3 0-.5.2-.5.5C11.3 16 13.2 17.6 16 17.5Z"
        stroke="var(--brand-yellow)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
