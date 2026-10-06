import { describe, expect, it } from "vitest";
import { contentDisposition } from "@/lib/anexos/disposicao";

describe("contentDisposition", () => {
  it("mantém o nome com acento no filename* e gera versão ASCII no filename", () => {
    const h = contentDisposition("Aprovação Outdoor Outubro Rosa.jpg", "attachment");
    expect(h).toBe(
      `attachment; filename="Aprovacao Outdoor Outubro Rosa.jpg"; filename*=UTF-8''Aprova%C3%A7%C3%A3o%20Outdoor%20Outubro%20Rosa.jpg`,
    );
    expect(/^[\x20-\x7E]*$/.test(h)).toBe(true);
  });
  it("remove aspas e quebras de linha e usa nome padrão quando vazio", () => {
    expect(contentDisposition('a"b\r\nc.png', "inline")).toContain('filename="abc.png"');
    expect(contentDisposition(null, "inline")).toContain('filename="arquivo"');
  });
});
