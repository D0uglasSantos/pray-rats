const SPORT_KEYWORDS = [
  "corrida",
  "caminhada",
  "pedal",
  "ciclismo",
  "natação",
  "natacao",
  "esporte",
  "academia",
  "treino",
];

export function isSportActivity(activityName: string): boolean {
  const lower = activityName.toLowerCase();
  return SPORT_KEYWORDS.some((keyword) => lower.includes(keyword));
}
