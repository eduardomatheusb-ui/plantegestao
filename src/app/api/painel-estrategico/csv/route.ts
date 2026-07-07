import { auth } from "@/lib/auth";
import { requireModulo } from "@/lib/permissoes.server";
import { resolverPeriodo } from "@/lib/painel/periodo";
import { carregarPainel } from "@/lib/painel/queries";
import { formatarValor, variacaoTexto } from "@/lib/painel/formato";

export const dynamic = "force-dynamic";

function csvCampo(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exporta os indicadores do Painel Estratégico do período em CSV (uma linha por indicador). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });
  try {
    await requireModulo("admin", "ADMIN");
  } catch {
    return new Response("Sem permissão", { status: 403 });
  }

  const url = new URL(req.url);
  const periodo = resolverPeriodo({
    periodo: url.searchParams.get("periodo") ?? undefined,
    ano: url.searchParams.get("ano") ?? undefined,
    mes: url.searchParams.get("mes") ?? undefined,
    tri: url.searchParams.get("tri") ?? undefined,
    de: url.searchParams.get("de") ?? undefined,
    ate: url.searchParams.get("ate") ?? undefined,
  });

  const blocosParam = (url.searchParams.get("blocos") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const { blocos } = await carregarPainel(periodo);
  const escolhidos = blocosParam.length ? blocos.filter((b) => blocosParam.includes(b.chave)) : blocos;

  const sep = ";";
  const linhas = [["Area", "Indicador", "Valor", "Variacao"].join(sep)];
  for (const b of escolhidos) {
    for (const i of b.indicadores) {
      linhas.push([b.titulo, i.label, formatarValor(i.valor, i.formato), variacaoTexto(i)].map(csvCampo).join(sep));
    }
  }

  const nome = `painel-${periodo.params.periodo}-${periodo.params.ano ?? "intervalo"}.csv`;
  const conteudo = "﻿" + linhas.join("\r\n"); // BOM p/ acentos no Excel
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
