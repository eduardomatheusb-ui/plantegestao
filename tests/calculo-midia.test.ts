import { describe, it, expect } from "vitest";
import { totalInsercoes, calcularTotaisMidia } from "../src/lib/midia/calculo";

describe("totalInsercoes", () => {
  it("soma quantidades dos dias", () => {
    expect(totalInsercoes([2, 0, 3, 1])).toBe(6);
  });
  it("lista vazia", () => {
    expect(totalInsercoes([])).toBe(0);
  });
});

describe("calcularTotaisMidia", () => {
  const linhas = [
    { totalInsercoes: 20, valorInsercao: 150 }, // 3000
    { totalInsercoes: 10, valorInsercao: 250 }, // 2500
  ];
  const t = calcularTotaisMidia(linhas, 20, 500);

  it("total da mídia = Σ inserções × valor", () => {
    expect(t.totalMidia).toBe(5500);
  });
  it("comissão = total × %", () => {
    expect(t.comissao).toBe(1100); // 20% de 5500
  });
  it("valor total = total + honorários", () => {
    expect(t.valorTotal).toBe(6000); // 5500 + 500
  });
  it("sem linhas, totais zerados", () => {
    const z = calcularTotaisMidia([], 20, 0);
    expect(z.totalMidia).toBe(0);
    expect(z.valorTotal).toBe(0);
  });
});
