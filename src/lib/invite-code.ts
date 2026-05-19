const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8, random = Math.random): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += INVITE_CHARS.charAt(
      Math.floor(random() * INVITE_CHARS.length),
    );
  }
  return code;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidInviteCodeFormat(code: string): boolean {
  const normalized = normalizeInviteCode(code);
  return /^[A-Z0-9]{4,20}$/.test(normalized);
}
