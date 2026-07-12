"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FORMATOS_POST } from "@/lib/jobs/formatos";

type Opt = { id: string; nome: string };

const STATUS = [
  { key: "rascunho", label: "Rascunho" },
  { key: "enviado", label: "Aguardando cliente" },
  { key: "aprovado", label: "Aprovado" },
  { key: "ajustes", label: "Ajustes" },
];

export function CalendarioFilters({ clientes }: { clientes: Opt[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="c-cli" className="sr-only">Cliente</label>
      <select id="c-cli" className={sel} defaultValue={searchParams.get("clienteId") ?? ""} onChange={(e) => setParam("clienteId", e.target.value)}>
        <option value="">Todos os clientes</option>
        {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
      </select>

      <label htmlFor="c-fmt" className="sr-only">Formato</label>
      <select id="c-fmt" className={sel} defaultValue={searchParams.get("formato") ?? ""} onChange={(e) => setParam("formato", e.target.value)}>
        <option value="">Todas as redes</option>
        {FORMATOS_POST.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
      </select>

      <label htmlFor="c-status" className="sr-only">Status de aprovação</label>
      <select id="c-status" className={sel} defaultValue={searchParams.get("aprovacaoStatus") ?? ""} onChange={(e) => setParam("aprovacaoStatus", e.target.value)}>
        <option value="">Todos os status</option>
        {STATUS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
      </select>
    </div>
  );
}
