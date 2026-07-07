import { describe, it, expect } from "vitest";
import { filtrarNav } from "@/components/layout/nav";
import { completarCaps } from "@/lib/permissoes";
import type { Capacidades } from "@/lib/permissoes";

function temPainel(caps: Capacidades): boolean {
  return filtrarNav(caps).some((g) => g.itens.some((i) => i.href === "/painel-estrategico"));
}

describe("Painel Estratégico — visibilidade no menu (só Administrador)", () => {
  it("escondido para quem não é administrador, mesmo com acesso total a outros módulos", () => {
    expect(temPainel(completarCaps({ relatorios: "ADMIN", financeiro: "ADMIN", midia: "ADMIN" }))).toBe(false);
  });
  it("escondido para admin parcial (VER/EDITAR não bastam)", () => {
    expect(temPainel(completarCaps({ admin: "VER" }))).toBe(false);
    expect(temPainel(completarCaps({ admin: "EDITAR" }))).toBe(false);
  });
  it("visível para administrador (admin = ADMIN)", () => {
    expect(temPainel(completarCaps({ admin: "ADMIN" }))).toBe(true);
  });
});
