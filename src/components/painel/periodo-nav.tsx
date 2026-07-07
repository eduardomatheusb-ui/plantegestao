"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PeriodoTipo } from "@/lib/painel/periodo";

const sel = "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function PeriodoNav({
  tipo, ano, mes, tri, de, ate,
}: {
  tipo: PeriodoTipo;
  ano: number;
  mes: number;
  tri: number;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [t, setT] = React.useState<PeriodoTipo>(tipo);
  const [a, setA] = React.useState(ano);
  const [m, setM] = React.useState(mes);
  const [q, setQ] = React.useState(tri);
  const [d1, setD1] = React.useState(de);
  const [d2, setD2] = React.useState(ate);

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  function aplicar() {
    const p = new URLSearchParams();
    p.set("periodo", t);
    if (t === "mes") { p.set("ano", String(a)); p.set("mes", String(m)); }
    else if (t === "trimestre") { p.set("ano", String(a)); p.set("tri", String(q)); }
    else if (t === "ano") { p.set("ano", String(a)); }
    else if (t === "intervalo") { if (d1) p.set("de", d1); if (d2) p.set("ate", d2); }
    router.push(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      <div className="space-y-1.5">
        <Label htmlFor="p-tipo">Período</Label>
        <select id="p-tipo" className={sel} value={t} onChange={(e) => setT(e.target.value as PeriodoTipo)}>
          <option value="mes">Mês</option>
          <option value="trimestre">Trimestre</option>
          <option value="ano">Ano</option>
          <option value="intervalo">Intervalo</option>
        </select>
      </div>

      {t === "mes" && (
        <div className="space-y-1.5">
          <Label htmlFor="p-mes">Mês</Label>
          <select id="p-mes" className={sel} value={m} onChange={(e) => setM(Number(e.target.value))}>
            {MESES.map((nome, i) => <option key={i} value={i + 1} className="capitalize">{nome}</option>)}
          </select>
        </div>
      )}

      {t === "trimestre" && (
        <div className="space-y-1.5">
          <Label htmlFor="p-tri">Trimestre</Label>
          <select id="p-tri" className={sel} value={q} onChange={(e) => setQ(Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}º</option>)}
          </select>
        </div>
      )}

      {(t === "mes" || t === "trimestre" || t === "ano") && (
        <div className="space-y-1.5">
          <Label htmlFor="p-ano">Ano</Label>
          <select id="p-ano" className={sel} value={a} onChange={(e) => setA(Number(e.target.value))}>
            {anos.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {t === "intervalo" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="p-de">De</Label>
            <Input id="p-de" type="date" value={d1} onChange={(e) => setD1(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-ate">Até</Label>
            <Input id="p-ate" type="date" value={d2} onChange={(e) => setD2(e.target.value)} className="w-40" />
          </div>
        </>
      )}

      <Button type="button" onClick={aplicar}>Aplicar</Button>
    </div>
  );
}
