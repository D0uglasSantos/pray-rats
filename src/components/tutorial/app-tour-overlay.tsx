"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpotlightRect } from "@/components/tutorial/app-tour-card";

const SPOTLIGHT_PADDING = 8;

interface AppTourOverlayProps {
  targetId?: string;
  fallbackTargetId?: string;
  visible: boolean;
  onRectChange: (rect: SpotlightRect | null) => void;
}

function measureTarget(targetId?: string, fallbackTargetId?: string): SpotlightRect | null {
  const el =
    (targetId
      ? document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`)
      : null) ??
    (fallbackTargetId
      ? document.querySelector<HTMLElement>(`[data-tour-id="${fallbackTargetId}"]`)
      : null);

  if (!el) return null;

  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

export function AppTourOverlay({
  targetId,
  fallbackTargetId,
  visible,
  onRectChange,
}: AppTourOverlayProps) {
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const update = useCallback(() => {
    if (!visible || !targetId) {
      setSpotlight(null);
      onRectChange(null);
      return;
    }

    const el =
      document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`) ??
      (fallbackTargetId
        ? document.querySelector<HTMLElement>(`[data-tour-id="${fallbackTargetId}"]`)
        : null);

    if (el) {
      const rect = el.getBoundingClientRect();
      const outOfView = rect.bottom < 0 || rect.top > window.innerHeight;
      if (outOfView) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }

    const measured = measureTarget(targetId, fallbackTargetId);
    setSpotlight(measured);
    onRectChange(measured);
  }, [visible, targetId, fallbackTargetId, onRectChange]);

  useEffect(() => {
    if (!visible) {
      onRectChange(null);
      return;
    }

    const initialRaf = requestAnimationFrame(() => update());

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    let observer: ResizeObserver | null = null;
    const targetEl =
      document.querySelector(`[data-tour-id="${targetId}"]`) ??
      (fallbackTargetId ? document.querySelector(`[data-tour-id="${fallbackTargetId}"]`) : null);

    if (targetEl && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(targetEl);
    }

    const timer = window.setInterval(update, 400);

    return () => {
      cancelAnimationFrame(initialRaf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
      window.clearInterval(timer);
    };
  }, [visible, targetId, fallbackTargetId, update, onRectChange]);

  if (!visible) return null;

  const activeSpotlight = targetId ? spotlight : null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto" aria-hidden="true">
      {activeSpotlight ? (
        <>
          <div
            className="fixed bg-black/55 motion-reduce:transition-none"
            style={{ top: 0, left: 0, width: vw, height: activeSpotlight.top }}
          />
          <div
            className="fixed bg-black/55 motion-reduce:transition-none"
            style={{
              top: activeSpotlight.top,
              left: 0,
              width: activeSpotlight.left,
              height: activeSpotlight.height,
            }}
          />
          <div
            className="fixed bg-black/55 motion-reduce:transition-none"
            style={{
              top: activeSpotlight.top,
              left: activeSpotlight.left + activeSpotlight.width,
              width: vw - activeSpotlight.left - activeSpotlight.width,
              height: activeSpotlight.height,
            }}
          />
          <div
            className="fixed bg-black/55 motion-reduce:transition-none"
            style={{
              top: activeSpotlight.top + activeSpotlight.height,
              left: 0,
              width: vw,
              height: vh - activeSpotlight.top - activeSpotlight.height,
            }}
          />
          <div
            className="fixed rounded-xl ring-2 ring-primary shadow-[0_0_0_4px_rgba(var(--color-primary-rgb,99,102,241),0.25)] motion-reduce:transition-none pointer-events-none"
            style={{
              top: activeSpotlight.top,
              left: activeSpotlight.left,
              width: activeSpotlight.width,
              height: activeSpotlight.height,
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/55 motion-reduce:transition-none" />
      )}
    </div>
  );
}
