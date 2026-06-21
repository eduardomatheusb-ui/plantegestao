import { NextResponse } from "next/server";

// Diagnóstico TEMPORÁRIO: confirma a região das funções e QUAL banco a produção
// está usando (host, sem senha) — para validar a migração de região. Remover depois.
export const dynamic = "force-dynamic";

function hostDoBanco(): string {
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    return u.hostname; // só o host, sem usuário/senha
  } catch {
    return "(indefinido)";
  }
}

export async function GET() {
  return NextResponse.json({
    awsRegion: process.env.AWS_REGION ?? null,
    bancoHost: hostDoBanco(),
    dica: "us-east-2 no host = banco novo (Ohio) ativo",
  });
}
