"use client";

import { useEffect, useState } from "react";
import { Type, AlignJustify, Pause, Contrast } from "lucide-react";

type Prefs = { texto: boolean; espacado: boolean; movimento: boolean; contraste: boolean };
const PADRAO: Prefs = { texto: false, espacado: false, movimento: false, contraste: false };
const CHAVE = "plante-a11y";

const CLASSES: Record<keyof Prefs, string> = {
  texto: "a11y-texto-grande",
  espacado: "a11y-espacado",
  movimento: "a11y-sem-movimento",
  contraste: "a11y-alto-contraste",
};

const OPCOES: { chave: keyof Prefs; titulo: string; descricao: string; icon: typeof Type }[] = [
  { chave: "texto", titulo: "Texto maior", descricao: "Aumenta o tamanho das letras em todo o sistema.", icon: Type },
  { chave: "espacado", titulo: "Mais espaçamento", descricao: "Mais espaço entre linhas e letras — ajuda na leitura.", icon: AlignJustify },
  { chave: "movimento", titulo: "Reduzir movimento", descricao: "Desliga animações e transições.", icon: Pause },
  { chave: "contraste", titulo: "Alto contraste", descricao: "Deixa textos e bordas mais escuros e nítidos.", icon: Contrast },
];

function aplicar(p: Prefs) {
  const c = document.documentElement.classList;
  (Object.keys(CLASSES) as (keyof Prefs)[]).forEach((k) => c.toggle(CLASSES[k], p[k]));
}

export function PainelAcessibilidade() {
  const [prefs, setPrefs] = useState<Prefs>(PADRAO);

  useEffect(() => {
    try {
      const salvo = { ...PADRAO, ...(JSON.parse(localStorage.getItem(CHAVE) || "{}") as Partial<Prefs>) };
      setPrefs(salvo);
    } catch { /* ignora */ }
  }, []);

  function alternar(chave: keyof Prefs) {
    setPrefs((atual) => {
      const nova = { ...atual, [chave]: !atual[chave] };
      try { localStorage.setItem(CHAVE, JSON.stringify(nova)); } catch { /* ignora */ }
      aplicar(nova);
      return nova;
    });
  }

  return (
    <div className="space-y-3">
      {OPCOES.map((o) => {
        const Icon = o.icon;
        const ativo = prefs[o.chave];
        return (
          <button
            key={o.chave}
            type="button"
            role="switch"
            aria-checked={ativo}
            onClick={() => alternar(o.chave)}
            className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"><Icon className="size-5" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{o.titulo}</span>
              <span className="block text-sm text-muted-foreground">{o.descricao}</span>
            </span>
            <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${ativo ? "bg-primary" : "bg-input"}`}>
              <span className={`inline-block size-5 rounded-full bg-white transition-transform ${ativo ? "translate-x-5" : "translate-x-0.5"}`} />
            </span>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">As preferências ficam salvas neste navegador. Elas valem junto com o tema claro/escuro do menu.</p>
    </div>
  );
}
