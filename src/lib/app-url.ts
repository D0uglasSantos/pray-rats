/** URL base do app, com correção de typos comuns em NEXT_PUBLIC_APP_URL */
export function getAppUrl(): string {
  let url = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();

  // Corrige erros de digitação frequentes no protocolo
  url = url.replace(/^hhtps:\/\//i, "https://");
  url = url.replace(/^htps:\/\//i, "https://");
  url = url.replace(/^httpss:\/\//i, "https://");

  // Remove barra final
  url = url.replace(/\/$/, "");

  return url;
}

export function appInviteUrl(inviteCode: string): string {
  return `${getAppUrl()}/invite/${inviteCode}`;
}
