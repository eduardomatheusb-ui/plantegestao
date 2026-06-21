import { describe, it, expect } from "vitest";
import { agruparDRE, fluxoMensal, type LancRel } from "../src/lib/relatorios/calculo";

const lancs: LancRel[] = [
  { tipo: "RECEITA", status: "QUITADO", categoriaNome: "Honorários", valor: 8500, mes: 6 },
  { tipo: "RECEITA", status: "EM_ABERTO", categoriaNome: "Honorários", valor: 1500, mes: 6 },
  { tipo: "RECEITA", status: "QUITADO", categoriaNome: "Veiculação", valor: 2000, mes: 7 },
  { tipo: "DESPESA", status: "EM_ABERTO", categoriaNome: "Produção", valor: 2500, mes: 6 },
  { tipo: "DESPESA", status: "QUITADO", categoriaNome: null, valor: 500, mes: 7 },
  { tipo: "TRANSFERENCIA", status: "QUITADO", categoriaNome: null, valor: 9999, mes: 6 },
];

describe("agruparDRE", () => {
  const dre = agruparDRE(lancs);
  it("agrupa receitas por categoria", () => {
    expect(dre.receitas.find((r) => r.nome === "Honorários")?.valor).toBe(10000);
    expect(dre.totalReceitas).toBe(12000);
  });
  it("despesas incluem 'Sem categoria'", () => {
    expect(dre.despesas.find((d) => d.nome === "Sem categoria")?.valor).toBe(500);
    expect(dre.totalDespesas).toBe(3000);
  });
  it("resultado = receitas − despesas", () => {
    expect(dre.resultado).toBe(9000);
  });
  it("transferência é ignorada", () => {
    expect(dre.totalReceitas + dre.totalDespesas).toBe(15000); // sem os 9999
  });
});

describe("fluxoMensal", () => {
  const fluxo = fluxoMensal(lancs);
  it("junho: 10000 receitas, 2500 despesas", () => {
    const jun = fluxo[5];
    expect(jun.receitas).toBe(10000);
    expect(jun.despesas).toBe(2500);
    expect(jun.resultado).toBe(7500);
  });
  it("saldo acumulado soma os resultados", () => {
    // jun 7500 ; jul (2000-500=1500) => acumulado jul = 9000
    expect(fluxo[6].saldoAcumulado).toBe(9000);
    expect(fluxo[11].saldoAcumulado).toBe(9000);
  });
});
