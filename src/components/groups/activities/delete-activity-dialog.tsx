"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DeleteActivityDialogProps {
  open: boolean;
  activityName: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteActivityDialog({
  open,
  activityName,
  description = "Essa atividade deixará de ficar disponível para novos check-ins. Se já existirem check-ins registrados, ela será apenas desativada.",
  onCancel,
  onConfirm,
  loading = false,
}: DeleteActivityDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-activity-title"
      aria-describedby="delete-activity-description"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface shadow-xl p-5 space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 id="delete-activity-title" className="text-lg font-semibold text-foreground">
            Excluir &ldquo;{activityName}&rdquo;?
          </h2>
          <p id="delete-activity-description" className="text-sm text-muted leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={loading}
            onClick={onConfirm}
          >
            Excluir atividade
          </Button>
        </div>
      </div>
    </div>
  );
}
