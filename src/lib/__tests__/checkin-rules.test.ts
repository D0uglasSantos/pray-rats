import { describe, it, expect } from "vitest";
import {
  evaluateCheckinLimits,
  filterPublicFeedCheckins,
  sumPoints,
} from "@/lib/checkin-rules";
import type { ActivityType } from "@/types/database";

const oracao: Pick<ActivityType, "name" | "points" | "daily_limit" | "weekly_limit"> = {
  name: "Oração pessoal",
  points: 5,
  daily_limit: 1,
  weekly_limit: null,
};

const formacao: Pick<ActivityType, "name" | "points" | "daily_limit" | "weekly_limit"> = {
  name: "Pregação/Formação",
  points: 10,
  daily_limit: null,
  weekly_limit: 2,
};

const vigilia: Pick<ActivityType, "name" | "points" | "daily_limit" | "weekly_limit"> = {
  name: "Vigília",
  points: 25,
  daily_limit: null,
  weekly_limit: 1,
};

describe("evaluateCheckinLimits", () => {
  it("permite check-in quando limites não foram atingidos", () => {
    const result = evaluateCheckinLimits(oracao, { daily: 0, weekly: 0 });
    expect(result).toEqual({ allowed: true, points: 5 });
  });

  it("bloqueia quando limite diário foi atingido", () => {
    const result = evaluateCheckinLimits(oracao, { daily: 1, weekly: 0 });
    expect(result.allowed).toBe(false);
    expect(result.points).toBe(0);
    expect(result.message).toContain("Limite diário");
    expect(result.message).toContain("Oração pessoal");
  });

  it("bloqueia quando limite semanal foi atingido", () => {
    const result = evaluateCheckinLimits(formacao, { daily: 0, weekly: 2 });
    expect(result.allowed).toBe(false);
    expect(result.message).toContain("Limite semanal");
    expect(result.message).toContain("2/semana");
  });

  it("permite vigília 1x por semana", () => {
    expect(evaluateCheckinLimits(vigilia, { daily: 0, weekly: 0 }).allowed).toBe(true);
    expect(evaluateCheckinLimits(vigilia, { daily: 0, weekly: 1 }).allowed).toBe(false);
  });

  it("ignora limite diário quando daily_limit é null", () => {
    const result = evaluateCheckinLimits(formacao, { daily: 99, weekly: 0 });
    expect(result.allowed).toBe(true);
    expect(result.points).toBe(10);
  });
});

describe("filterPublicFeedCheckins", () => {
  const checkins = [
    { id: "1", visibility: "public", status: "valid" },
    { id: "2", visibility: "private", status: "valid" },
    { id: "3", visibility: "public", status: "rejected" },
    { id: "4", visibility: "public", status: "valid" },
  ];

  it("retorna apenas check-ins públicos e válidos", () => {
    const feed = filterPublicFeedCheckins(checkins);
    expect(feed).toHaveLength(2);
    expect(feed.map((c) => c.id)).toEqual(["1", "4"]);
  });
});

describe("sumPoints", () => {
  it("soma pontos de check-ins válidos", () => {
    expect(sumPoints([{ points: 5 }, { points: 20 }, { points: 10 }])).toBe(35);
  });

  it("retorna 0 para lista vazia", () => {
    expect(sumPoints([])).toBe(0);
  });
});
