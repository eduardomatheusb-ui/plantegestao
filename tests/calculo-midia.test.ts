import { describe, it, expect } from "vitest";
import { totalInsercoes, subtotalLinha, calcularTotaisMidia } from "../src/lib/midia/calculo";

describe("totalInsercoes", () => {
  it("soma quantidades dos dias", () => {
    expect(totalInsercoes([2, 0, 3, 1])).toBe(6);
  });
  it("lista vazia", () => {
    expect(totalInsercoes([])).toBe(0);
  });
});

describe("subtotalLinha", () => {
  it("inserções × valor − desconto", () => {
    expect(subtotalLinha(8, 2150, 0)).toBe(17200);
    expect(subtotalLinha(2, 1000, 150)).toBe(1850);
  });
  it("não fica negativo", () => {
    expect(subtotalLinha(1, 100, 500)).toBe(0);
  });
});

describe("calcularTotaisMidia", () => {
  // Espelha o MEX_503.2: 8 inserções × 2.150,00 = 17.200,00, comissão 20%.
  const linhas = [{ totalInsercoes: 8, valorInsercao: 2150, desconto: 0 }];
  const t = calcularTotaisMidia(linhas, 20, 0);

  it("total da mídia", () => {
    expect(t.totalMidia).toBe(17200);
  });
  it("comissão = 20%", () => {
    expect(t.comissao).toBe(3440);
  });
  it("valor líquido = total − comissão", () => {
    expect(t.valorLiquido).toBe(13760);
  });
  it("valor total = total + honorários", () => {
    expect(calcularTotaisMidia(linhas, 20, 500).valorTotal).toBe(17700);
  });
  it("sem linhas, zerado", () => {
    const z = calcularTotaisMidia([], 20, 0);
    expect(z.totalMidia).toBe(0);
    expect(z.valorLiquido).toBe(0);
  });
});
