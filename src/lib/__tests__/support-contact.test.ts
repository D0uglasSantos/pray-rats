import { describe, expect, it } from "vitest";
import { buildSupportMailto, normalizeSupportEmail } from "@/lib/support-contact";

describe("support contact", () => {
  it("normaliza somente endereços de e-mail válidos", () => {
    expect(normalizeSupportEmail(" Suporte@PrayRats.app ")).toBe("suporte@prayrats.app");
    expect(normalizeSupportEmail("endereco-invalido")).toBeNull();
    expect(normalizeSupportEmail(undefined)).toBeNull();
  });

  it("monta o link de contato com assunto codificado", () => {
    expect(buildSupportMailto("suporte@prayrats.app", "Ajuda com minha conta")).toBe(
      "mailto:suporte@prayrats.app?subject=Ajuda%20com%20minha%20conta",
    );
  });
});
