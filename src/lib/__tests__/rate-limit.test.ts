import { describe, expect, it } from "vitest";
import { buildRateLimitKey } from "@/lib/rate-limit";

describe("auth rate-limit privacy", () => {
  it("normaliza o identificador e não inclui o e-mail na chave persistida", () => {
    const first = buildRateLimitKey("signIn", " Pessoa@Example.com ", "test-secret");
    const second = buildRateLimitKey("signIn", "pessoa@example.com", "test-secret");

    expect(first).toBe(second);
    expect(first).toMatch(/^signIn:[a-f0-9]{64}$/);
    expect(first).not.toContain("pessoa@example.com");
  });

  it("separa a chave por finalidade", () => {
    expect(buildRateLimitKey("signIn", "pessoa@example.com", "test-secret")).not.toBe(
      buildRateLimitKey("signUp", "pessoa@example.com", "test-secret"),
    );
  });
});
