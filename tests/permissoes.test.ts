import { describe, it, expect } from "vitest";
import {
  completarCaps,
  nivelAtende,
  podeModulo,
  derivarPapel,
  capacidadesDoPapel,
  temAlgumAcesso,
  PERFIS_PADRAO,
  MODULOS,
} from "@/lib/permissoes";

describe("completarCaps", () => {
  it("preenche módulos ausentes com NENHUM", () => {
    const caps = completarCaps({ projetos: "EDITAR" });
    expect(caps.projetos).toBe("EDITAR");
    expect(caps.financeiro).toBe("NENHUM");
    expect(Object.keys(caps).sort()).toEqual(MODULOS.map((m) => m.key).sort());
  });
});

describe("nivelAtende / podeModulo", () => {
  it("respeita a ordem NENHUM < VER < EDITAR < ADMIN", () => {
    expect(nivelAtende("ADMIN", "EDITAR")).toBe(true);
    expect(nivelAtende("EDITAR", "EDITAR")).toBe(true);
    expect(nivelAtende("VER", "EDITAR")).toBe(false);
    expect(nivelAtende("NENHUM", "VER")).toBe(false);
  });
  it("podeModulo lê do mapa de capacidades", () => {
    const caps = completarCaps({ financeiro: "VER", projetos: "ADMIN" });
    expect(podeModulo(caps, "projetos", "EDITAR")).toBe(true);
    expect(podeModulo(caps, "financeiro", "EDITAR")).toBe(false);
    expect(podeModulo(caps, "financeiro", "VER")).toBe(true);
    expect(podeModulo(caps, "jobs", "VER")).toBe(false);
  });
});

describe("derivarPapel", () => {
  it("Administrador (admin=ADMIN) → Sócio-diretor", () => {
    expect(derivarPapel(completarCaps({ admin: "ADMIN" }))).toBe("SOCIO_DIRETOR");
  });
  it("responsável da conta → Sócio-diretor mesmo sem admin", () => {
    expect(derivarPapel(completarCaps({ projetos: "VER" }), true)).toBe("SOCIO_DIRETOR");
  });
  it("ADMIN em módulo operacional → Sócio-diretor", () => {
    expect(derivarPapel(completarCaps({ midia: "ADMIN" }))).toBe("SOCIO_DIRETOR");
  });
  it("EDITAR em algum módulo → Gestor", () => {
    expect(derivarPapel(completarCaps({ projetos: "EDITAR" }))).toBe("GESTOR");
  });
  it("só VER/NENHUM → Operador", () => {
    expect(derivarPapel(completarCaps({ projetos: "VER", jobs: "VER" }))).toBe("OPERADOR");
  });
});

describe("capacidadesDoPapel (fallback legado)", () => {
  it("Sócio = ADMIN em tudo (inclusive Administração)", () => {
    const caps = capacidadesDoPapel("SOCIO_DIRETOR");
    expect(caps.financeiro).toBe("ADMIN");
    expect(caps.admin).toBe("ADMIN");
  });
  it("Gestor = EDITAR e sem Administração", () => {
    const caps = capacidadesDoPapel("GESTOR");
    expect(caps.projetos).toBe("EDITAR");
    expect(caps.admin).toBe("NENHUM");
  });
  it("Operador = VER e sem Administração", () => {
    const caps = capacidadesDoPapel("OPERADOR");
    expect(caps.projetos).toBe("VER");
    expect(caps.admin).toBe("NENHUM");
  });
});

describe("perfis-base", () => {
  it("'Sem acesso' não dá acesso a nada", () => {
    const semAcesso = PERFIS_PADRAO.find((p) => p.nome === "Sem acesso")!;
    expect(temAlgumAcesso(completarCaps(semAcesso.caps))).toBe(false);
  });
  it("'Atendimento' não acessa o financeiro mas edita projetos", () => {
    const atend = completarCaps(PERFIS_PADRAO.find((p) => p.nome === "Atendimento")!.caps);
    expect(podeModulo(atend, "financeiro", "VER")).toBe(false);
    expect(podeModulo(atend, "projetos", "EDITAR")).toBe(true);
  });
  it("os 7 perfis-base existem", () => {
    expect(PERFIS_PADRAO.map((p) => p.nome)).toEqual([
      "Administrador", "Total", "Atendimento", "Criativo", "Tráfego", "Mídia", "Sem acesso",
    ]);
  });
});
