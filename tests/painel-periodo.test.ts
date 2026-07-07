import { describe, it, expect } from "vitest";
import { resolverPeriodo } from "@/lib/painel/periodo";

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe("resolverPeriodo — mês", () => {
  const p = resolverPeriodo({ periodo: "mes", ano: "2026", mes: "7" });
  it("janela do mês (fim exclusivo)", () => {
    expect(ymd(p.inicio)).toEqual([2026, 7, 1]);
    expect(ymd(p.fim)).toEqual([2026, 8, 1]);
  });
  it("anterior = mês anterior", () => {
    expect(ymd(p.anterior.inicio)).toEqual([2026, 6, 1]);
    expect(ymd(p.anterior.fim)).toEqual([2026, 7, 1]);
  });
  it("label", () => expect(p.label).toBe("julho de 2026"));
});

describe("resolverPeriodo — trimestre", () => {
  const p = resolverPeriodo({ periodo: "trimestre", ano: "2026", tri: "3" });
  it("3º trimestre = jul→set", () => {
    expect(ymd(p.inicio)).toEqual([2026, 7, 1]);
    expect(ymd(p.fim)).toEqual([2026, 10, 1]);
  });
  it("anterior = 2º trimestre", () => {
    expect(ymd(p.anterior.inicio)).toEqual([2026, 4, 1]);
    expect(ymd(p.anterior.fim)).toEqual([2026, 7, 1]);
  });
  it("label", () => expect(p.label).toBe("3º trimestre de 2026"));
});

describe("resolverPeriodo — ano", () => {
  const p = resolverPeriodo({ periodo: "ano", ano: "2026" });
  it("janela do ano", () => {
    expect(ymd(p.inicio)).toEqual([2026, 1, 1]);
    expect(ymd(p.fim)).toEqual([2027, 1, 1]);
  });
  it("anterior = ano anterior", () => {
    expect(ymd(p.anterior.inicio)).toEqual([2025, 1, 1]);
    expect(ymd(p.anterior.fim)).toEqual([2026, 1, 1]);
  });
});

describe("resolverPeriodo — intervalo", () => {
  const p = resolverPeriodo({ periodo: "intervalo", de: "2026-07-01", ate: "2026-07-10" });
  it("fim é exclusivo (dia seguinte ao 'até')", () => {
    expect(ymd(p.inicio)).toEqual([2026, 7, 1]);
    expect(ymd(p.fim)).toEqual([2026, 7, 11]);
  });
  it("anterior = mesma duração imediatamente antes", () => {
    // duração = 10 dias → anterior [21/06, 01/07)
    expect(ymd(p.anterior.inicio)).toEqual([2026, 6, 21]);
    expect(ymd(p.anterior.fim)).toEqual([2026, 7, 1]);
  });
});

describe("resolverPeriodo — padrão", () => {
  it("sem período válido cai no mês atual", () => {
    const p = resolverPeriodo({ periodo: "xpto" });
    expect(p.tipo).toBe("mes");
  });
});
