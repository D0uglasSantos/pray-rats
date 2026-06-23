import type { AppTourState } from "@/types/database";

export function shouldStartAppTour(
  state: AppTourState,
  currentVersion: number,
  hasGroups = true,
): boolean {
  if (!hasGroups) return false;

  if (state.version < currentVersion) return true;

  if (state.version === currentVersion) {
    return state.status === "pending" || state.status === "in_progress";
  }

  return false;
}
