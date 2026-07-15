import { cn } from "@/lib/utils";

const URL_RE = /(https?:\/\/[^\s]+)/g;

/**
 * Renderiza um texto transformando URLs (http/https) em links clicáveis,
 * preservando quebras de linha. Para campos livres que podem conter links
 * (redes sociais, links úteis, observações…).
 */
export function TextoComLinks({ texto, className }: { texto: string; className?: string }) {
  const partes = texto.split(URL_RE);
  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {partes.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a
            key={i}
            href={p.replace(/[.,;)]+$/, "")}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline underline-offset-2 hover:opacity-80"
          >
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </p>
  );
}
