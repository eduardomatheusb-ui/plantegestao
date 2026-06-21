"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

type Opt = { id: string; nome: string };

export function JobsFilters({
  statuses,
  responsaveis,
  clientes,
}: {
  statuses: Opt[];
  responsaveis: Opt[];
  clientes: Opt[];
}) {
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

  const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="busca-job" className="sr-only">Buscar jobs</label>
        <input
          id="busca-job"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jobs…"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <label htmlFor="f-status" className="sr-only">Status</label>
      <select id="f-status" className={sel} defaultValue={searchParams.get("statusId") ?? ""} onChange={(e) => setParam("statusId", e.target.value)}>
        <option value="">Todos os status</option>
        {statuses.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
      </select>

      <label htmlFor="f-resp" className="sr-only">Responsável</label>
      <select id="f-resp" className={sel} defaultValue={searchParams.get("responsavelId") ?? ""} onChange={(e) => setParam("responsavelId", e.target.value)}>
        <option value="">Todos os responsáveis</option>
        {responsaveis.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
      </select>

      <label htmlFor="f-cli" className="sr-only">Cliente</label>
      <select id="f-cli" className={sel} defaultValue={searchParams.get("clienteId") ?? ""} onChange={(e) => setParam("clienteId", e.target.value)}>
        <option value="">Todos os clientes</option>
        {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
      </select>
    </div>
  );
}
