import { DEFAULT_ACTIVITIES } from "@/lib/constants/activities";

export interface ActivityDraft {
  clientId: string;
  name: string;
  description: string | null;
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  is_private_default: boolean;
}

export type ActivityDraftInput = Omit<ActivityDraft, "clientId">;

export function createDefaultActivityDrafts(): ActivityDraft[] {
  return DEFAULT_ACTIVITIES.map((activity, index) => ({
    clientId: `default-${index}`,
    name: activity.name,
    description: activity.description,
    points: activity.points,
    daily_limit: activity.daily_limit,
    weekly_limit: activity.weekly_limit,
    is_active: true,
    is_private_default: activity.is_private_default,
  }));
}

function isValidLimit(value: unknown): value is number | null {
  if (value === null || value === undefined || value === "") return true;
  return typeof value === "number" && Number.isFinite(value) && value >= 1;
}

function isActivityDraftInput(value: unknown): value is ActivityDraftInput {
  if (!value || typeof value !== "object") return false;

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.name === "string" &&
    (typeof draft.description === "string" || draft.description === null) &&
    typeof draft.points === "number" &&
    Number.isFinite(draft.points) &&
    draft.points >= 0 &&
    isValidLimit(draft.daily_limit) &&
    isValidLimit(draft.weekly_limit) &&
    typeof draft.is_active === "boolean" &&
    typeof draft.is_private_default === "boolean"
  );
}

export function parseActivityDraftsJson(
  raw: FormDataEntryValue | null,
): ActivityDraftInput[] | null {
  if (!raw || typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    if (!parsed.every(isActivityDraftInput)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function validateActivityDrafts(drafts: ActivityDraftInput[]): string | null {
  if (drafts.length === 0) {
    return "Adicione ao menos uma atividade.";
  }

  const activeDrafts = drafts.filter((draft) => draft.is_active);

  if (activeDrafts.length === 0) {
    return "Ative ao menos uma atividade para o check-in.";
  }

  for (const draft of drafts) {
    if (!draft.name.trim()) {
      return "Todas as atividades precisam de um nome.";
    }
  }

  return null;
}

export function serializeActivityDrafts(
  drafts: ActivityDraft[],
): ActivityDraftInput[] {
  return drafts.map(({ clientId: _clientId, ...draft }) => draft);
}
