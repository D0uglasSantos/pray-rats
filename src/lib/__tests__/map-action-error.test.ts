import { describe, it, expect } from "vitest";
import { mapActionError } from "@/lib/errors/map-action-error";

describe("mapActionError", () => {
  it("maps jwt errors to session message", () => {
    expect(mapActionError(new Error("JWT expired"))).toBe(
      "Sua sessão expirou. Faça login novamente.",
    );
  });

  it("maps storage errors to upload message", () => {
    expect(mapActionError(new Error("Storage upload failed"), { context: "upload" })).toBe(
      "Não foi possível enviar a foto. Verifique sua conexão e tente de novo.",
    );
  });

  it("uses context fallback for opaque errors", () => {
    expect(
      mapActionError(new Error("PGRST116: some sql error"), { context: "checkin" }),
    ).toBe("Não foi possível registrar o check-in. Tente novamente.");
  });

  it("returns short user-facing messages as-is", () => {
    expect(mapActionError("Informe um título.")).toBe("Informe um título.");
  });
});
