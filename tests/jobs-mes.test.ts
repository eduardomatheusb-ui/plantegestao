import { describe, it, expect } from "vitest";
import { intervaloMes } from "../src/lib/jobs/mes";

describe("intervaloMes", () => {
  it("cobre o mês inteiro em UTC", () => {
    expect(intervaloMes("2026-10")).toEqual({
      gte: new Date("2026-10-01T00:00:00Z"),
      lt: new Date("2026-11-01T00:00:00Z"),
    });
  });
  it("dezembro vira o ano", () => {
    expect(intervaloMes("2026-12")?.lt).toEqual(new Date("2027-01-01T00:00:00Z"));
  });
  it("rejeita valor inválido", () => {
    expect(intervaloMes("2026-13")).toBeNull();
    expect(intervaloMes("outubro")).toBeNull();
  });
});
