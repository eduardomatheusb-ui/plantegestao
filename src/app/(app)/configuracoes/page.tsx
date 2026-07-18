import Link from "next/link";
import { Building2, Users, ShieldCheck, ListChecks, Package, ListTree, Workflow } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

const ITENS = [
  { href: "/configuracoes/usuarios", icon: Users, titulo: "Usuários", desc: "Quem acessa o sistema, perfis e convites." },
  { href: "/configuracoes/perfis", icon: ShieldCheck, titulo: "Perfis de acesso", desc: "Crie e ajuste o que cada perfil pode fazer em cada módulo." },
  { href: "/configuracoes/empresa", icon: Building2, titulo: "Dados da empresa", desc: "Aparecem no cabeçalho das propostas, PIs e produção." },
  { href: "/cadastros/produtos", icon: Package, titulo: "Produtos / Serviços", desc: "Catálogo usado em propostas e orçamentos." },
  { href: "/cadastros/categorias", icon: ListTree, titulo: "Categorias", desc: "Plano de contas (receitas e despesas)." },
  { href: "/jobs/status", icon: ListChecks, titulo: "Status de jobs", desc: "Configure as etapas do fluxo (kanban) dos jobs." },
  { href: "/configuracoes/fluxos", icon: Workflow, titulo: "Fluxos de trabalho", desc: "Etapas que nascem com cada tipo de job e quem entra automaticamente." },
];

export default async function ConfiguracoesHubPage() {
  await requireModulo("admin", "ADMIN");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader titulo="Administração" descricao="Configurações do sistema e controle de acesso." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ITENS.map((it) => (
          <Link key={it.href} href={it.href} className="group focus-visible:outline-none">
            <Card className="flex h-full items-start gap-4 p-5 transition-colors group-hover:border-foreground/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <span className="rounded-lg bg-muted p-2.5 text-foreground">
                <it.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="space-y-1">
                <span className="block font-display font-semibold">{it.titulo}</span>
                <span className="block text-sm text-muted-foreground">{it.desc}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
