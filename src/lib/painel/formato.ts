import { formatBRL } from "@/lib/utils";
import type { Formato, Indicador } from "./queries";

/** Formata o valor de um indicador conforme a unidade. */
export function formatarValor(valor: number | null, formato: Formato): string {
  if (valor == null) return "—";
  switch (formato) {
    case "moeda":
    case "cpl":
      return formatBRL(valor);
    case "pct":
      return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)}%`;
    case "dias":
      return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor)} ${valor === 1 ? "dia" : "dias"}`;
    case "num":
    default:
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(valor);
  }
}

export type VariacaoInfo = {
  texto: string;
  direcao: "up" | "down" | "flat";
  positivo: boolean; // true = mudança na direção desejada
};

/** Variação de um indicador contra o período anterior. */
export function variacaoDe(i: Indicador): VariacaoInfo | null {
  if (i.valor == null || i.anterior == null) return null;
  const delta = i.valor - i.anterior;
  const direcao: VariacaoInfo["direcao"] = delta > 0.0001 ? "up" : delta < -0.0001 ? "down" : "flat";

  let texto: string;
  if (i.formato === "pct") {
    const pp = Math.round(delta * 10) / 10;
    texto = `${pp > 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(pp)} pp`;
  } else if (i.anterior === 0) {
    texto = "novo";
  } else {
    const rel = (delta / Math.abs(i.anterior)) * 100;
    const r = Math.round(rel);
    texto = `${r > 0 ? "+" : ""}${new Intl.NumberFormat("pt-BR").format(r)}%`;
  }

  const positivo = direcao === "flat" ? true : i.melhorQuando === "maior" ? delta > 0 : delta < 0;
  return { texto, direcao, positivo };
}

/** Texto simples da variação para CSV (sem cor/ícone). */
export function variacaoTexto(i: Indicador): string {
  const v = variacaoDe(i);
  return v ? v.texto : "";
}
