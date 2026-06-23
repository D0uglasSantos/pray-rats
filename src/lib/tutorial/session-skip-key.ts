import { CURRENT_APP_TOUR_VERSION } from "@/lib/tutorial/app-tour-version";

export function getAppTourSessionSkipKey(version = CURRENT_APP_TOUR_VERSION): string {
  return `prayrats-app-tour-skipped-v${version}`;
}

export function isAppTourSkippedInSession(version = CURRENT_APP_TOUR_VERSION): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(getAppTourSessionSkipKey(version)) === "1";
  } catch {
    return false;
  }
}

export function setAppTourSkippedInSession(version = CURRENT_APP_TOUR_VERSION): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(getAppTourSessionSkipKey(version), "1");
  } catch {
    // sessionStorage indisponível — ignorar
  }
}
