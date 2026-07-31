import { describe, it, expect } from "vitest";
import {
  REMINDER_SLOTS,
  getDueReminderSlot,
  getLocalDateString,
  getLocalDayRangeUtc,
  getLocalMinutes,
  isValidTimeZone,
} from "@/lib/reminders";

describe("getDueReminderSlot", () => {
  it("retorna o slot da manhã no horário alvo (9h)", () => {
    expect(getDueReminderSlot(9 * 60)?.slot).toBe("morning");
  });

  it("retorna o slot da tarde dentro da janela (15h30)", () => {
    expect(getDueReminderSlot(15 * 60 + 30)?.slot).toBe("afternoon");
  });

  it("retorna o slot da noite no fim da janela (20h59)", () => {
    expect(getDueReminderSlot(20 * 60 + 59)?.slot).toBe("evening");
  });

  it("retorna null antes do primeiro slot (8h59)", () => {
    expect(getDueReminderSlot(8 * 60 + 59)).toBeNull();
  });

  it("retorna null depois que a janela do slot fecha (10h)", () => {
    expect(getDueReminderSlot(10 * 60)).toBeNull();
  });

  it("retorna null entre a janela da tarde e o slot da noite (16h)", () => {
    expect(getDueReminderSlot(16 * 60)).toBeNull();
  });

  it("retorna null tarde da noite (23h)", () => {
    expect(getDueReminderSlot(23 * 60)).toBeNull();
  });

  it("cobre todos os slots definidos ao longo do dia", () => {
    for (const config of REMINDER_SLOTS) {
      const target = config.hour * 60 + config.minute;
      expect(getDueReminderSlot(target)?.slot).toBe(config.slot);
    }
  });
});

describe("isValidTimeZone", () => {
  it("aceita fuso IANA válido", () => {
    expect(isValidTimeZone("America/Sao_Paulo")).toBe(true);
  });

  it("rejeita fuso inválido", () => {
    expect(isValidTimeZone("Marte/Olimpo")).toBe(false);
  });
});

describe("getLocalMinutes", () => {
  const now = new Date("2026-07-31T12:30:00Z");

  it("converte UTC para America/Sao_Paulo (UTC-3)", () => {
    expect(getLocalMinutes(now, "America/Sao_Paulo")).toBe(9 * 60 + 30);
  });

  it("converte UTC para Asia/Tokyo (UTC+9)", () => {
    expect(getLocalMinutes(now, "Asia/Tokyo")).toBe(21 * 60 + 30);
  });

  it("retorna null para fuso inválido", () => {
    expect(getLocalMinutes(now, "Invalid/Zone")).toBeNull();
  });
});

describe("getLocalDateString", () => {
  it("respeita a data local mesmo quando o dia UTC já virou", () => {
    // 22h de 31/07 em São Paulo, mas 01h de 01/08 em UTC
    const now = new Date("2026-08-01T01:00:00Z");
    expect(getLocalDateString(now, "America/Sao_Paulo")).toBe("2026-07-31");
  });

  it("retorna null para fuso inválido", () => {
    expect(getLocalDateString(new Date(), "Invalid/Zone")).toBeNull();
  });
});

describe("getLocalDayRangeUtc", () => {
  it("mapeia o dia local de São Paulo para o intervalo UTC correto", () => {
    const now = new Date("2026-07-31T15:00:00Z"); // 12h em SP
    const range = getLocalDayRangeUtc(now, "America/Sao_Paulo");

    expect(range).not.toBeNull();
    expect(range!.localDate).toBe("2026-07-31");
    expect(range!.start.toISOString()).toBe("2026-07-31T03:00:00.000Z");
    expect(range!.end.toISOString()).toBe("2026-08-01T03:00:00.000Z");
  });

  it("o intervalo contém o instante atual", () => {
    const now = new Date("2026-07-31T15:00:00Z");
    const range = getLocalDayRangeUtc(now, "America/Sao_Paulo");

    expect(range!.start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(range!.end.getTime()).toBeGreaterThan(now.getTime());
  });

  it("retorna null para fuso inválido", () => {
    expect(getLocalDayRangeUtc(new Date(), "Invalid/Zone")).toBeNull();
  });
});
