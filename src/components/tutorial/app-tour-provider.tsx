"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  completeAppTour,
  dismissAppTour,
  updateAppTourProgress,
} from "@/actions/app-tour";
import { AppTourOverlay } from "@/components/tutorial/app-tour-overlay";
import {
  AppTourCard,
  computeCardPosition,
  type CardPosition,
  type SpotlightRect,
} from "@/components/tutorial/app-tour-card";
import { AppTourSkipDialog } from "@/components/tutorial/app-tour-skip-dialog";
import { useToast } from "@/components/ui/toast";
import { CURRENT_APP_TOUR_VERSION } from "@/lib/tutorial/app-tour-version";
import {
  APP_TOUR_STEPS,
  APP_TOUR_STEP_COUNT,
} from "@/lib/tutorial/app-tour-steps";
import { normalizeAppTourStep } from "@/lib/tutorial/normalize-app-tour-step";
import {
  isAppTourSkippedInSession,
  setAppTourSkippedInSession,
} from "@/lib/tutorial/session-skip-key";
import { shouldStartAppTour } from "@/lib/tutorial/should-start-app-tour";
import type { AppTourState } from "@/types/database";

interface AppTourContextValue {
  startReplay: () => void;
}

const AppTourContext = createContext<AppTourContextValue | null>(null);

interface AppTourProviderProps {
  children: ReactNode;
  initialState: AppTourState;
  hasGroups?: boolean;
}

export function AppTourProvider({
  children,
  initialState,
  hasGroups = true,
}: AppTourProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [tourState, setTourState] = useState<AppTourState>(initialState);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [persistLoading, setPersistLoading] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const replayHandledRef = useRef(false);
  const autoStartHandledRef = useRef(false);

  const currentStep = APP_TOUR_STEPS[stepIndex];

  const cardPosition = useMemo((): CardPosition => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 390;
    const vh = typeof window !== "undefined" ? window.innerHeight : 844;
    return computeCardPosition(spotlightRect, currentStep, vw, vh);
  }, [spotlightRect, currentStep]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    setSkipDialogOpen(false);
    setIsReplayMode(false);
  }, []);

  const restoreFocus = useCallback(() => {
    const prev = previousFocusRef.current;
    if (prev && document.contains(prev)) {
      prev.focus();
    }
    previousFocusRef.current = null;
  }, []);

  const openTourAt = useCallback((index: number, replay = false) => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setStepIndex(normalizeAppTourStep(index, APP_TOUR_STEP_COUNT));
    setIsReplayMode(replay);
    setIsOpen(true);
  }, []);

  const persistStep = useCallback(
    async (index: number) => {
      if (isReplayMode) return;
      const result = await updateAppTourProgress(index);
      if (result.success && result.data) {
        setTourState(result.data);
      }
    },
    [isReplayMode],
  );

  const goToStep = useCallback(
    (index: number) => {
      const normalized = normalizeAppTourStep(index, APP_TOUR_STEP_COUNT);
      setStepIndex(normalized);
      void persistStep(normalized);
    },
    [persistStep],
  );

  const handleComplete = useCallback(
    async (navigateTo?: string) => {
      setPersistLoading(true);
      const result = await completeAppTour();
      setPersistLoading(false);

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      if (result.data) setTourState(result.data);
      closeTour();
      restoreFocus();
      if (navigateTo) router.push(navigateTo);
    },
    [closeTour, restoreFocus, router, showToast],
  );

  const handleDismissForever = useCallback(async () => {
    setPersistLoading(true);
    const result = await dismissAppTour();
    setPersistLoading(false);

    if (!result.success) {
      showToast(result.error, "error");
      return;
    }

    if (result.data) setTourState(result.data);
    closeTour();
    restoreFocus();
  }, [closeTour, restoreFocus, showToast]);

  const handleSkipForNow = useCallback(() => {
    setAppTourSkippedInSession(CURRENT_APP_TOUR_VERSION);
    setSkipDialogOpen(false);
    closeTour();
    restoreFocus();
  }, [closeTour, restoreFocus]);

  const handleSkipRequest = useCallback(() => {
    setSkipDialogOpen(true);
  }, []);

  const startReplay = useCallback(() => {
    router.push("/home?tour=replay");
  }, [router]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !skipDialogOpen) {
        event.preventDefault();
        setSkipDialogOpen(true);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, skipDialogOpen]);

  useEffect(() => {
    if (pathname !== "/home" || !hasGroups) return;
    if (replayHandledRef.current) return;

    const tourParam = searchParams.get("tour");
    if (tourParam === "replay") {
      replayHandledRef.current = true;
      autoStartHandledRef.current = true;
      router.replace("/home", { scroll: false });
      const timer = window.setTimeout(() => {
        openTourAt(0, true);
      }, 300);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, hasGroups, searchParams, router, openTourAt]);

  useEffect(() => {
    if (pathname !== "/home" || !hasGroups) return;
    if (autoStartHandledRef.current) return;
    if (searchParams.get("tour") === "replay") return;

    autoStartHandledRef.current = true;

    const timer = window.setTimeout(() => {
      if (replayHandledRef.current) return;
      if (isAppTourSkippedInSession(CURRENT_APP_TOUR_VERSION)) return;
      if (!shouldStartAppTour(tourState, CURRENT_APP_TOUR_VERSION, hasGroups)) return;

      const startStep =
        tourState.status === "in_progress"
          ? normalizeAppTourStep(tourState.step, APP_TOUR_STEP_COUNT)
          : 0;

      openTourAt(startStep, false);

      if (tourState.status === "pending") {
        void persistStep(startStep);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pathname, hasGroups, searchParams, tourState, openTourAt, persistStep]);

  const contextValue = useMemo(
    () => ({
      startReplay,
    }),
    [startReplay],
  );

  return (
    <AppTourContext.Provider value={contextValue}>
      {children}

      {isOpen && (
        <>
          <AppTourOverlay
            targetId={currentStep.target}
            fallbackTargetId={currentStep.fallbackTarget}
            visible={isOpen}
            onRectChange={setSpotlightRect}
          />

          <AppTourCard
            step={currentStep}
            stepIndex={stepIndex}
            totalSteps={APP_TOUR_STEP_COUNT}
            position={cardPosition}
            loading={persistLoading}
            onBack={
              stepIndex > 0 && !currentStep.isWelcome
                ? () => goToStep(stepIndex - 1)
                : undefined
            }
            onNext={() => {
              if (stepIndex < APP_TOUR_STEP_COUNT - 1) {
                goToStep(stepIndex + 1);
              }
            }}
            onSkip={handleSkipRequest}
            onWelcomeStart={() => goToStep(1)}
            onWelcomeLater={handleSkipRequest}
            onFinalCheckin={() => void handleComplete("/check-in")}
            onFinalExplore={() => void handleComplete()}
          />

          <AppTourSkipDialog
            open={skipDialogOpen}
            loading={persistLoading}
            onSkipForNow={handleSkipForNow}
            onDismissForever={() => void handleDismissForever()}
            onContinue={() => setSkipDialogOpen(false)}
          />
        </>
      )}
    </AppTourContext.Provider>
  );
}

export function useAppTour() {
  const ctx = useContext(AppTourContext);
  if (!ctx) {
    throw new Error("useAppTour must be used within AppTourProvider");
  }
  return ctx;
}
