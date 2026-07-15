import { Fragment } from "react";

const RE = /(https?:\/\/[^\s]+)/g;

/**
 * Transforma URLs (http/https) em links clicáveis dentro de um texto,
 * retornando nós inline (sem wrapper) — pode ir dentro de <span>/<p>.
 * Herda a cor do contexto (funciona em balão de chat colorido ou claro).
 */
export function linkificar(texto: string) {
  return texto.split(RE).map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a
        key={i}
        href={p.replace(/[.,;)]+$/, "")}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline underline-offset-2 hover:opacity-80"
      >
        {p}
      </a>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}
