import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// Bundle do manual (Bíblia Operacional) — fora de public/, servido só a quem está logado.
const BASE = path.join(process.cwd(), "content", "biblia");

const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".json": "application/json; charset=utf-8",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  // Gate: só usuário autenticado no TREM. Documento é "uso interno e confidencial".
  const user = await getSessionUser();
  if (!user) return new Response("Não autorizado", { status: 403 });

  const { path: segs } = await params;
  const alvo = path.normalize(path.join(BASE, ...segs));

  // Barra path traversal para fora da pasta do manual.
  if (alvo !== BASE && !alvo.startsWith(BASE + path.sep)) {
    return new Response("Não encontrado", { status: 404 });
  }

  try {
    const data = await readFile(alvo);
    const ext = path.extname(alvo).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TIPOS[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
