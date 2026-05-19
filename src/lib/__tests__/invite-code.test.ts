import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  normalizeInviteCode,
  isValidInviteCodeFormat,
} from "@/lib/invite-code";

describe("generateInviteCode", () => {
  it("gera código com 8 caracteres", () => {
    const code = generateInviteCode(8, () => 0);
    expect(code).toHaveLength(8);
  });

  it("usa apenas caracteres permitidos", () => {
    const code = generateInviteCode(8, () => 0.1);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("é determinístico com random fixo", () => {
    const random = () => 0.5;
    expect(generateInviteCode(8, random)).toBe(generateInviteCode(8, random));
  });
});

describe("normalizeInviteCode", () => {
  it("remove espaços e converte para maiúsculas", () => {
    expect(normalizeInviteCode("  abcd1234  ")).toBe("ABCD1234");
  });
});

describe("isValidInviteCodeFormat", () => {
  it("aceita códigos válidos", () => {
    expect(isValidInviteCodeFormat("ABCD1234")).toBe(true);
    expect(isValidInviteCodeFormat("abcd")).toBe(true);
  });

  it("rejeita códigos inválidos", () => {
    expect(isValidInviteCodeFormat("")).toBe(false);
    expect(isValidInviteCodeFormat("ab")).toBe(false);
    expect(isValidInviteCodeFormat("ABCD-1234")).toBe(false);
  });
});
