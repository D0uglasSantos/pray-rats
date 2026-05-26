/**
 * Datas alinhadas ao date_trunc do PostgreSQL (UTC).
 * Evita mismatch com views weekly_group_rankings / monthly_group_rankings.
 */
export function getPostgresWeekStart(date: Date = new Date()): Date {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = utc.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + mondayOffset);
  return utc;
}

export function getPostgresMonthStart(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getPostgresWeekStartISO(date?: Date): string {
  return getPostgresWeekStart(date).toISOString();
}

export function getPostgresMonthStartISO(date?: Date): string {
  return getPostgresMonthStart(date).toISOString();
}
