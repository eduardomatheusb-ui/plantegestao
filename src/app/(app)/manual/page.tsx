import { Maximize2 } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Bíblia Operacional — TREM" };

// Manual servido por rota autenticada (bundle fora de public/, só para quem está logado).
const MANUAL_URL = "/manual/asset/biblia-operacional.html";

export default async function ManualPage() {
  await requireUser();

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Bíblia Operacional"
        descricao="O manual de operação, estratégia e governança da Plante (v2.3). Uso interno e confidencial."
        acao={
          <Button asChild variant="outline">
            <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
              <Maximize2 className="size-4" /> Abrir em tela cheia
            </a>
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <iframe
          src={MANUAL_URL}
          title="Plante OS — Bíblia Operacional v2.3"
          className="h-[calc(100vh-190px)] min-h-[560px] w-full"
        />
      </div>
    </div>
  );
}
