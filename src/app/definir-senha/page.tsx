import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { DefinirSenhaForm } from "@/components/admin/definir-senha-form";

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo tom="claro" />
        </div>
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">Defina sua senha</h1>
          <p className="text-sm text-muted-foreground">Crie uma senha para acessar a Plante Gestão.</p>
        </div>

        {token ? (
          <DefinirSenhaForm token={token} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-destructive">Link inválido — falta o código do convite.</p>
            <Link href="/login" className="text-sm font-medium text-foreground underline">
              Ir para o login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
