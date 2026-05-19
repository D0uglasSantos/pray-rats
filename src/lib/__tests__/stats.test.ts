import { describe, it, expect } from "vitest";
import {
  computeUserStatsFromCheckins,
  buildRanking,
  getRankingPosition,
} from "@/lib/stats";

describe("computeUserStatsFromCheckins", () => {
  const ref = new Date("2026-05-19T12:00:00");

  const checkins = [
    {
      points: 5,
      checked_in_at: "2026-05-19T08:00:00",
      activity_type: { name: "Oração pessoal" },
    },
    {
      points: 20,
      checked_in_at: "2026-05-18T10:00:00",
      activity_type: { name: "Santa Missa" },
    },
    {
      points: 5,
      checked_in_at: "2026-05-18T20:00:00",
      activity_type: { name: "Oração pessoal" },
    },
    {
      points: 10,
      checked_in_at: "2026-04-10T10:00:00",
      activity_type: { name: "Terço" },
    },
  ];

  it("calcula totais corretamente", () => {
    const stats = computeUserStatsFromCheckins(checkins, ref);
    expect(stats.totalCheckins).toBe(4);
    expect(stats.totalPoints).toBe(40);
  });

  it("identifica atividade mais praticada", () => {
    const stats = computeUserStatsFromCheckins(checkins, ref);
    expect(stats.topActivity).toEqual({ name: "Oração pessoal", count: 2 });
  });

  it("conta dias únicos com check-in no mês", () => {
    const stats = computeUserStatsFromCheckins(checkins, ref);
    expect(stats.daysThisMonth).toBe(2); // 18 e 19 de maio
  });
});

describe("buildRanking", () => {
  it("agrega pontos por usuário e ordena desc", () => {
    const entries = [
      { user_id: "u1", name: "Ana", avatar_url: null, points: 10 },
      { user_id: "u2", name: "João", avatar_url: null, points: 25 },
      { user_id: "u1", name: "Ana", avatar_url: null, points: 5 },
      { user_id: "u3", name: "Maria", avatar_url: null, points: 15 },
    ];

    const ranking = buildRanking(entries);
    expect(ranking[0].user_id).toBe("u2");
    expect(ranking[0].total_points).toBe(25);
    expect(ranking[1].user_id).toBe("u1");
    expect(ranking[1].total_points).toBe(15);
    expect(ranking[1].total_checkins).toBe(2);
  });
});

describe("getRankingPosition", () => {
  it("retorna posição 1-based", () => {
    const ranking = [{ user_id: "a" }, { user_id: "b" }, { user_id: "c" }];
    expect(getRankingPosition(ranking, "b")).toBe(2);
  });

  it("retorna null se usuário não está no ranking", () => {
    expect(getRankingPosition([{ user_id: "a" }], "z")).toBeNull();
  });
});
