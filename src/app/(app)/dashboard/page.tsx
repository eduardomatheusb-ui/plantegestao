import Link from "next/link";
import { Users, Radio, Package, ListTree, ArrowRight, FolderKanban, ListChecks, Target } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { metricaJobsNoPrazo } from "@/lib/jobs/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

export default async function DashboardPage() {
  const user = await requireUser();

  const [clientes, veiculos, produtos, categorias, projetos, jobs, noPrazo] = await Promise.all([
    db.cliente.count({ where: { arquivado: false } }),
    db.veiculo.count({ where: { arquivado: false } }),
    db.produto.count({ where: { ativo: true } }),
    db.categoria.count({ where: { ativo: true } }),
    db.projeto.count({ where: { arquivado: false } }),
    db.job.count({ where: { arquivado: false } }),
    metricaJobsNoPrazo(),
  ]);

  const primeiroNome = user.name?.split(" ")[0] ?? "";

  const cadastros = [
    { label: "Clientes", valor: clientes, href: "/cadastros/clientes", icon: Users },
    { label: "Veículos", valor: veiculos, href: "/cadastros/veiculos", icon: Radio },
    { label: "Produtos/Serviços", valor: produtos, href: "/cadastros/produtos", icon: Package },
    { label: "Categorias", valor: categorias, href: "/cadastros/categorias", icon: ListTree },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        titulo={`Olá, ${primeiroNome} 👋`}
        descricao="Visão geral da Plante."
      />

      {/* Trabalho */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/projetos" className="group">
          <Card className="transition-colors group-hover:border-brand-yellow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projetos ativos</CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold tabular-nums">{projetos}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/jobs" className="group">
          <Card className="transition-colors group-hover:border-brand-yellow">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jobs ativos</CardTitle>
              <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold tabular-nums">{jobs}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                Ver pauta
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jobs no prazo</CardTitle>
            <Target className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {noPrazo ? (
              <>
                <p className="font-display text-3xl font-bold tabular-nums">{noPrazo.pct}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {noPrazo.noPrazo} de {noPrazo.total} jobs concluídos no prazo
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem jobs concluídos ainda.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Cadastros */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cadastros
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cadastros.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.href} href={c.href} className="group">
                <Card className="transition-colors group-hover:border-brand-yellow">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                    <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <p className="font-display text-3xl font-bold tabular-nums">{c.valor}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      Ver cadastro
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
