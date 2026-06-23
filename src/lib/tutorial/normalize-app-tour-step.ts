export function normalizeAppTourStep(step: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  if (!Number.isFinite(step) || step < 0) return 0;
  if (step >= totalSteps) return 0;
  return Math.floor(step);
}
