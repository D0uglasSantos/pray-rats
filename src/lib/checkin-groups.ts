import type { ActivityType, GroupWithRole } from "@/types/database";

export interface GroupActivityOption {
  group: GroupWithRole;
  activity: ActivityType | null;
  unavailableReason?: string;
}

export function resolveActivityByName(
  activities: ActivityType[],
  activityName: string,
): ActivityType | null {
  return (
    activities.find(
      (activity) =>
        activity.is_active &&
        activity.name.localeCompare(activityName, "pt-BR", { sensitivity: "accent" }) === 0,
    ) ?? null
  );
}

export function buildGroupActivityOptions(
  groups: GroupWithRole[],
  activitiesByGroupId: Record<string, ActivityType[]>,
  activityName: string | null,
): GroupActivityOption[] {
  return groups.map((group) => {
    const activities = activitiesByGroupId[group.id] ?? [];
    if (!activityName) {
      return { group, activity: null };
    }

    const activity = resolveActivityByName(activities, activityName);
    if (!activity) {
      return {
        group,
        activity: null,
        unavailableReason: `Atividade "${activityName}" não existe neste grupo.`,
      };
    }

    return { group, activity };
  });
}

export function parseGroupIdsFromForm(formData: FormData): string[] {
  const values = formData.getAll("group_ids").map(String).filter(Boolean);
  if (values.includes("all")) {
    return [];
  }
  return values;
}

export function normalizeSelectedGroupIds(
  selectedGroupIds: string[],
  allGroupIds: string[],
): string[] {
  if (selectedGroupIds.length === 0 || selectedGroupIds.includes("all")) {
    return allGroupIds;
  }

  const allowed = new Set(allGroupIds);
  return selectedGroupIds.filter((groupId) => allowed.has(groupId));
}
