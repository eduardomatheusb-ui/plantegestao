import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <p className="font-display text-5xl font-bold text-brand-yellow">404</p>
      <h1 className="font-display text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </main>
  );
}
