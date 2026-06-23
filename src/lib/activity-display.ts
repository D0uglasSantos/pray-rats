import type { ActivityDraft } from "@/lib/activity-drafts";
import type { ActivityType } from "@/types/database";

export interface ActivityFormValues {
  name: string;
  description: string | null;
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  is_private_default: boolean;
}

export type ActivityFilter = "all" | "active" | "inactive" | "private";

export function createDefaultFormValues(): ActivityFormValues {
  return {
    name: "",
    description: null,
    points: 5,
    daily_limit: 1,
    weekly_limit: null,
    is_active: true,
    is_private_default: false,
  };
}

export function activityTypeToFormValues(activity: ActivityType): ActivityFormValues {
  return {
    name: activity.name,
    description: activity.description,
    points: activity.points,
    daily_limit: activity.daily_limit,
    weekly_limit: activity.weekly_limit,
    is_active: activity.is_active,
    is_private_default: activity.is_private_default,
  };
}

export function draftToFormValues(draft: ActivityDraft): ActivityFormValues {
  return {
    name: draft.name,
    description: draft.description,
    points: draft.points,
    daily_limit: draft.daily_limit,
    weekly_limit: draft.weekly_limit,
    is_active: draft.is_active,
    is_private_default: draft.is_private_default,
  };
}

export function formValuesToDraft(
  values: ActivityFormValues,
  clientId: string,
): ActivityDraft {
  return { clientId, ...values };
}

export function formatDailyLimit(limit: number | null): string {
  if (limit === null) return "Sem limite diário";
  if (limit === 1) return "1 por dia";
  return `${limit} por dia`;
}

export function formatWeeklyLimit(limit: number | null): string {
  if (limit === null) return "Sem limite semanal";
  if (limit === 1) return "1 por semana";
  return `${limit} por semana`;
}

export function formatPrivacyLabel(isPrivateDefault: boolean): string {
  return isPrivateDefault ? "Privada por padrão" : "Pública por padrão";
}

export function formatActivitySummary(activity: {
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
}): string {
  return `${activity.points} pontos · ${formatDailyLimit(activity.daily_limit)} · ${formatWeeklyLimit(activity.weekly_limit)}`;
}

export function validateActivityFormValues(values: ActivityFormValues): string | null {
  if (!values.name.trim()) return "Informe o nome da atividade.";
  if (!Number.isFinite(values.points) || values.points < 0) {
    return "Informe uma pontuação válida.";
  }
  if (values.daily_limit !== null && values.daily_limit < 1) {
    return "Limite diário inválido.";
  }
  if (values.weekly_limit !== null && values.weekly_limit < 1) {
    return "Limite semanal inválido.";
  }
  return null;
}

export const DAILY_LIMIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Sem limite diário" },
  { value: "1", label: "1 check-in por dia" },
  { value: "2", label: "2 check-ins por dia" },
  { value: "3", label: "3 check-ins por dia" },
  { value: "5", label: "5 check-ins por dia" },
];

export const WEEKLY_LIMIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Sem limite semanal" },
  { value: "1", label: "1 vez por semana" },
  { value: "2", label: "2 vezes por semana" },
  { value: "3", label: "3 vezes por semana" },
  { value: "4", label: "4 vezes por semana" },
];

export function limitToSelectValue(limit: number | null): string {
  return limit === null ? "" : String(limit);
}

export function selectValueToLimit(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
}

export function matchesActivityFilter(
  activity: { is_active: boolean; is_private_default: boolean },
  filter: ActivityFilter,
): boolean {
  switch (filter) {
    case "active":
      return activity.is_active;
    case "inactive":
      return !activity.is_active;
    case "private":
      return activity.is_private_default;
    default:
      return true;
  }
}

export const ACTIVITY_LIST_PAGE_SIZE = 5;

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, totalItems),
  };
}
