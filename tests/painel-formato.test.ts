import { describe, it, expect } from "vitest";
import { formatarValor, variacaoDe } from "@/lib/painel/formato";
import type { Formato, Indicador } from "@/lib/painel/queries";

function ind(valor: number | null, anterior: number | null, formato: Formato, melhorQuando: "maior" | "menor" = "maior"): Indicador {
  return { chave: "x", label: "X", valor, anterior, formato, melhorQuando };
}

describe("formatarValor", () => {
  it("percentual", () => expect(formatarValor(85, "pct")).toBe("85%"));
  it("dias (singular/plural)", () => {
    expect(formatarValor(1, "dias")).toBe("1 dia");
    expect(formatarValor(3, "dias")).toBe("3 dias");
  });
  it("moeda", () => expect(formatarValor(1234.5, "moeda")).toContain("1.234,50"));
  it("nulo vira travessão", () => expect(formatarValor(null, "num")).toBe("—"));
});

describe("variacaoDe", () => {
  it("percentual usa pontos percentuais (pp)", () => {
    const v = variacaoDe(ind(90, 80, "pct", "maior"))!;
    expect(v.texto).toBe("+10 pp");
    expect(v.direcao).toBe("up");
    expect(v.positivo).toBe(true);
  });
  it("queda em métrica 'maior é melhor' é negativa", () => {
    const v = variacaoDe(ind(70, 80, "pct", "maior"))!;
    expect(v.direcao).toBe("down");
    expect(v.positivo).toBe(false);
  });
  it("valores absolutos usam variação relativa (%)", () => {
    const v = variacaoDe(ind(120, 100, "moeda", "maior"))!;
    expect(v.texto).toBe("+20%");
    expect(v.direcao).toBe("up");
  });
  it("em métrica 'menor é melhor', cair é positivo", () => {
    const v = variacaoDe(ind(8, 10, "cpl", "menor"))!;
    expect(v.direcao).toBe("down");
    expect(v.positivo).toBe(true);
    expect(v.texto).toBe("-20%");
  });
  it("sem anterior não há variação", () => {
    expect(variacaoDe(ind(10, null, "num"))).toBeNull();
  });
});
