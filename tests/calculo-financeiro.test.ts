import { describe, it, expect } from "vitest";
import { valorEfetivo, resumoMes } from "../src/lib/financeiro/calculo";

describe("valorEfetivo", () => {
  it("soma acréscimos e subtrai descontos", () => {
    expect(valorEfetivo(1000, 50, 30)).toBe(1020);
  });
  it("sem acréscimos/descontos", () => {
    expect(valorEfetivo(1000)).toBe(1000);
  });
});

describe("resumoMes", () => {
  const lancs = [
    { tipo: "RECEITA" as const, status: "QUITADO" as const, valor: 8500 },
    { tipo: "RECEITA" as const, status: "EM_ABERTO" as const, valor: 3200 },
    { tipo: "DESPESA" as const, status: "QUITADO" as const, valor: 1200 },
    { tipo: "DESPESA" as const, status: "EM_ABERTO" as const, valor: 800, descontos: 100 },
    { tipo: "TRANSFERENCIA" as const, status: "QUITADO" as const, valor: 5000 }, // neutra
  ];
  const r = resumoMes(lancs);

  it("receitas previstas somam todas as receitas", () => {
    expect(r.receitas).toBe(11700);
  });
  it("despesas previstas aplicam desconto", () => {
    expect(r.despesas).toBe(1900); // 1200 + (800-100)
  });
  it("saldo previsto", () => {
    expect(r.saldo).toBe(9800);
  });
  it("realizado conta apenas quitados", () => {
    expect(r.receitasRealizadas).toBe(8500);
    expect(r.despesasRealizadas).toBe(1200);
    expect(r.saldoRealizado).toBe(7300);
  });
  it("transferência não afeta receitas/despesas", () => {
    const so = resumoMes([{ tipo: "TRANSFERENCIA", status: "QUITADO", valor: 999 }]);
    expect(so.receitas).toBe(0);
    expect(so.despesas).toBe(0);
  });
});
