import Link from "next/link";
import { TrendingUp, BarChart3, ListChecks, Users, Truck, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RELATORIOS_FINANCEIRO = [
  { titulo: "Demonstrativo por Competência (DRE)", desc: "Receitas e despesas por categoria no ano, independente da quitação.", href: "/relatorios/financeiro/dre", icon: BarChart3 },
  { titulo: "Fluxo de Caixa", desc: "Resultado mês a mês e saldo acumulado no ano.", href: "/relatorios/financeiro/fluxo-caixa", icon: TrendingUp },
  { titulo: "Lançamentos", desc: "Lista completa com comparativo previsto × realizado.", href: "/relatorios/financeiro/lancamentos", icon: ListChecks },
  { titulo: "Movimentação por Cliente", desc: "Todas as receitas e despesas de um cliente.", href: "/relatorios/financeiro/por-cliente", icon: Users },
  { titulo: "Movimentação de Terceiros", desc: "Movimentação por fornecedor.", href: "/relatorios/financeiro/terceiros", icon: Truck },
];

export default async function RelatoriosPage() {
  await requireUser();

  return (
    <div className="space-y-8">
      <PageHeader titulo="Relatórios" descricao="Análises construídas sobre os dados do sistema." />

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Financeiro
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RELATORIOS_FINANCEIRO.map((r) => {
            const Icon = r.icon;
            return (
              <Link key={r.href} href={r.href} className="group">
                <Card className="h-full transition-colors group-hover:border-brand-yellow">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-sm">{r.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{r.desc}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
                      Abrir <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Outras áreas
        </h2>
        <p className="text-sm text-muted-foreground">
          Relatórios de Projetos, Jobs, Propostas e Mídia seguem o mesmo padrão e entram em seguida.
        </p>
      </section>
    </div>
  );
}
