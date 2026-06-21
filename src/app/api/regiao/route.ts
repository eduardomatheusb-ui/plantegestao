import { NextResponse } from "next/server";

// Diagnóstico TEMPORÁRIO: descobre em que região as funções do Netlify rodam,
// para decidir a co-localização com o banco Neon. Remover depois de usar.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    awsRegion: process.env.AWS_REGION ?? null,
    netlifyRegion: process.env.NETLIFY_REGION ?? null,
    bancoEsperado: "sa-east-1 (São Paulo)",
    node: process.version,
  });
}
