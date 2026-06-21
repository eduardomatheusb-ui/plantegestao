"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { PROJETO_STATUS } from "@/lib/projetos/situacao";

export function FiltersBar({ clientes }: { clientes: { id: string; nome: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get("q") ?? "");

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  React.useEffect(() => {
    const t = setTimeout(() => setParam("q", q), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const selectCls =
    "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="busca-proj" className="sr-only">Buscar projetos</label>
        <input
          id="busca-proj"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar projetos…"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="filtro-status" className="sr-only">Status</label>
        <select
          id="filtro-status"
          className={selectCls}
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="">Todos os status</option>
          {PROJETO_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtro-cliente" className="sr-only">Cliente</label>
        <select
          id="filtro-cliente"
          className={selectCls}
          defaultValue={searchParams.get("clienteId") ?? ""}
          onChange={(e) => setParam("clienteId", e.target.value)}
        >
          <option value="">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          defaultChecked={searchParams.get("favoritos") === "1"}
          onChange={(e) => setParam("favoritos", e.target.checked ? "1" : "")}
        />
        Só favoritos
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          defaultChecked={searchParams.get("arquivados") === "1"}
          onChange={(e) => setParam("arquivados", e.target.checked ? "1" : "")}
        />
        Mostrar arquivados
      </label>
    </div>
  );
}
