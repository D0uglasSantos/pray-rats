import { describe, it, expect } from "vitest";
import { DEFAULT_ACTIVITIES } from "@/lib/constants/activities";
import {
  validateSignUpInput,
  validateSignInInput,
  validateGroupName,
  validateCheckinTitle,
} from "@/lib/validation";

describe("DEFAULT_ACTIVITIES", () => {
  it("contém 9 atividades padrão", () => {
    expect(DEFAULT_ACTIVITIES).toHaveLength(9);
  });

  it("cada atividade tem pontos >= 0", () => {
    for (const a of DEFAULT_ACTIVITIES) {
      expect(a.points).toBeGreaterThanOrEqual(0);
    }
  });

  it("jejum/penitência é privada por padrão", () => {
    const jejum = DEFAULT_ACTIVITIES.find((a) => a.name.includes("Jejum"));
    expect(jejum?.is_private_default).toBe(true);
  });

  it("pregação tem limite semanal de 2", () => {
    const formacao = DEFAULT_ACTIVITIES.find((a) =>
      a.name.includes("Pregação"),
    );
    expect(formacao?.weekly_limit).toBe(2);
    expect(formacao?.daily_limit).toBeNull();
  });

  it("vigília tem limite semanal de 1", () => {
    const vigilia = DEFAULT_ACTIVITIES.find((a) => a.name.includes("Vigília"));
    expect(vigilia?.weekly_limit).toBe(1);
    expect(vigilia?.points).toBe(25);
  });
});

describe("validateSignUpInput", () => {
  it("rejeita campos vazios", () => {
    expect(validateSignUpInput({}).valid).toBe(false);
  });

  it("rejeita senha curta", () => {
    expect(
      validateSignUpInput({ name: "Ana", email: "a@b.com", password: "123" })
        .valid,
    ).toBe(false);
  });

  it("aceita dados válidos", () => {
    expect(
      validateSignUpInput({
        name: "Ana",
        email: "a@b.com",
        password: "123456",
      }).valid,
    ).toBe(true);
  });
});

describe("validateSignInInput", () => {
  it("rejeita sem e-mail ou senha", () => {
    expect(validateSignInInput({ email: "a@b.com" }).valid).toBe(false);
  });

  it("aceita credenciais preenchidas", () => {
    expect(
      validateSignInInput({ email: "a@b.com", password: "secret" }).valid,
    ).toBe(true);
  });
});

describe("validateGroupName", () => {
  it("rejeita nome vazio", () => {
    expect(validateGroupName("  ").valid).toBe(false);
  });

  it("aceita nome válido", () => {
    expect(validateGroupName("Desafio Quaresma").valid).toBe(true);
  });
});

describe("validateCheckinTitle", () => {
  it("rejeita título vazio", () => {
    expect(validateCheckinTitle("").valid).toBe(false);
  });

  it("aceita título válido", () => {
    expect(validateCheckinTitle("Oração da manhã").valid).toBe(true);
  });
});
