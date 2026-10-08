import { describe, expect, it } from "vitest";
import { PUBLIC_DOCUMENT_ALIASES, PUBLIC_SITE_REDIRECTS } from "@/lib/public-paths";

describe("public paths", () => {
  it("expõe aliases em português e inglês para o site público", () => {
    expect(PUBLIC_DOCUMENT_ALIASES).toEqual(
      expect.arrayContaining([
        "/privacy",
        "/privacidade",
        "/terms",
        "/termos",
        "/support",
        "/suporte",
        "/pt",
      ]),
    );
  });

  it("redireciona caminhos comuns de loja e /pt para as páginas oficiais", () => {
    expect(PUBLIC_SITE_REDIRECTS).toEqual(
      expect.arrayContaining([
        { source: "/politica-de-privacidade", destination: "/privacy" },
        { source: "/termos-de-uso", destination: "/terms" },
        { source: "/pt/privacy", destination: "/privacy" },
        { source: "/pt/suporte", destination: "/support" },
      ]),
    );
  });
});
