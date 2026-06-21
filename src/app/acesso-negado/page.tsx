import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcessoNegadoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <ShieldX className="size-12 text-destructive" aria-hidden="true" />
      <h1 className="font-display text-2xl font-bold">Acesso negado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Você não tem permissão para acessar esta página. Se acredita que isto é um
        engano, fale com um gestor ou com o sócio-diretor.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </main>
  );
}
