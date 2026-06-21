import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca (chrome escuro) */}
      <section className="relative hidden flex-col justify-between bg-chrome p-10 text-chrome-foreground lg:flex">
        <Logo />
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Gestão da agência,
            <br />
            <span className="text-brand-yellow">do briefing ao faturamento.</span>
          </h1>
          <p className="max-w-md text-sm text-chrome-foreground/70">
            Projetos, jobs, propostas, mídia e financeiro da Plante Comunicação — em um
            só lugar.
          </p>
        </div>
        <p className="text-xs text-chrome-foreground/50">
          Sistema interno · Plante Comunicação
        </p>
      </section>

      {/* Área do formulário (conteúdo claro) */}
      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo tom="claro" />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
