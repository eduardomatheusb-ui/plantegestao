"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AbaEstacao = {
  valor: string;
  rotulo: string;
  badge?: number;
  conteudo: React.ReactNode;
};

/** Abas da Estação do Cliente com deep-link (?aba=) e lista rolável no mobile. */
export function EstacaoTabs({ abas, inicial }: { abas: AbaEstacao[]; inicial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [aba, setAba] = React.useState(inicial);

  function trocar(valor: string) {
    setAba(valor);
    const params = new URLSearchParams(searchParams.toString());
    if (valor === abas[0]?.valor) params.delete("aba");
    else params.set("aba", valor);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Tabs value={aba} onValueChange={trocar}>
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-auto flex-wrap justify-start sm:flex-nowrap">
          {abas.map((a) => (
            <TabsTrigger key={a.valor} value={a.valor}>
              {a.rotulo}
              {typeof a.badge === "number" && a.badge > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold leading-none text-ink-900 tabular-nums">
                  {a.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {abas.map((a) => (
        <TabsContent key={a.valor} value={a.valor} className="space-y-6">
          {a.conteudo}
        </TabsContent>
      ))}
    </Tabs>
  );
}
