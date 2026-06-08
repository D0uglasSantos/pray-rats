export function toDatetimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocalValue(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateCheckinDatetime(date: Date): string | null {
  if (date.getTime() > Date.now()) {
    return "A data não pode ser no futuro.";
  }
  return null;
}

export type ParsedCheckedInAtResult =
  | { ok: true; iso: string }
  | { ok: false; error: string };

export function parseCheckedInAtInput(
  raw: string | null | undefined,
): ParsedCheckedInAtResult {
  const parsed = parseDatetimeLocalValue(raw);
  if (!parsed) {
    return { ok: false, error: "Informe a data e hora do check-in." };
  }

  const validationError = validateCheckinDatetime(parsed);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  return { ok: true, iso: parsed.toISOString() };
}
