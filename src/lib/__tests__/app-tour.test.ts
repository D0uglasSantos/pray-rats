import { describe, it, expect } from "vitest";
import { CURRENT_APP_TOUR_VERSION } from "@/lib/tutorial/app-tour-version";
import { normalizeAppTourStep } from "@/lib/tutorial/normalize-app-tour-step";
import { APP_TOUR_STEP_COUNT } from "@/lib/tutorial/app-tour-steps";
import { shouldStartAppTour } from "@/lib/tutorial/should-start-app-tour";
import type { AppTourState } from "@/types/database";

function state(
  partial: Partial<AppTourState> & Pick<AppTourState, "status">,
): AppTourState {
  return {
    version: partial.version ?? CURRENT_APP_TOUR_VERSION,
    status: partial.status,
    step: partial.step ?? 0,
  };
}

describe("shouldStartAppTour", () => {
  it("não inicia sem grupos", () => {
    expect(
      shouldStartAppTour(state({ status: "pending" }), CURRENT_APP_TOUR_VERSION, false),
    ).toBe(false);
  });

  it("inicia quando pending na versão atual", () => {
    expect(
      shouldStartAppTour(state({ status: "pending" }), CURRENT_APP_TOUR_VERSION, true),
    ).toBe(true);
  });

  it("inicia quando in_progress na versão atual", () => {
    expect(
      shouldStartAppTour(
        state({ status: "in_progress", step: 2 }),
        CURRENT_APP_TOUR_VERSION,
        true,
      ),
    ).toBe(true);
  });

  it("não inicia quando completed na versão atual", () => {
    expect(
      shouldStartAppTour(state({ status: "completed" }), CURRENT_APP_TOUR_VERSION, true),
    ).toBe(false);
  });

  it("não inicia quando dismissed na versão atual", () => {
    expect(
      shouldStartAppTour(state({ status: "dismissed" }), CURRENT_APP_TOUR_VERSION, true),
    ).toBe(false);
  });

  it("inicia quando a versão do perfil é menor que a versão atual", () => {
    expect(
      shouldStartAppTour(
        state({ status: "completed", version: 0 }),
        CURRENT_APP_TOUR_VERSION,
        true,
      ),
    ).toBe(true);
  });

  it("inicia quando dismissed em versão antiga", () => {
    expect(
      shouldStartAppTour(
        state({ status: "dismissed", version: CURRENT_APP_TOUR_VERSION - 1 }),
        CURRENT_APP_TOUR_VERSION,
        true,
      ),
    ).toBe(true);
  });
});

describe("normalizeAppTourStep", () => {
  it("retorna 0 para step negativo", () => {
    expect(normalizeAppTourStep(-3, APP_TOUR_STEP_COUNT)).toBe(0);
  });

  it("retorna 0 para step fora do intervalo", () => {
    expect(normalizeAppTourStep(99, APP_TOUR_STEP_COUNT)).toBe(0);
  });

  it("mantém step válido", () => {
    expect(normalizeAppTourStep(3, APP_TOUR_STEP_COUNT)).toBe(3);
  });

  it("retorna 0 quando totalSteps é zero", () => {
    expect(normalizeAppTourStep(2, 0)).toBe(0);
  });

  it("retorna 0 para NaN", () => {
    expect(normalizeAppTourStep(Number.NaN, APP_TOUR_STEP_COUNT)).toBe(0);
  });
});
