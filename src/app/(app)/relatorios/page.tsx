import Link from "next/link";
import { TrendingUp, BarChart3, ListChecks, Users, Truck, ArrowRight, FolderKanban, Megaphone } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RELATORIOS_FINANCEIRO = [
  { titulo: "Demonstrativo por Competência (DRE)", desc: "Receitas e despesas por categoria no ano, independente da quitação.", href: "/relatorios/financeiro/dre", icon: BarChart3 },
  { titulo: "Fluxo de Caixa", desc: "Resultado mês a mês e saldo acumulado no ano.", href: "/relatorios/financeiro/fluxo-caixa", icon: TrendingUp },
  { titulo: "Lançamentos", desc: "Lista completa com comparativo previsto × realizado.", href: "/relatorios/financeiro/lancamentos", icon: ListChecks },
  { titulo: "Movimentação por Cliente", desc: "Todas as receitas e despesas de um cliente.", href: "/relatorios/financeiro/por-cliente", icon: Users },
  { titulo: "Movimentação de Terceiros", desc: "Movimentação por fornecedor.", href: "/relatorios/financeiro/terceiros", icon: Truck },
];

const RELATORIOS_TRABALHO = [
  { titulo: "Projetos", desc: "Projetos ativos por situação e por cliente, com budget.", href: "/relatorios/trabalho/projetos", icon: FolderKanban },
  { titulo: "Jobs", desc: "Jobs por status e por responsável, com % concluído no prazo.", href: "/relatorios/trabalho/jobs", icon: ListChecks },
  { titulo: "Mídia", desc: "Investimento em mídia por veículo e por cliente.", href: "/relatorios/trabalho/midia", icon: Megaphone },
];

function Secao({ titulo, itens }: { titulo: string; itens: { titulo: string; desc: string; href: string; icon: typeof BarChart3 }[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((r) => {
          const Icon = r.icon;
          return (
            <Link key={r.href} href={r.href} className="group">
              <Card className="h-full transition-colors group-hover:border-brand-yellow">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <span className="flex size-9 items-center justify-center rounded-md bg-muted"><Icon className="size-4" aria-hidden="true" /></span>
                  <CardTitle className="text-sm">{r.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium">Abrir <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" /></p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function RelatoriosPage() {
  await requireModulo("relatorios", "VER");

  return (
    <div className="space-y-8">
      <PageHeader titulo="Relatórios" descricao="Análises construídas sobre os dados do sistema." />

      <Secao titulo="Trabalho" itens={RELATORIOS_TRABALHO} />
      <Secao titulo="Financeiro" itens={RELATORIOS_FINANCEIRO} />
    </div>
  );
}
