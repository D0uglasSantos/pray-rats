/** Janela de histórico para stats/recordes na UI (≈13 meses). */
export const STATS_LOOKBACK_DAYS = 395;

/** Janela para cálculo de streak (dias consecutivos). */
export const STREAK_LOOKBACK_DAYS = 366;

export function statsLookbackDate(reference: Date = new Date()): Date {
  const date = new Date(reference);
  date.setDate(date.getDate() - STATS_LOOKBACK_DAYS);
  return date;
}

export function streakLookbackDate(reference: Date = new Date()): Date {
  const date = new Date(reference);
  date.setDate(date.getDate() - STREAK_LOOKBACK_DAYS);
  return date;
}
