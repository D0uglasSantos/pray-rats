"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AppTourSkipDialogProps {
  open: boolean;
  loading?: boolean;
  onSkipForNow: () => void;
  onDismissForever: () => void;
  onContinue: () => void;
}

export function AppTourSkipDialog({
  open,
  loading = false,
  onSkipForNow,
  onDismissForever,
  onContinue,
}: AppTourSkipDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onContinue();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 motion-reduce:transition-none"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="app-tour-skip-title"
      aria-describedby="app-tour-skip-description"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface shadow-xl p-5 space-y-4 border border-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 id="app-tour-skip-title" className="text-lg font-semibold text-foreground">
            Pular o tutorial?
          </h2>
          <p id="app-tour-skip-description" className="text-sm text-muted leading-relaxed">
            Você poderá abrir este guia novamente pelo seu perfil.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={onSkipForNow}
          >
            Pular por agora
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={loading}
            onClick={onDismissForever}
            loading={loading}
          >
            Não mostrar novamente
          </Button>
          <Button type="button" variant="primary" fullWidth disabled={loading} onClick={onContinue}>
            Continuar tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}
