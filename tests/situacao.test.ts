import { describe, it, expect } from "vitest";
import { situacaoProjeto, formatHoras } from "../src/lib/projetos/situacao";

const HOJE = new Date("2026-06-20T12:00:00");

describe("situacaoProjeto", () => {
  it("concluído tem tom próprio", () => {
    expect(situacaoProjeto({ status: "CONCLUIDO", prazoEstimado: null }, HOJE).tone).toBe("concluido");
  });
  it("cancelado tem tom próprio", () => {
    expect(situacaoProjeto({ status: "CANCELADO", prazoEstimado: "2026-01-01" }, HOJE).tone).toBe("cancelado");
  });
  it("prazo passado = atrasado", () => {
    expect(situacaoProjeto({ status: "EM_ANDAMENTO", prazoEstimado: "2026-06-10" }, HOJE).tone).toBe("atrasado");
  });
  it("prazo em 2 dias = atenção", () => {
    expect(situacaoProjeto({ status: "EM_ANDAMENTO", prazoEstimado: "2026-06-22T12:00:00" }, HOJE).tone).toBe("atencao");
  });
  it("prazo distante = ok", () => {
    expect(situacaoProjeto({ status: "EM_ANDAMENTO", prazoEstimado: "2026-08-01" }, HOJE).tone).toBe("ok");
  });
  it("sem prazo = neutro", () => {
    expect(situacaoProjeto({ status: "EM_ANDAMENTO", prazoEstimado: null }, HOJE).tone).toBe("neutro");
  });
});

describe("formatHoras", () => {
  it("converte minutos em HH:MM", () => {
    expect(formatHoras(0)).toBe("00:00");
    expect(formatHoras(90)).toBe("01:30");
    expect(formatHoras(605)).toBe("10:05");
  });
});
