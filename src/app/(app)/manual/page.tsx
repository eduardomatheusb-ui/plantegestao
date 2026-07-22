import Link from "next/link";
import { ExternalLink, BookOpen, Settings2 } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Bíblia Operacional — TREM" };

/** Converte um link do Google Drive no URL de incorporação (/preview). */
function driveEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/\/file\/d\/([^/?#]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  m = u.match(/[?&]id=([^&]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return u; // já é um /preview ou outro embed
}

export default async function ManualPage() {
  const user = await requireUser();
  const [empresa, acesso, leitura] = await Promise.all([
    db.empresa.findUnique({ where: { id: "singleton" }, select: { manualDriveUrl: true } }),
    acessoAtual(),
    db.usuario.findUnique({ where: { id: user.id }, select: { manualLidoEm: true } }),
  ]);

  // Registra a leitura (no máximo uma gravação por dia) — alimenta o lembrete
  // que cobra de quem nunca abriu a Bíblia.
  const hoje = new Date().toDateString();
  if (!leitura?.manualLidoEm || leitura.manualLidoEm.toDateString() !== hoje) {
    await db.usuario.update({ where: { id: user.id }, data: { manualLidoEm: new Date() } });
  }
  const embed = driveEmbed(empresa?.manualDriveUrl);
  const ehAdmin = podeModulo(acesso.caps, "admin", "ADMIN");

  return (
    <div className="space-y-4">
      <PageHeader
        titulo="Bíblia Operacional"
        descricao="O manual de operação, estratégia e governança da Plante. Uso interno e confidencial."
        acao={
          empresa?.manualDriveUrl ? (
            <Button asChild variant="outline">
              <a href={empresa.manualDriveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Abrir no Drive
              </a>
            </Button>
          ) : undefined
        }
      />

      {embed ? (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <iframe
            src={embed}
            title="Plante OS — Bíblia Operacional"
            allow="autoplay"
            className="h-[calc(100vh-190px)] min-h-[560px] w-full"
          />
        </div>
      ) : (
        <EmptyState
          titulo="Bíblia ainda não configurada"
          descricao={
            ehAdmin
              ? "Cole o link do Google Drive da Bíblia em Administração → Empresa. O arquivo precisa estar compartilhado como “Qualquer pessoa com o link → Leitor”."
              : "O manual ainda não foi configurado. Peça a um administrador para vincular o documento."
          }
          acao={
            ehAdmin ? (
              <Button asChild>
                <Link href="/configuracoes/empresa"><Settings2 className="size-4" /> Configurar</Link>
              </Button>
            ) : (
              <BookOpen className="size-8 text-muted-foreground" />
            )
          }
        />
      )}
    </div>
  );
}
