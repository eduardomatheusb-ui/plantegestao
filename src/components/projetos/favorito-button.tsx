"use client";

import { Star } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toggleFavoritoProjeto } from "@/lib/projetos/actions";
import { cn } from "@/lib/utils";

function Botao({ favorito }: { favorito: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={favorito}
      title={favorito ? "Desfavoritar" : "Favoritar"}
      className="rounded-md p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <Star
        className={cn(
          "size-4",
          favorito ? "fill-brand-yellow text-brand-yellow" : "text-muted-foreground",
        )}
      />
      <span className="sr-only">{favorito ? "Desfavoritar" : "Favoritar"}</span>
    </button>
  );
}

export function FavoritoButton({ id, favorito }: { id: string; favorito: boolean }) {
  return (
    <form action={toggleFavoritoProjeto.bind(null, id)}>
      <Botao favorito={favorito} />
    </form>
  );
}
