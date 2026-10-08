const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEFAULT_SUPPORT_EMAIL = "prayratscontact@gmail.com";

export function normalizeSupportEmail(value: string | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && EMAIL_PATTERN.test(email) ? email : null;
}

export function resolveSupportEmail(value: string | undefined): string {
  return normalizeSupportEmail(value) ?? DEFAULT_SUPPORT_EMAIL;
}

export function getSupportEmail(): string {
  return resolveSupportEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
}

export function buildSupportMailto(email: string, subject = "Suporte PrayRats"): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
