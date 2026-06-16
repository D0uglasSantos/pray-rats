export type ErrorContext =
  | "checkin"
  | "auth"
  | "profile"
  | "group"
  | "upload"
  | "notification"
  | "generic";

interface MapActionErrorOptions {
  context?: ErrorContext;
  fallback?: string;
}

const CONTEXT_FALLBACKS: Record<ErrorContext, string> = {
  checkin: "Não foi possível registrar o check-in. Tente novamente.",
  auth: "Não foi possível concluir a autenticação. Tente novamente.",
  profile: "Não foi possível atualizar o perfil. Tente novamente.",
  group: "Não foi possível concluir a operação no grupo. Tente novamente.",
  upload: "Não foi possível enviar a foto. Verifique sua conexão e tente de novo.",
  notification: "Não foi possível carregar as notificações.",
  generic: "Algo deu errado. Tente novamente em instantes.",
};

export function mapActionError(
  error: unknown,
  options: MapActionErrorOptions = {},
): string {
  const context = options.context ?? "generic";
  const fallback = options.fallback ?? CONTEXT_FALLBACKS[context];

  if (!error) return fallback;

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : fallback;

  const lower = message.toLowerCase();

  if (
    lower.includes("jwt") ||
    lower.includes("not authenticated") ||
    lower.includes("invalid claim") ||
    lower.includes("session")
  ) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (lower.includes("23505") || lower.includes("duplicate") || lower.includes("unique")) {
    if (context === "checkin") {
      return "Você já atingiu o limite de check-ins para esta atividade.";
    }
    return "Este registro já existe.";
  }

  if (
    lower.includes("storage") ||
    lower.includes("upload") ||
    lower.includes("bucket") ||
    lower.includes("payload too large")
  ) {
    return CONTEXT_FALLBACKS.upload;
  }

  if (lower.includes("network") || lower.includes("fetch failed") || lower.includes("timeout")) {
    return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
  }

  if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("42501")) {
    return "Você não tem permissão para esta ação.";
  }

  if (lower.includes("invalid invite") || lower.includes("invalid_invite_code")) {
    return "Código de convite inválido.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    if (context === "auth") {
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    }
    return fallback;
  }

  if (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists")
  ) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (lower.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e spam).";
  }

  if (lower.includes("row-level security") || lower.includes("rls")) {
    return fallback;
  }

  if (message.length > 120 || message.includes("PGRST") || message.includes("SQL")) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[${context}]`, message);
    }
    return fallback;
  }

  return message;
}
