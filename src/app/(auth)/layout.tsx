import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca (chrome escuro) */}
      <section className="relative hidden flex-col justify-between bg-chrome p-10 text-chrome-foreground lg:flex">
        <Logo sub="Gestão" />
        <div className="space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/Logo%20Trem%20Amarelo.svg"
            alt="TREM"
            className="h-auto w-72"
          />
          <p className="font-display text-xl font-semibold leading-snug">
            <span className="font-bold text-white">T</span>arefas,{" "}
            <span className="font-bold text-white">R</span>otinas,{" "}
            <span className="font-bold text-white">E</span>ntregas e{" "}
            <span className="font-bold text-white">M</span>etas da Plante.
          </p>
          <p className="max-w-md text-base leading-relaxed text-chrome-foreground/70">
            O trem de fazer os trem tudo, organizando os trem daqui da agência.
            Desenvolvido para você poder ter suas tarefas mais organizadas, do jeito
            mineiro que só a Plante sabe fazer.
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
            <Logo tom="claro" sub="Gestão" />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
