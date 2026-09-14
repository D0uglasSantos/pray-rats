const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeSupportEmail(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

export function getSupportEmail(): string | null {
  return normalizeSupportEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
}

export function buildSupportMailto(email: string, subject = "Suporte PrayRats"): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
