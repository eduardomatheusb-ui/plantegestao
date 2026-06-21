import { describe, it, expect } from "vitest";
import { iniciais } from "../src/lib/format";
import { formatBRL } from "../src/lib/utils";

describe("iniciais", () => {
  it("usa primeira e última palavra", () => {
    expect(iniciais("Eduardo Brito")).toBe("EB");
  });
  it("uma palavra só", () => {
    expect(iniciais("Plante")).toBe("P");
  });
  it("vazio/nulo", () => {
    expect(iniciais("")).toBe("?");
    expect(iniciais(null)).toBe("?");
  });
});

describe("formatBRL", () => {
  it("formata como moeda brasileira", () => {
    // espaço não-quebrável entre símbolo e número
    expect(formatBRL(8500)).toBe("R$ 8.500,00");
    expect(formatBRL("3200.5")).toBe("R$ 3.200,50");
  });
  it("valor inválido vira zero", () => {
    expect(formatBRL("abc")).toBe("R$ 0,00");
  });
});
