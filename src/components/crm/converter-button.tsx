"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";
import { converterLeadEmCliente } from "@/lib/crm/actions";
import { Button } from "@/components/ui/button";

export function ConverterButton({ id, jaConvertido, clienteId }: { id: string; jaConvertido: boolean; clienteId?: string | null }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);

  if (jaConvertido && clienteId) {
    return (
      <Button asChild variant="outline" size="sm">
        <a href={`/cadastros/clientes/${clienteId}`}>Ver cliente</a>
      </Button>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => start(async () => {
          const r = await converterLeadEmCliente(id);
          if (r.ok && r.clienteId) router.push(`/cadastros/clientes/${r.clienteId}`);
          else setErro(r.erro ?? "Não foi possível converter.");
        })}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Converter em cliente
      </Button>
      {erro && <span className="text-xs text-destructive">{erro}</span>}
    </span>
  );
}
