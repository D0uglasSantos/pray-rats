export function memberProfilePath(userId: string, month?: string): string {
  const base = `/group/member/${userId}`;
  if (!month) return base;
  return `${base}?month=${month}`;
}
