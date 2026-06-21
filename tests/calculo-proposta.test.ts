import { describe, it, expect } from "vitest";
import { calcularSubtotal, calcularTotal, round2 } from "../src/lib/propostas/calculo";

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

describe("calcularTotal", () => {
  const itens = [
    { valorUnit: 8500, quantidade: 1, desconto: 0, visivel: true },
    { valorUnit: 3200, quantidade: 2, desconto: 400, visivel: true },
    { valorUnit: 6000, quantidade: 1, desconto: 0, visivel: false }, // oculto
  ];
  it("soma apenas itens visíveis", () => {
    // 8500 + (6400-400) = 8500 + 6000 = 14500
    expect(calcularTotal(itens)).toBe(14500);
  });
  it("lista vazia = 0", () => {
    expect(calcularTotal([])).toBe(0);
  });
});

describe("round2", () => {
  it("arredonda meio centavo", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });
});
