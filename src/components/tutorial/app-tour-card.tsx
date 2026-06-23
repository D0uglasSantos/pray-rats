"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { AppTourStep } from "@/lib/tutorial/app-tour-steps";
import { getAppTourProgressLabel } from "@/lib/tutorial/app-tour-steps";

export interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CardPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxWidth: number;
}

interface AppTourCardProps {
  step: AppTourStep;
  stepIndex: number;
  totalSteps: number;
  position: CardPosition;
  loading?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip: () => void;
  onWelcomeStart?: () => void;
  onWelcomeLater?: () => void;
  onFinalCheckin?: () => void;
  onFinalExplore?: () => void;
}

const FOCUSABLE =
  "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

export function AppTourCard({
  step,
  stepIndex,
  totalSteps,
  position,
  loading = false,
  onBack,
  onNext,
  onSkip,
  onWelcomeStart,
  onWelcomeLater,
  onFinalCheckin,
  onFinalExplore,
}: AppTourCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = "app-tour-card-title";
  const descriptionId = "app-tour-card-description";

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const focusable = card.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusable[0];
    if (first) first.focus();
    else card.focus();
  }, [step.id]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !card) return;

      const focusable = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.tabIndex !== -1 && !el.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    card.addEventListener("keydown", handleKeyDown);
    return () => card.removeEventListener("keydown", handleKeyDown);
  }, [step.id]);

  const progressLabel = getAppTourProgressLabel(stepIndex);
  const progressPercent =
    totalSteps > 1 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 100;
  const Icon = step.icon;

  const style: React.CSSProperties = {
    left: position.left,
    width: position.width,
    maxWidth: position.maxWidth,
    ...(position.top !== undefined ? { top: position.top } : {}),
    ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
  };

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      className={cn(
        "fixed z-[120] motion-reduce:transition-none",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200",
      )}
      style={style}
    >
      <Card
        padding="md"
        className="shadow-xl border-primary/20"
      >
      {progressLabel && !step.isWelcome && !step.isFinal && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{progressLabel}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full gradient-spiritual transition-[width] motion-reduce:transition-none duration-300"
              style={{ width: `${progressPercent}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <div className="h-10 w-10 rounded-xl gradient-spiritual flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-foreground leading-snug">
            {step.title}
          </h2>
        </div>
      </div>

      <div id={descriptionId} className="space-y-2 text-sm text-muted leading-relaxed mb-4">
        <p>{step.description}</p>
        {step.supplemental && <p className="text-xs">{step.supplemental}</p>}
      </div>

      {step.isWelcome ? (
        <div className="flex flex-col gap-2">
          <Button type="button" fullWidth onClick={onWelcomeStart} disabled={loading}>
            Começar tutorial
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={onWelcomeLater}
            disabled={loading}
          >
            Agora não
          </Button>
        </div>
      ) : step.isFinal ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            fullWidth
            onClick={onFinalCheckin}
            loading={loading}
            disabled={loading}
          >
            Fazer meu primeiro check-in
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onFinalExplore}
            loading={loading}
            disabled={loading}
          >
            Explorar o app
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={loading}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
              Voltar
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={loading}>
            Pular
          </Button>
          <Button type="button" size="sm" onClick={onNext} disabled={loading}>
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      </Card>
    </div>
  );
}

function parseSafeAreaBottom(): number {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("env(safe-area-inset-bottom)")
      .trim();
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function computeCardPosition(
  spotlight: SpotlightRect | null,
  step: AppTourStep,
  viewportWidth: number,
  viewportHeight: number,
): CardPosition {
  const margin = 16;
  const cardWidth = Math.min(448, viewportWidth - margin * 2);
  const left = Math.max(margin, (viewportWidth - cardWidth) / 2);
  const navSafeBottom = 88 + parseSafeAreaBottom();

  if (!step.target || !spotlight) {
    return {
      left,
      width: cardWidth,
      maxWidth: cardWidth,
      bottom: navSafeBottom + margin,
    };
  }

  const isNav = step.target.startsWith("nav-");
  const spaceBelow = viewportHeight - (spotlight.top + spotlight.height);

  if (isNav || step.placement === "top" || spaceBelow < 220) {
    const bottomFromTop = viewportHeight - spotlight.top + margin;
    return {
      left,
      width: cardWidth,
      maxWidth: cardWidth,
      bottom: Math.max(navSafeBottom + margin, bottomFromTop),
    };
  }

  if (step.placement === "bottom" || spotlight.top < 220) {
    return {
      left,
      width: cardWidth,
      maxWidth: cardWidth,
      top: spotlight.top + spotlight.height + margin,
    };
  }

  return {
    left,
    width: cardWidth,
    maxWidth: cardWidth,
    bottom: navSafeBottom + margin,
  };
}
