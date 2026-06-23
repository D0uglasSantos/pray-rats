export function findTourTarget(
  primary?: string,
  fallback?: string,
): HTMLElement | null {
  if (primary) {
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${primary}"]`);
    if (el) return el;
  }
  if (fallback) {
    return document.querySelector<HTMLElement>(`[data-tour-id="${fallback}"]`);
  }
  return null;
}

export function isNavTourTarget(targetId?: string): boolean {
  return Boolean(targetId?.startsWith("nav-"));
}
