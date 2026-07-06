"use client";

import { useState } from "react";
import { Globe, Copy, Check, X, ExternalLink, Pencil } from "lucide-react";
import { gerarPortal, desativarPortal, personalizarSlugPortal } from "@/lib/portal/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PortalPanel({ clienteId, link }: { clienteId: string; link: string | null }) {
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [base, setBase] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function copiar() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* ignora */ }
  }

  async function salvarSlug() {
    setErro(null);
    setSalvando(true);
    try {
      const r = await personalizarSlugPortal(clienteId, base);
      if (r.error) setErro(r.error);
      else { setEditando(false); setBase(""); }
    } catch (e) {
      if (!recarregarSeStale(e)) setErro("Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (!link) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Gere um link de acompanhamento para o cliente ver, sem login, os jobs em andamento, as próximas postagens e as peças que aguardam aprovação.
        </p>
        <form action={async () => { try { await gerarPortal(clienteId); } catch (e) { recarregarSeStale(e); } }}>
          <Button type="submit" size="sm"><Globe className="size-4" /> Ativar portal do cliente</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Link do portal</p>
      <div className="flex items-center gap-2">
        <Input readOnly value={link} className="flex-1 text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
        </Button>
        <Button asChild variant="outline" size="sm"><a href={link} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Abrir</a></Button>
      </div>

      {editando ? (
        <div className="space-y-1.5 rounded-md border border-border p-2">
          <div className="flex items-center gap-2">
            <Input value={base} onChange={(e) => setBase(e.target.value)} placeholder="ex.: dra-jessica" className="flex-1 text-sm" />
            <Button type="button" size="sm" onClick={salvarSlug} disabled={salvando || !base.trim()}>{salvando ? "Salvando…" : "Salvar"}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditando(false); setErro(null); }}>Cancelar</Button>
          </div>
          {erro && <p className="text-xs text-destructive">{erro}</p>}
          <p className="text-xs text-muted-foreground">Vira <code>/portal/{base.trim() ? base.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "nome"}-xxxx</code> — o sufixo aleatório mantém o link seguro.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(true)}><Pencil className="size-4" /> Personalizar link</Button>
          <form action={async () => { try { await desativarPortal(clienteId); } catch (e) { recarregarSeStale(e); } }}>
            <Button type="submit" variant="ghost" size="sm"><X className="size-4" /> Desativar portal</Button>
          </form>
        </div>
      )}
    </div>
  );
}
