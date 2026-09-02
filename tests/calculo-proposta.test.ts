import { describe, it, expect } from "vitest";
import { calcularSubtotal, calcularTotais, round2 } from "../src/lib/propostas/calculo";

describe("calcularSubtotal", () => {
  it("multiplica valor por quantidade", () => {
    expect(calcularSubtotal(100, 3, 0)).toBe(300);
  });
  it("aplica desconto em R$", () => {
    expect(calcularSubtotal(100, 3, 50)).toBe(250);
  });
  it("quantidade fracionária", () => {
    expect(calcularSubtotal(80, 1.5, 0)).toBe(120);
  });
  it("arredonda a 2 casas", () => {
    expect(calcularSubtotal(33.33, 3, 0)).toBe(99.99);
  });
  it("não fica negativo se desconto > bruto", () => {
    expect(calcularSubtotal(100, 1, 150)).toBe(0);
  });
});

describe("calcularTotais", () => {
  const itens = [
    { valorUnit: 8500, quantidade: 1, desconto: 0, visivel: true, recorrencia: "UNICA" },
    { valorUnit: 3200, quantidade: 2, desconto: 400, visivel: true, recorrencia: "UNICA" },
    { valorUnit: 6000, quantidade: 1, desconto: 0, visivel: false, recorrencia: "UNICA" }, // oculto
    { valorUnit: 2500, quantidade: 1, desconto: 0, visivel: true, recorrencia: "MENSAL" },
  ];
  it("separa único e mensal, somando só os itens visíveis", () => {
    // único: 8500 + (6400-400) = 14500 · mensal: 2500 · o oculto não entra
    expect(calcularTotais(itens)).toEqual({ unico: 14500, mensal: 2500 });
  });
  it("sem recorrência definida, conta como único", () => {
    expect(calcularTotais([{ valorUnit: 100, quantidade: 1, desconto: 0, visivel: true }])).toEqual({ unico: 100, mensal: 0 });
  });
  it("lista vazia = zero nos dois", () => {
    expect(calcularTotais([])).toEqual({ unico: 0, mensal: 0 });
  });
});

describe("round2", () => {
  it("arredonda meio centavo", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });
});
