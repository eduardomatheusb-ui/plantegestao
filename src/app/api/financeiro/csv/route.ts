import { auth } from "@/lib/auth";
import { requireModulo } from "@/lib/permissoes.server";
import { listarLancamentosMes } from "@/lib/financeiro/queries";
import { valorEfetivo } from "@/lib/financeiro/calculo";

export const dynamic = "force-dynamic";

function csvCampo(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function dia(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "";
}

/** Exporta os lançamentos de um mês em CSV (para Excel/BI). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });
  try {
    await requireModulo("financeiro", "VER");
  } catch {
    return new Response("Sem permissão", { status: 403 });
  }

  const url = new URL(req.url);
  const agora = new Date();
  const ano = Number(url.searchParams.get("ano")) || agora.getFullYear();
  const mes = Number(url.searchParams.get("mes")) || agora.getMonth() + 1;

  const lancamentos = await listarLancamentosMes(ano, mes);
  const sep = ";"; // ponto e vírgula = Excel pt-BR abre certo
  const cabecalho = ["Numero", "Tipo", "Titulo", "Categoria", "Cliente/Fornecedor", "Vencimento", "Competencia", "Pagamento", "Valor", "Status"];
  const linhas = [cabecalho.join(sep)];

  for (const l of lancamentos) {
    const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
    const sacado = l.tipo === "TRANSFERENCIA"
      ? `${l.conta?.nome ?? ""} > ${l.contaDestino?.nome ?? ""}`
      : l.cliente?.nome ?? l.fornecedor?.nome ?? "";
    linhas.push([
      l.numero, l.tipo, l.titulo, l.categoria?.nome ?? "", sacado,
      dia(l.dataVencimento), dia(l.dataCompetencia), dia(l.dataPagamento),
      v.toFixed(2).replace(".", ","), l.status,
    ].map(csvCampo).join(sep));
  }

  const conteudo = "﻿" + linhas.join("\r\n"); // BOM p/ acentos no Excel
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lancamentos-${ano}-${String(mes).padStart(2, "0")}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
