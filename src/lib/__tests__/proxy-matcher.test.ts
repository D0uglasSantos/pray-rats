import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "@/proxy";

describe("proxy matcher", () => {
  it("não intercepta arquivos de associação em .well-known", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/.well-known/assetlinks.json",
      }),
    ).toBe(false);
  });

  it("continua interceptando rotas protegidas", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/home",
      }),
    ).toBe(true);
  });
});
